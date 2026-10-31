import { supabaseAdmin } from '../database/client';
import { providerRegistry } from '../providers/registry';
import { RefundPaymentInput, RefundResult } from '@/types/provider';
import { v4 as uuidv4 } from 'uuid';
import { deliverWebhookToMerchant } from '../webhooks/delivery';
import { initializeProviderForMerchant } from './provider-credentials';
import { completeJson } from '../ai/groq';

/**
 * Refunds — merchant-initiated returns on succeeded payments.
 *
 * Algorithm:
 *   1. Policy check — payment succeeded, amount > 0, currency matches,
 *      new refund + existing non-failed refunds never exceed the
 *      payment amount (over-refund guard).
 *   2. Risk assessment — deterministic signals + advisory AI review
 *      (Groq). Low risk → process immediately; high risk →
 *      'pending_review' held for a human decision.
 *   3. Execution — the ACTUAL provider on the payment attempt refunds
 *      via RF with the merchant's stored credentials.
 *   4. Bookkeeping — refund record updated, payment flips to
 *      'refunded' when fully returned, webhooks delivered.
 */

export interface CreateRefundOptions {
  merchantId: string;
  paymentId: string;
  input: {
    amount: number;
    currency: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  };
}

interface PaymentRow {
  id: string;
  merchant_id: string;
  amount: number | string;
  currency: string;
  status: string;
  created_at: string;
}

interface AttemptRow {
  provider_reference?: string;
  payment_providers?: { name?: string } | null;
}

export interface RefundResponse {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  reason?: string;
  riskScore?: number;
  aiAssessment?: string;
  createdAt: string;
}

const REVIEW_THRESHOLD = 60;

/**
 * Deterministic + AI refund-risk score. Money never moves on the AI's
 * word alone — a high score only routes the refund to human review.
 */
async function assessRefundRisk(options: {
  payment: PaymentRow;
  refundAmount: number;
  reason?: string;
}): Promise<{ score: number; reasons: string[]; aiSummary?: string }> {
  const { payment, refundAmount, reason } = options;
  const reasons: string[] = [];
  let score = 0;

  // How old is the payment? Very old refunds are abnormal
  const ageDays = (Date.now() - new Date(payment.created_at).getTime()) / 86400000;
  if (ageDays > 180) { score += 25; reasons.push(`payment is ${Math.round(ageDays)} days old`); }
  else if (ageDays > 90) { score += 10; reasons.push(`payment is ${Math.round(ageDays)} days old`); }

  // Full-amount refunds carry more risk than partial
  if (refundAmount >= Number(payment.amount)) { score += 10; reasons.push('full-amount refund'); }

  // Refund velocity on this merchant in the last 24h
  const { data: recentRefunds } = await supabaseAdmin
    .from('refunds')
    .select('id, payments!inner(merchant_id)')
    .gte('created_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString())
    .neq('status', 'failed')
    .eq('payments.merchant_id', payment.merchant_id);
  const recent = recentRefunds?.length || 0;
  if (recent >= 10) { score += 30; reasons.push(`${recent} refunds in last 24h`); }
  else if (recent >= 5) { score += 15; reasons.push(`${recent} refunds in last 24h`); }

  // No reason given
  if (!reason || reason.trim().length < 5) { score += 15; reasons.push('missing/short reason'); }

  // Advisory AI review — sees the same evidence, can only raise the
  // score, never lower it (conservative).
  const ai = await completeJson<{ score?: number; rationale?: string }>(
    'You are a refund-risk analyst for a payments platform. Given refund signals, estimate fraud/abuse ' +
      'probability as an integer 0-100 with a one-sentence rationale. Legitimate merchant refunds are ' +
      'normal; look for patterns of abuse.',
    JSON.stringify({
      paymentAmount: payment.amount,
      refundAmount,
      currency: payment.currency,
      paymentAgeDays: Math.round(ageDays),
      refundsLast24h: recent,
      reason: reason || null,
      ruleScore: score,
      signals: reasons,
    })
  );
  if (ai && typeof ai.score === 'number') {
    score = Math.max(score, Math.min(100, ai.score));
    return { score, reasons, aiSummary: ai.rationale };
  }
  return { score, reasons };
}

/** Execute the refund with the payment's actual provider. */
async function processRefundWithProvider(
  payment: PaymentRow,
  attempt: AttemptRow,
  input: CreateRefundOptions['input']
): Promise<RefundResult> {
  const providerName = attempt.payment_providers?.name || 'mock';
  const provider = providerRegistry.get(providerName);
  if (!provider?.refundPayment) {
    throw new Error(`Provider '${providerName}' does not support refunds`);
  }

  // The merchant's stored provider credentials are required — refunds
  // are authenticated server-to-server calls.
  await initializeProviderForMerchant(provider, payment.merchant_id);

  const refundInput: RefundPaymentInput = {
    paymentReference: attempt.provider_reference || '',
    amount: input.amount,
    currency: input.currency,
    reason: input.reason,
    metadata: input.metadata as Record<string, unknown> | undefined,
  };
  return provider.refundPayment(refundInput);
}

/**
 * Create a refund — runs the policy check, risk assessment, and (when
 * auto-approved) the provider call in one flow.
 */
export async function createRefund(
  options: CreateRefundOptions
): Promise<RefundResponse> {
  const { merchantId, paymentId, input } = options;

  if (!input.amount || input.amount <= 0) {
    throw new Error('Refund amount must be greater than zero');
  }
  if (!input.currency || input.currency.length !== 3) {
    throw new Error('A 3-letter currency code is required');
  }

  const { data: payment, error: paymentError } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .eq('merchant_id', merchantId)
    .single();

  if (paymentError || !payment) {
    throw new Error('Payment not found');
  }
  if (payment.status !== 'succeeded' && payment.status !== 'refunded') {
    throw new Error(`Cannot refund payment with status ${payment.status}`);
  }
  if (input.currency !== payment.currency) {
    throw new Error(`Currency mismatch: payment is ${payment.currency}`);
  }

  // Over-refund guard — pending + succeeded refunds + this request
  // must never exceed the payment amount.
  const { data: existingRefunds } = await supabaseAdmin
    .from('refunds')
    .select('amount, status')
    .eq('payment_id', paymentId)
    .in('status', ['pending', 'pending_review', 'succeeded']);
  const alreadyRefunded = (existingRefunds || []).reduce((acc, r) => acc + Number(r.amount), 0);
  if (alreadyRefunded + input.amount > Number(payment.amount) + 0.005) {
    throw new Error(
      `Refund exceeds refundable balance: ${payment.amount} paid, ${alreadyRefunded.toFixed(2)} already refunded`
    );
  }

  const { data: attempt, error: attemptError } = await supabaseAdmin
    .from('payment_attempts')
    .select('*, payment_providers(name)')
    .eq('payment_id', paymentId)
    .eq('status', 'succeeded')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (attemptError || !attempt) {
    throw new Error('No successful payment attempt found');
  }

  // Risk assessment — high risk parks the refund for human review
  const risk = await assessRefundRisk({ payment, refundAmount: input.amount, reason: input.reason });
  const needsReview = risk.score >= REVIEW_THRESHOLD;

  const refundId = uuidv4();
  const { data: refund, error: refundError } = await supabaseAdmin
    .from('refunds')
    .insert({
      id: refundId,
      payment_id: paymentId,
      payment_attempt_id: attempt.id,
      amount: input.amount,
      currency: input.currency,
      reason: input.reason,
      status: needsReview ? 'pending_review' : 'pending',
      metadata: {
        ...input.metadata,
        riskScore: risk.score,
        riskReasons: risk.reasons,
        aiAssessment: risk.aiSummary,
      },
    })
    .select()
    .single();

  if (refundError || !refund) {
    throw new Error(`Failed to create refund: ${refundError?.message}`);
  }

  if (needsReview) {
    await deliverWebhookToMerchant(merchantId, 'refund.pending_review', {
      id: refundId,
      paymentId,
      amount: input.amount,
      currency: input.currency,
      riskScore: risk.score,
      riskReasons: risk.reasons,
    });
    return {
      id: refund.id,
      paymentId: refund.payment_id,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason || undefined,
      riskScore: risk.score,
      aiAssessment: risk.aiSummary,
      createdAt: refund.created_at,
    };
  }

  return executeRefund(refundId, merchantId);
}

/** Call the provider for a pending / approved refund and finish bookkeeping. */
async function executeRefund(refundId: string, merchantId: string): Promise<RefundResponse> {
  const { data: refund } = await supabaseAdmin
    .from('refunds')
    .select('*, payments(*), payment_attempts(*, payment_providers(name))')
    .eq('id', refundId)
    .single();
  if (!refund) throw new Error('Refund not found');

  const payment = refund.payments;
  const attempt = refund.payment_attempts;

  try {
    const result = await processRefundWithProvider(payment, attempt, {
      amount: refund.amount,
      currency: refund.currency,
      reason: refund.reason,
      metadata: refund.metadata,
    });

    const succeeded = result.status === 'succeeded';
    await supabaseAdmin
      .from('refunds')
      .update({
        provider_reference: result.providerReference,
        status: result.status,
        completed_at: succeeded ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', refundId);

    if (succeeded) {
      // Flip payment to 'refunded' when the full amount is returned
      const { data: all } = await supabaseAdmin
        .from('refunds')
        .select('amount')
        .eq('payment_id', payment.id)
        .eq('status', 'succeeded');
      const total = (all || []).reduce((acc, r) => acc + Number(r.amount), 0);
      if (total >= Number(payment.amount) - 0.005) {
        await supabaseAdmin
          .from('payments')
          .update({ status: 'refunded' })
          .eq('id', payment.id);
      }
    }

    await deliverWebhookToMerchant(merchantId, succeeded ? 'payment.refunded' : 'refund.failed', {
      id: refundId,
      paymentId: payment.id,
      amount: refund.amount,
      currency: refund.currency,
      providerReference: result.providerReference,
    });

    return {
      id: refund.id,
      paymentId: payment.id,
      amount: refund.amount,
      currency: refund.currency,
      status: result.status,
      reason: refund.reason || undefined,
      riskScore: refund.metadata?.riskScore,
      aiAssessment: refund.metadata?.aiAssessment,
      createdAt: refund.created_at,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await supabaseAdmin
      .from('refunds')
      .update({ status: 'failed', metadata: { ...refund.metadata, error: message } })
      .eq('id', refundId);
    throw new Error(`Refund failed: ${message}`);
  }
}

/** Human approval for a pending_review refund — then it executes. */
export async function approveRefund(refundId: string, merchantId: string): Promise<RefundResponse> {
  const { data: refund } = await supabaseAdmin
    .from('refunds')
    .select('*, payments!inner(merchant_id)')
    .eq('id', refundId)
    .eq('payments.merchant_id', merchantId)
    .single();
  if (!refund) throw new Error('Refund not found');
  if (refund.status !== 'pending_review') {
    throw new Error(`Refund is ${refund.status} — only pending_review refunds can be approved`);
  }
  return executeRefund(refundId, merchantId);
}

/**
 * Get a refund by ID
 */
export async function getRefund(
  refundId: string,
  merchantId: string
): Promise<RefundResponse | null> {
  const { data, error } = await supabaseAdmin
    .from('refunds')
    .select('*, payments!inner(merchant_id)')
    .eq('id', refundId)
    .eq('payments.merchant_id', merchantId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    paymentId: data.payment_id,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    reason: data.reason || undefined,
    riskScore: data.metadata?.riskScore,
    aiAssessment: data.metadata?.aiAssessment,
    createdAt: data.created_at,
  };
}

/**
 * List refunds for a payment
 */
export async function listRefunds(
  paymentId: string,
  merchantId: string
): Promise<RefundResponse[]> {
  const { data, error } = await supabaseAdmin
    .from('refunds')
    .select('*, payments!inner(merchant_id)')
    .eq('payment_id', paymentId)
    .eq('payments.merchant_id', merchantId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((refund) => ({
    id: refund.id,
    paymentId: refund.payment_id,
    amount: refund.amount,
    currency: refund.currency,
    status: refund.status,
    reason: refund.reason || undefined,
    riskScore: refund.metadata?.riskScore,
    aiAssessment: refund.metadata?.aiAssessment,
    createdAt: refund.created_at,
  }));
}
