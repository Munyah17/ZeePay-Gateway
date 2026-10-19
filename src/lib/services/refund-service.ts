import { supabaseAdmin } from '../database/client';
import { providerRegistry } from '../providers/registry';
import { RefundPaymentInput, RefundResult } from '@/types/provider';
import { v4 as uuidv4 } from 'uuid';

export interface CreateRefundOptions {
  merchantId: string;
  paymentId: string;
  input: {
    amount: number;
    currency: string;
    reason?: string;
    metadata?: Record<string, any>;
  };
}

export interface RefundResponse {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  reason?: string;
  createdAt: string;
}

/**
 * Create a refund
 */
export async function createRefund(
  options: CreateRefundOptions
): Promise<RefundResponse> {
  const { merchantId, paymentId, input } = options;

  // Get payment details
  const { data: payment, error: paymentError } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .eq('merchant_id', merchantId)
    .single();

  if (paymentError || !payment) {
    throw new Error('Payment not found');
  }

  if (payment.status !== 'succeeded') {
    throw new Error(`Cannot refund payment with status ${payment.status}`);
  }

  // Get the last successful payment attempt
  const { data: attempt, error: attemptError } = await supabaseAdmin
    .from('payment_attempts')
    .select('*')
    .eq('payment_id', paymentId)
    .eq('status', 'succeeded')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (attemptError || !attempt) {
    throw new Error('No successful payment attempt found');
  }

  // Create refund record
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
      status: 'pending',
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (refundError || !refund) {
    throw new Error(`Failed to create refund: ${refundError?.message}`);
  }

  // For now, use mock provider
  const provider = providerRegistry.get('mock');
  if (!provider) {
    throw new Error('No payment provider available');
  }

  // Initialize provider with mock config
  provider.initialize({
    credentials: {},
    environment: 'test',
  });

  // Create refund with provider
  if (provider.refundPayment) {
    const refundInput: RefundPaymentInput = {
      paymentReference: attempt.provider_reference || '',
      amount: input.amount,
      currency: input.currency,
      reason: input.reason,
      metadata: input.metadata,
    };

    const providerResult: RefundResult = await provider.refundPayment(refundInput);

    // Update refund with provider result
    const { error: updateError } = await supabaseAdmin
      .from('refunds')
      .update({
        provider_reference: providerResult.providerReference,
        status: providerResult.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', refundId);

    if (updateError) {
      throw new Error(`Failed to update refund: ${updateError.message}`);
    }
  }

  return {
    id: refund.id,
    paymentId: refund.payment_id,
    amount: refund.amount,
    currency: refund.currency,
    status: refund.status,
    reason: refund.reason || undefined,
    createdAt: refund.created_at,
  };
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
    createdAt: refund.created_at,
  }));
}
