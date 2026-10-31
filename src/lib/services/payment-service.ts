import { supabaseAdmin } from '../database/client';
import { providerRegistry } from '../providers/registry';
import { CreatePaymentInput, PaymentResult } from '@/types/provider';
import { ChargeSavedMethodInput } from '@/types/payment-method';
import { v4 as uuidv4 } from 'uuid';
import { getIdempotencyResult, recordIdempotencyKey } from '../utils/idempotency';
import { deliverWebhookToMerchant } from '../webhooks/delivery';
import { getOrCreateCustomer } from './customer-service';
import { initializeProviderForMerchant } from './provider-credentials';

export interface CreatePaymentOptions {
  merchantId: string;
  input: CreatePaymentInput;
  idempotencyKey?: string;
  paymentMethodId?: string;
  /** Merchant's own customer id — get-or-creates a customer record */
  customerReference?: string;
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
  const { merchantId, input, idempotencyKey, paymentMethodId, customerReference } = options;

  // Resolve the customer when a merchant-side reference is supplied
  let customerId: string | null = null;
  if (customerReference) {
    const customer = await getOrCreateCustomer(merchantId, {
      externalReference: customerReference,
      email: input.customerEmail,
      phone: input.customerPhone,
    });
    customerId = customer.id;
  }

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
      customer_id: customerId,
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

// ------------------------------------------------------------------
// One-click payments — charge a tokenised saved payment method
// ------------------------------------------------------------------

export interface OneClickPaymentResponse extends PaymentResponse {
  savedPaymentMethodId: string;
  /** True when the provider requires an extra step (e.g. 3DS redirect) */
  requiresAction: boolean;
  /** Async redirect the shopper must submit (3DS / issuer validation) */
  redirect?: { url: string; method: 'GET' | 'POST'; parameters?: Record<string, string> };
}

/**
 * Charge a previously tokenised payment method — one-click payment.
 * The customer does not re-enter card details; the stored provider
 * token (ZimSwitch registrationId / wallet mandate) is debited
 * merchant-initiated. `requiresAction` is set when the provider asks
 * for step-up authentication (3DS) — the merchant should then direct
 * the customer to checkoutUrl.
 */
export async function chargeSavedPaymentMethod(options: {
  merchantId: string;
  input: ChargeSavedMethodInput;
}): Promise<OneClickPaymentResponse> {
  const { merchantId, input } = options;

  if (!input.savedPaymentMethodId) throw new Error('savedPaymentMethodId is required');
  if (!input.amount || input.amount <= 0) throw new Error('amount must be greater than zero');
  if (!input.currency) throw new Error('currency is required');
  if (!input.reference) throw new Error('reference is required');

  // Idempotency — repeat calls return the same payment
  if (input.idempotencyKey) {
    const existing = await getIdempotencyResult(merchantId, input.idempotencyKey);
    if (existing && existing.resourceType === 'payment') {
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
          savedPaymentMethodId: input.savedPaymentMethodId,
          requiresAction: data.status === 'processing',
        };
      }
    }
  }

  // Load the saved method — must belong to this merchant and be active
  const { data: method } = await supabaseAdmin
    .from('saved_payment_methods')
    .select('*')
    .eq('id', input.savedPaymentMethodId)
    .eq('merchant_id', merchantId)
    .single();

  if (!method) throw new Error('Saved payment method not found');
  if (method.status !== 'active') {
    throw new Error(`Payment method is ${method.status} — only active methods can be charged`);
  }
  if (!method.provider_reference) {
    throw new Error('Payment method has no provider token');
  }

  const provider = providerRegistry.get(method.provider_name);
  if (!provider?.chargeMandate) {
    throw new Error(`Provider '${method.provider_name}' does not support token charges`);
  }
  // The merchant's stored provider credentials are required — without
  // them token charges are sent unauthenticated and fail at the gateway.
  await initializeProviderForMerchant(provider, merchantId);

  // Create the payment record
  const paymentId = uuidv4();
  const { data: payment, error: paymentError } = await supabaseAdmin
    .from('payments')
    .insert({
      id: paymentId,
      merchant_id: merchantId,
      merchant_reference: input.reference,
      amount: input.amount,
      currency: input.currency,
      status: 'processing',
      return_url: input.returnUrl,
      customer_email: input.customerEmail || method.customer_email,
      customer_phone: input.customerPhone || method.customer_phone,
      customer_id: method.customer_id,
      saved_payment_method_id: method.id,
      metadata: { ...input.metadata, initiator: 'one_click', paymentMethodId: method.id },
    })
    .select()
    .single();

  if (paymentError || !payment) {
    throw new Error(`Failed to create payment: ${paymentError?.message}`);
  }

  if (input.idempotencyKey) {
    await recordIdempotencyKey(merchantId, input.idempotencyKey, 'payment', paymentId);
  }

  // Resolve the provider row for the attempt record
  const { data: providerRow } = await supabaseAdmin
    .from('payment_providers')
    .select('id')
    .eq('name', method.provider_name)
    .single();

  try {
    const result = await provider.chargeMandate({
      mandateReference: method.provider_reference,
      amount: input.amount,
      currency: input.currency,
      reference: input.reference,
      metadata: { ...input.metadata, initiator: 'one_click' },
    });

    const succeeded = result.status === 'succeeded';
    const requiresAction = result.status === 'processing' && (!!result.checkoutUrl || !!result.redirect);

    await supabaseAdmin
      .from('payments')
      .update({
        status: result.status,
        checkout_url: result.checkoutUrl,
        completed_at: succeeded ? new Date().toISOString() : null,
      })
      .eq('id', paymentId);

    if (providerRow?.id) {
      await supabaseAdmin.from('payment_attempts').insert({
        payment_id: paymentId,
        provider_id: providerRow.id,
        provider_reference: result.providerReference,
        status: result.status,
        provider_response: result.providerResponse || {},
        completed_at: succeeded ? new Date().toISOString() : null,
      });
    }

    // Touch last-used marker
    await supabaseAdmin
      .from('saved_payment_methods')
      .update({ metadata: { ...method.metadata, lastUsedAt: new Date().toISOString() } })
      .eq('id', method.id);

    await deliverWebhookToMerchant(
      merchantId,
      succeeded ? 'payment.succeeded' : result.status === 'processing' ? 'payment.processing' : 'payment.failed',
      {
        id: paymentId,
        reference: input.reference,
        amount: input.amount,
        currency: input.currency,
        status: result.status,
        savedPaymentMethodId: method.id,
        requiresAction,
      }
    );

    return {
      id: paymentId,
      reference: input.reference,
      amount: input.amount,
      currency: input.currency,
      status: result.status,
      checkoutUrl: result.checkoutUrl,
      redirect: result.redirect,
      createdAt: payment.created_at,
      savedPaymentMethodId: method.id,
      requiresAction,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    await supabaseAdmin.from('payments').update({ status: 'failed' }).eq('id', paymentId);
    if (providerRow?.id) {
      await supabaseAdmin.from('payment_attempts').insert({
        payment_id: paymentId,
        provider_id: providerRow.id,
        status: 'failed',
        error_message: message,
      });
    }

    await deliverWebhookToMerchant(merchantId, 'payment.failed', {
      id: paymentId,
      reference: input.reference,
      amount: input.amount,
      currency: input.currency,
      status: 'failed',
      savedPaymentMethodId: method.id,
      error: message,
    });

    throw new Error(`One-click charge failed: ${message}`);
  }
}
