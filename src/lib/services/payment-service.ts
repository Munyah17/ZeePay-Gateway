import { supabaseAdmin } from '../database/client';
import { providerRegistry } from '../providers/registry';
import { PaymentResult, CreatePaymentInput, PaymentStatus } from '@/types/provider';
import { v4 as uuidv4 } from 'uuid';
import { getIdempotencyResult, recordIdempotencyKey } from '../utils/idempotency';

export interface CreatePaymentOptions {
  merchantId: string;
  input: CreatePaymentInput;
  idempotencyKey?: string;
  paymentMethodId?: string;
}

export interface PaymentResponse {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  checkoutUrl?: string;
  createdAt: string;
}

/**
 * Create a new payment
 */
export async function createPayment(
  options: CreatePaymentOptions
): Promise<PaymentResponse> {
  const { merchantId, input, idempotencyKey, paymentMethodId } = options;

  // Check idempotency key if provided
  if (idempotencyKey) {
    const existing = await getIdempotencyResult(merchantId, idempotencyKey);
    if (existing && existing.resourceType === 'payment') {
      // Return existing payment
      const { data } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('id', existing.resourceId)
        .single();

      if (data) {
        return {
          id: data.id,
          reference: data.merchant_reference,
          amount: data.amount,
          currency: data.currency,
          status: data.status,
          checkoutUrl: data.checkout_url || undefined,
          createdAt: data.created_at,
        };
      }
    }
  }

  // Create payment record
  const paymentId = uuidv4();
  const { data: payment, error: paymentError } = await supabaseAdmin
    .from('payments')
    .insert({
      id: paymentId,
      merchant_id: merchantId,
      merchant_reference: input.reference,
      amount: input.amount,
      currency: input.currency,
      status: 'pending',
      return_url: input.returnUrl,
      cancel_url: input.cancelUrl,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (paymentError || !payment) {
    throw new Error(`Failed to create payment: ${paymentError?.message}`);
  }

  // Record idempotency key
  if (idempotencyKey) {
    await recordIdempotencyKey(merchantId, idempotencyKey, 'payment', paymentId);
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

  // Create payment with provider
  const providerResult: PaymentResult = await provider.createPayment(input);

  // Create payment attempt record
  const { error: attemptError } = await supabaseAdmin
    .from('payment_attempts')
    .insert({
      payment_id: paymentId,
      provider_id: 'mock-provider-id', // TODO: Get actual provider ID
      payment_method_id: paymentMethodId,
      provider_reference: providerResult.providerReference,
      status: providerResult.status,
      provider_response: providerResult.providerResponse,
    });

  if (attemptError) {
    throw new Error(`Failed to create payment attempt: ${attemptError.message}`);
  }

  // Update payment with checkout URL
  const { error: updateError } = await supabaseAdmin
    .from('payments')
    .update({
      checkout_url: providerResult.checkoutUrl,
      status: providerResult.status,
    })
    .eq('id', paymentId);

  if (updateError) {
    throw new Error(`Failed to update payment: ${updateError.message}`);
  }

  return {
    id: payment.id,
    reference: payment.merchant_reference,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    checkoutUrl: providerResult.checkoutUrl,
    createdAt: payment.created_at,
  };
}

/**
 * Get a payment by ID
 */
export async function getPayment(
  paymentId: string,
  merchantId: string
): Promise<PaymentResponse | null> {
  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .eq('merchant_id', merchantId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    reference: data.merchant_reference,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    checkoutUrl: data.checkout_url || undefined,
    createdAt: data.created_at,
  };
}

/**
 * Cancel a payment
 */
export async function cancelPayment(
  paymentId: string,
  merchantId: string
): Promise<PaymentResponse> {
  const { data, error } = await supabaseAdmin
    .from('payments')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId)
    .eq('merchant_id', merchantId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to cancel payment: ${error?.message}`);
  }

  return {
    id: data.id,
    reference: data.merchant_reference,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    checkoutUrl: data.checkout_url || undefined,
    createdAt: data.created_at,
  };
}

/**
 * List payments for a merchant
 */
export async function listPayments(
  merchantId: string,
  options: {
    limit?: number;
    offset?: number;
    status?: string;
  } = {}
): Promise<PaymentResponse[]> {
  const { limit = 50, offset = 0, status } = options;

  let query = supabaseAdmin
    .from('payments')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map((payment) => ({
    id: payment.id,
    reference: payment.merchant_reference,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    checkoutUrl: payment.checkout_url || undefined,
    createdAt: payment.created_at,
  }));
}
