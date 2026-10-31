import { supabaseAdmin } from '../database/client';
import { v4 as uuidv4 } from 'uuid';
import { completeJson } from '../ai/groq';
import crypto from 'crypto';

/**
 * Fraud detection — enforces the one-person-one-account policy.
 *
 * Proven, working signals only (a server cannot see a client's MAC
 * address — browsers never send it — so we use what is observable):
 *   - email / phone / national ID reuse across merchant accounts
 *   - signup IP address shared with other accounts (proxy-aware)
 *   - device fingerprint (client-collected hash: UA + screen + timezone)
 *   - signup velocity from one IP
 *   - disposable / throwaway email domains
 *   - business-name similarity to an existing merchant
 *
 * A Groq-hosted open-source model reviews the combined signal set and
 * can raise (never lower) the rule-based score. Below threshold →
 * allowed; at/above → registration is blocked and the applicant is
 * directed to request a manual multi-account review.
 */

export interface SignupSignals {
  email: string;
  phone?: string;
  businessName: string;
  ip?: string;
  deviceFingerprint?: string;
  nationalId?: string;
}

export interface ScanResult {
  verdict: 'clear' | 'review';
  score: number; // 0-100
  signals: { type: string; detail: string; weight: number }[];
  aiSummary?: string;
}

const BLOCK_THRESHOLD = 40;

// Common throwaway email providers — local context included
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', 'guerrillamail.com', 'mailinator.com', '10minutemail.com',
  'yopmail.com', 'throwawaymail.com', 'fakeinbox.com', 'sharklasers.com',
  'getnada.com', 'temp-mail.org', 'dispostable.com',
]);

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Cheap bigram similarity — enough for "same name, small tweaks". */
function nameSimilarity(a: string, b: string): number {
  const x = normalise(a);
  const y = normalise(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const bigrams = (s: string) => {
    const set = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
    return set;
  };
  const A = bigrams(x), B = bigrams(y);
  let overlap = 0;
  for (const g of A) if (B.has(g)) overlap++;
  return (2 * overlap) / (A.size + B.size);
}

/**
 * Scan a prospective merchant signup. Persists every signal found so
 * later signups can be matched against them (IP/fingerprint history
 * lives in fraud_signals).
 */
export async function scanSignup(input: SignupSignals): Promise<ScanResult> {
  const signals: ScanResult['signals'] = [];

  // 1. Email already registered — hard duplicate
  const { data: emailHit } = await supabaseAdmin
    .from('merchants')
    .select('id')
    .eq('business_email', input.email)
    .limit(1);
  if (emailHit && emailHit.length > 0) {
    signals.push({ type: 'duplicate_email', detail: 'Email already registered to a merchant', weight: 100 });
  }

  // 2. Phone shared with another merchant
  if (input.phone) {
    const { data: phoneHit } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('business_phone', input.phone)
      .limit(1);
    if (phoneHit && phoneHit.length > 0) {
      signals.push({ type: 'shared_phone', detail: 'Phone number belongs to an existing merchant', weight: 45 });
    }
  }

  // 3. National ID reuse (when collected)
  if (input.nationalId) {
    const { data: idHit } = await supabaseAdmin
      .from('fraud_signals')
      .select('entity_id')
      .eq('signal_type', 'national_id')
      .eq('signal_value', input.nationalId)
      .limit(1);
    if (idHit && idHit.length > 0) {
      signals.push({ type: 'shared_identity', detail: 'National ID linked to another account', weight: 80 });
    }
  }

  // 4. IP shared with other merchant signups
  if (input.ip) {
    const { data: ipHits } = await supabaseAdmin
      .from('fraud_signals')
      .select('entity_id')
      .eq('signal_type', 'signup_ip')
      .eq('signal_value', input.ip);
    const distinct = new Set((ipHits || []).map((r) => r.entity_id));
    if (distinct.size > 0) {
      signals.push({ type: 'shared_ip', detail: `IP shared with ${distinct.size} other account(s)`, weight: 25 });
    }

    // 5. Signup velocity — more than 3 signups from this IP in 24h
    const { count } = await supabaseAdmin
      .from('fraud_signals')
      .select('id', { count: 'exact', head: true })
      .eq('signal_type', 'signup_ip')
      .eq('signal_value', input.ip)
      .gte('created_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString());
    if ((count || 0) >= 3) {
      signals.push({ type: 'signup_velocity', detail: `${count} signups from this IP in 24h`, weight: 30 });
    }
  }

  // 6. Device fingerprint shared across accounts
  if (input.deviceFingerprint) {
    const { data: fpHits } = await supabaseAdmin
      .from('fraud_signals')
      .select('entity_id')
      .eq('signal_type', 'device_fingerprint')
      .eq('signal_value', input.deviceFingerprint);
    const distinct = new Set((fpHits || []).map((r) => r.entity_id));
    if (distinct.size > 0) {
      signals.push({ type: 'shared_device', detail: `Device fingerprint matches ${distinct.size} other account(s)`, weight: 55 });
    }
  }

  // 7. Disposable email domain
  const domain = input.email.split('@')[1]?.toLowerCase() || '';
  if (DISPOSABLE_DOMAINS.has(domain)) {
    signals.push({ type: 'disposable_email', detail: `Disposable email domain: ${domain}`, weight: 50 });
  }

  // 8. Business-name similarity to an existing merchant
  const { data: merchants } = await supabaseAdmin
    .from('merchants')
    .select('id, business_name')
    .limit(500);
  for (const m of merchants || []) {
    const sim = nameSimilarity(input.businessName, m.business_name);
    if (sim >= 0.85) {
      signals.push({
        type: 'similar_business',
        detail: `Business name closely matches '${m.business_name}' (${Math.round(sim * 100)}%)`,
        weight: 35,
      });
      break;
    }
  }

  // Rule-based score — weights are stacked evidence, cap at 100
  const ruleScore = Math.min(
    100,
    signals.reduce((acc, s) => acc + s.weight, 0)
  );

  // AI review — the model sees the combined evidence and may raise the
  // score; it can never lower it (conservative — AI is advisory).
  let aiSummary: string | undefined;
  if (signals.length > 0) {
    const ai = await completeJson<{ score?: number; rationale?: string }>(
      'You are a fraud analyst for a payments platform enforcing a strict one-account-per-person policy. ' +
        'Given detected signup signals, estimate the probability this is a fraudulent duplicate account ' +
        'as an integer score 0-100, with a one-sentence rationale.',
      `Applicant signals:\n${signals.map((s) => `- ${s.type}: ${s.detail} (weight ${s.weight})`).join('\n')}\n` +
        `Rule-based score: ${ruleScore}`
    );
    if (ai) {
      if (typeof ai.score === 'number') {
        aiSummary = ai.rationale;
        return {
          verdict: Math.max(ruleScore, ai.score) >= BLOCK_THRESHOLD ? 'review' : 'clear',
          score: Math.max(ruleScore, Math.min(100, ai.score)),
          signals,
          aiSummary,
        };
      }
    }
  }

  return {
    verdict: ruleScore >= BLOCK_THRESHOLD ? 'review' : 'clear',
    score: ruleScore,
    signals,
    aiSummary,
  };
}

/** Persist the observable signals of an account for future matching. */
export async function recordSignupSignals(
  merchantId: string,
  input: SignupSignals
): Promise<void> {
  const rows = [
    { type: 'signup_ip', value: input.ip },
    { type: 'device_fingerprint', value: input.deviceFingerprint },
    { type: 'national_id', value: input.nationalId },
  ]
    .filter((r) => !!r.value)
    .map((r) => ({
      id: uuidv4(),
      entity_type: 'merchant',
      entity_id: merchantId,
      signal_type: r.type!,
      signal_value: r.value!,
      flagged: false,
      created_at: new Date().toISOString(),
    }));

  if (rows.length > 0) {
    await supabaseAdmin.from('fraud_signals').insert(rows);
  }
}

/** Record a flagged detection result against an entity. */
export async function recordFlag(
  entityId: string,
  scan: ScanResult
): Promise<void> {
  await supabaseAdmin.from('fraud_signals').insert({
    id: uuidv4(),
    entity_type: 'merchant',
    entity_id: entityId,
    signal_type: 'account_flag',
    signal_value: `score:${scan.score}`,
    flagged: true,
    details: { signals: scan.signals, aiSummary: scan.aiSummary },
    created_at: new Date().toISOString(),
  });
}

/**
 * Request a manual review for a legitimate second account — the
 * one-person-one-account escape hatch. Operators approve/reject.
 */
export async function requestMultiAccountAccess(options: {
  email: string;
  businessName: string;
  reason: string;
  scan?: ScanResult;
}): Promise<{ id: string; status: 'pending' }> {
  const id = uuidv4();
  const { error } = await supabaseAdmin.from('multi_account_requests').insert({
    id,
    email: options.email,
    business_name: options.businessName,
    reason: options.reason,
    status: 'pending',
    scan_score: options.scan?.score ?? null,
    scan_details: options.scan ? { signals: options.scan.signals, aiSummary: options.scan.aiSummary } : {},
    created_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Failed to submit review request: ${error.message}`);
  return { id, status: 'pending' };
}

/**
 * Operator decision on a multi-account request. An approval is recorded
 * so a subsequent signup attempt for the same email + business passes
 * the review gate once.
 */
export async function reviewMultiAccountRequest(
  requestId: string,
  decision: { approve: boolean; reviewer: string; note?: string }
): Promise<{ id: string; status: string }> {
  const { data: request } = await supabaseAdmin
    .from('multi_account_requests')
    .select('*')
    .eq('id', requestId)
    .single();
  if (!request) throw new Error('Review request not found');
  if (request.status !== 'pending') throw new Error(`Request already ${request.status}`);

  const status = decision.approve ? 'approved' : 'rejected';
  const { data: updated } = await supabaseAdmin
    .from('multi_account_requests')
    .update({
      status,
      reviewed_by: decision.reviewer,
      review_note: decision.note,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select()
    .single();

  return { id: updated!.id, status };
}

/** Was this applicant explicitly approved for a second account? */
export async function hasApprovedMultiAccount(email: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('multi_account_requests')
    .select('id')
    .eq('email', email)
    .eq('status', 'approved')
    .limit(1);
  return !!data && data.length > 0;
}

/**
 * Build a stable device fingerprint the register page sends.
 * Client composes the raw material; server hashes for storage so we
 * never retain raw UA strings.
 */
export function hashFingerprint(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}
