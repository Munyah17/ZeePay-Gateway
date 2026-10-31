import { supabaseAdmin } from '../database/client';
import { v4 as uuidv4 } from 'uuid';
import { deliverWebhookToMerchant } from '../webhooks/delivery';
import { completeJson } from '../ai/groq';
import { createRefund } from './refund-service';

/**
 * Disputes — a structured record when a customer and merchant disagree
 * about a payment or delivery. Both sides submit evidence; the platform
 * resolves to customer (with optional automatic refund), merchant, or
 * closes without action.
 *
 * Lifecycle:
 *   open → awaiting_evidence → under_review → resolved_customer |
 *   resolved_merchant | closed | expired
 */

export type DisputeType =
  | 'payment_not_received'
  | 'goods_not_delivered'
  | 'not_as_described'
  | 'unauthorized'
  | 'duplicate_charge'
  | 'other';

export type DisputeStatus =
  | 'open'
  | 'awaiting_evidence'
  | 'under_review'
  | 'resolved_customer'
  | 'resolved_merchant'
  | 'closed'
  | 'expired';

export interface DisputeResponse {
  id: string;
  paymentId: string;
  type: DisputeType;
  status: DisputeStatus;
  description: string;
  openedBy: 'customer' | 'merchant';
  customerEmail?: string;
  amount: number;
  currency: string;
  evidence: DisputeEvidence[];
  resolution?: { outcome: string; note?: string; resolvedAt: string };
  aiAssessment?: { summary: string; suggestedOutcome?: string; confidence?: number };
  evidenceDeadline?: string;
  createdAt: string;
}

export interface DisputeEvidence {
  submittedBy: 'customer' | 'merchant' | 'platform';
  note: string;
  attachments?: string[]; // URLs / storage keys — files live in object storage
  submittedAt: string;
}

const EVIDENCE_WINDOW_DAYS = 14;

interface DisputeRow {
  id: string;
  payment_id: string;
  type: DisputeType;
  status: DisputeStatus;
  description: string;
  opened_by: 'customer' | 'merchant';
  customer_email?: string;
  amount: number;
  currency: string;
  evidence?: DisputeEvidence[];
  resolution?: DisputeResponse['resolution'];
  ai_assessment?: DisputeResponse['aiAssessment'];
  evidence_deadline?: string;
  created_at: string;
}

function toResponse(row: DisputeRow): DisputeResponse {
  return {
    id: row.id,
    paymentId: row.payment_id,
    type: row.type,
    status: row.status,
    description: row.description,
    openedBy: row.opened_by,
    customerEmail: row.customer_email || undefined,
    amount: row.amount,
    currency: row.currency,
    evidence: row.evidence || [],
    resolution: row.resolution || undefined,
    aiAssessment: row.ai_assessment || undefined,
    evidenceDeadline: row.evidence_deadline || undefined,
    createdAt: row.created_at,
  };
}

/**
 * Open a dispute against a payment. The payment must belong to the
 * merchant. One open dispute per payment at a time — repeat opens on
 * the same payment return the existing dispute.
 */
export async function openDispute(options: {
  merchantId: string;
  input: {
    paymentId: string;
    type: DisputeType;
    description: string;
    openedBy: 'customer' | 'merchant';
    customerEmail?: string;
    evidence?: Omit<DisputeEvidence, 'submittedAt'>[];
  };
}): Promise<DisputeResponse> {
  const { merchantId, input } = options;

  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('id', input.paymentId)
    .eq('merchant_id', merchantId)
    .single();
  if (!payment) throw new Error('Payment not found');

  // A single open dispute per payment — reopens return the live record
  const { data: existing } = await supabaseAdmin
    .from('disputes')
    .select('*')
    .eq('payment_id', input.paymentId)
    .in('status', ['open', 'awaiting_evidence', 'under_review'])
    .limit(1)
    .single();
  if (existing) return toResponse(existing);

  const deadline = new Date(Date.now() + EVIDENCE_WINDOW_DAYS * 24 * 3600 * 1000);
  const evidence: DisputeEvidence[] = (input.evidence || []).map((e) => ({
    ...e,
    submittedAt: new Date().toISOString(),
  }));

  // AI triage — summarises the claim and suggests an outcome for the
  // reviewer. Advisory only; a human always makes the final call.
  const ai = await completeJson<{
    summary?: string;
    suggestedOutcome?: string;
    confidence?: number;
  }>(
    'You are a disputes analyst for a payments platform. Summarise the dispute in one sentence, ' +
      'suggest an outcome (customer|merchant|unclear) and a confidence 0-1. This is advisory for a human reviewer.',
    JSON.stringify({
      type: input.type,
      description: input.description,
      openedBy: input.openedBy,
      amount: payment.amount,
      currency: payment.currency,
      paymentStatus: payment.status,
      evidenceCount: evidence.length,
    })
  );

  const { data: dispute, error } = await supabaseAdmin
    .from('disputes')
    .insert({
      id: uuidv4(),
      merchant_id: merchantId,
      payment_id: input.paymentId,
      type: input.type,
      description: input.description,
      opened_by: input.openedBy,
      customer_email: input.customerEmail || payment.customer_email,
      amount: payment.amount,
      currency: payment.currency,
      status: 'open',
      evidence,
      evidence_deadline: deadline.toISOString(),
      ai_assessment: ai
        ? { summary: ai.summary, suggestedOutcome: ai.suggestedOutcome, confidence: ai.confidence }
        : null,
    })
    .select()
    .single();

  if (error || !dispute) throw new Error(`Failed to open dispute: ${error?.message}`);

  await supabaseAdmin.from('dispute_events').insert({
    id: uuidv4(),
    dispute_id: dispute.id,
    event: 'opened',
    actor: input.openedBy,
    details: { type: input.type },
  });

  await deliverWebhookToMerchant(merchantId, 'dispute.opened', toResponse(dispute));
  return toResponse(dispute);
}

export async function getDispute(disputeId: string, merchantId: string): Promise<DisputeResponse> {
  const { data } = await supabaseAdmin
    .from('disputes')
    .select('*')
    .eq('id', disputeId)
    .eq('merchant_id', merchantId)
    .single();
  if (!data) throw new Error('Dispute not found');
  return toResponse(data as DisputeRow);
}

export async function listDisputes(
  merchantId: string,
  options: { status?: DisputeStatus; limit?: number; offset?: number } = {}
): Promise<DisputeResponse[]> {
  const limit = options.limit || 50;
  const offset = options.offset || 0;

  let query = supabaseAdmin
    .from('disputes')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.status) query = query.eq('status', options.status);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list disputes: ${error.message}`);
  return ((data || []) as DisputeRow[]).map(toResponse);
}

/** Submit evidence from either side. Moves the dispute to awaiting_evidence. */
export async function addDisputeEvidence(
  disputeId: string,
  merchantId: string,
  input: Omit<DisputeEvidence, 'submittedAt'>
): Promise<DisputeResponse> {
  const { data: dispute } = await supabaseAdmin
    .from('disputes')
    .select('*')
    .eq('id', disputeId)
    .eq('merchant_id', merchantId)
    .single();
  if (!dispute) throw new Error('Dispute not found');

  if (['resolved_customer', 'resolved_merchant', 'closed', 'expired'].includes(dispute.status)) {
    throw new Error(`Dispute is ${dispute.status} — evidence can no longer be added`);
  }

  const evidence: DisputeEvidence[] = [
    ...(dispute.evidence || []),
    { ...input, submittedAt: new Date().toISOString() },
  ];

  const { data: updated } = await supabaseAdmin
    .from('disputes')
    .update({ evidence, status: 'awaiting_evidence' })
    .eq('id', disputeId)
    .select()
    .single();

  await supabaseAdmin.from('dispute_events').insert({
    id: uuidv4(),
    dispute_id: disputeId,
    event: 'evidence_submitted',
    actor: input.submittedBy,
    details: { note: input.note },
  });

  return toResponse(updated!);
}

/**
 * Resolve a dispute. outcome 'customer' optionally triggers an
 * automatic refund through the refund service (which applies its own
 * risk checks before calling the provider).
 */
export async function resolveDispute(options: {
  disputeId: string;
  merchantId: string;
  outcome: 'customer' | 'merchant' | 'closed';
  note?: string;
  resolvedBy: string;
  autoRefund?: boolean;
}): Promise<DisputeResponse> {
  const { disputeId, merchantId, outcome } = options;

  const { data: dispute } = await supabaseAdmin
    .from('disputes')
    .select('*')
    .eq('id', disputeId)
    .eq('merchant_id', merchantId)
    .single();
  if (!dispute) throw new Error('Dispute not found');

  if (['resolved_customer', 'resolved_merchant', 'closed', 'expired'].includes(dispute.status)) {
    throw new Error(`Dispute is already ${dispute.status}`);
  }

  let refundId: string | undefined;
  if (outcome === 'customer' && options.autoRefund) {
    const refund = await createRefund({
      merchantId,
      paymentId: dispute.payment_id,
      input: {
        amount: dispute.amount,
        currency: dispute.currency,
        reason: `Dispute resolved in customer's favour (${dispute.id})`,
        metadata: { disputeId, resolvedBy: options.resolvedBy },
      },
    });
    refundId = refund.id;
  }

  const status: DisputeStatus =
    outcome === 'customer' ? 'resolved_customer'
    : outcome === 'merchant' ? 'resolved_merchant'
    : 'closed';

  const resolution = {
    outcome,
    note: options.note,
    resolvedBy: options.resolvedBy,
    resolvedAt: new Date().toISOString(),
    ...(refundId ? { refundId } : {}),
  };

  const { data: updated } = await supabaseAdmin
    .from('disputes')
    .update({ status, resolution })
    .eq('id', disputeId)
    .select()
    .single();

  await supabaseAdmin.from('dispute_events').insert({
    id: uuidv4(),
    dispute_id: disputeId,
    event: 'resolved',
    actor: options.resolvedBy,
    details: resolution,
  });

  await deliverWebhookToMerchant(merchantId, 'dispute.resolved', toResponse(updated!));
  return toResponse(updated!);
}
