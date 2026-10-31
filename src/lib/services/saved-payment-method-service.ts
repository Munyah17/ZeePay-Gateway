import { supabaseAdmin } from '../database/client';
import { providerRegistry } from '../providers/registry';
import { PaymentProvider } from '../providers/interface';
import { v4 as uuidv4 } from 'uuid';
import { getIdempotencyResult, recordIdempotencyKey } from '../utils/idempotency';
import { deliverWebhookToMerchant } from '../webhooks/delivery';
import { getOrCreateCustomer } from './customer-service';
import {
  RegisterPaymentMethodInput,
  SavedPaymentMethodResponse,
  SavedPaymentMethodStatus,
  UpdatePaymentMethodInput,
} from '@/types/payment-method';

/**
 * Saved payment methods — payment tokenisation.
 *
 * A customer authorises their card/wallet ONCE (hosted widget, PIN
 * prompt or 3DS). The provider returns a reusable token (ZimSwitch:
 * a `registrationId`; wallets: a mandate reference). ZeePay stores
 * only that token reference + display metadata (brand, last4) —
 * raw card numbers and CVVs never touch the database.
 *
 * The saved token powers:
 *   - one-click payments (chargeSavedPaymentMethod in payment-service)
 *   - recurring auto-deduct (subscriptions via savedPaymentMethodId)
 */

interface SavedMethodRow {
  id: string;
  merchant_id: string;
  customer_id: string | null;
  mandate_id: string | null;
  provider_name: string;
  method_code: string;
  type: string;
  provider_reference: string | null;
  card_brand: string | null;
  card_last4: string | null;
  card_exp_month: string | null;
  card_exp_year: string | null;
  card_holder: string | null;
  label: string | null;
  status: SavedPaymentMethodStatus;
  is_default: boolean;
  approval_url: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  activated_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

type MandateCapableProvider = PaymentProvider &
  Required<Pick<PaymentProvider, 'createMandate' | 'chargeMandate' | 'revokeMandate'>>;

function resolveMandateProvider(methodCode: string): MandateCapableProvider {
  const provider = providerRegistry.get(methodCode);
  if (!provider) {
    throw new Error(`No provider available for method '${methodCode}'`);
  }

  const capabilities = provider.getCapabilities();
  if (!capabilities.supportsRecurring || !provider.createMandate || !provider.chargeMandate) {
    throw new Error(`Provider '${methodCode}' does not support tokenisation`);
  }

  provider.initialize({ credentials: {}, environment: 'test' });
  return provider as MandateCapableProvider;
}

function toResponse(row: SavedMethodRow): SavedPaymentMethodResponse {
  return {
    id: row.id,
    customerId: row.customer_id || undefined,
    methodCode: row.method_code,
    provider: row.provider_name,
    type: (row.type || 'card') as SavedPaymentMethodResponse['type'],
    status: row.status,
    cardBrand: row.card_brand || undefined,
    cardLast4: row.card_last4 || undefined,
    cardExpMonth: row.card_exp_month || undefined,
    cardExpYear: row.card_exp_year || undefined,
    cardHolder: row.card_holder || undefined,
    label: row.label || undefined,
    isDefault: row.is_default,
    approvalUrl: row.approval_url || undefined,
    customerEmail: row.customer_email || undefined,
    customerPhone: row.customer_phone || undefined,
    createdAt: row.created_at,
    activatedAt: row.activated_at || undefined,
  };
}

/**
 * Extract display-safe card details from a provider response.
 * Providers return these on registration/verification responses;
 * ZeePay stores brand/last4/expiry/holder only — never PAN or CVV.
 */
export function extractCardDetails(providerResponse: Record<string, any> | undefined): {
  cardBrand?: string;
  cardLast4?: string;
  cardExpMonth?: string;
  cardExpYear?: string;
  cardHolder?: string;
} {
  if (!providerResponse) return {};
  const card = providerResponse.card || providerResponse;
  return {
    cardBrand: providerResponse.paymentBrand || card.brand || card.paymentBrand,
    cardLast4: card.last4Digits || card.last4,
    cardExpMonth: card.expiryMonth || card.expMonth,
    cardExpYear: card.expiryYear || card.expYear,
    cardHolder: card.holder,
  };
}

/**
 * Resolve the reusable token for a mandate that went through a hosted
 * approval flow. For ZimSwitch the initial provider_reference is the
 * transient checkoutId; the durable token (registrationId) only exists
 * after the shopper completes the widget. Returns the durable
 * reference + card details, or null if none was issued.
 */
export async function captureTokenForMandate(mandate: {
  provider_name: string;
  method_code: string;
  provider_reference: string;
}): Promise<{ tokenReference: string; card: ReturnType<typeof extractCardDetails> } | null> {
  const provider = providerRegistry.get(mandate.provider_name);
  if (!provider?.getPayment) return null;

  try {
    provider.initialize({ credentials: {}, environment: 'test' });
    const result = await provider.getPayment({ providerReference: mandate.provider_reference });
    const registrationId = result.metadata?.registrationId;
    if (!registrationId) return null;
    return {
      tokenReference: registrationId,
      card: extractCardDetails(result.providerResponse),
    };
  } catch {
    // Non-checkout mandates (mobile money) have no token to resolve —
    // the mandate reference itself is the durable token.
    return null;
  }
}

async function applyDefault(merchantId: string, customerId: string | null, methodId: string): Promise<void> {
  if (customerId) {
    await supabaseAdmin
      .from('saved_payment_methods')
      .update({ is_default: false })
      .eq('merchant_id', merchantId)
      .eq('customer_id', customerId)
      .neq('id', methodId);
  }
  await supabaseAdmin
    .from('saved_payment_methods')
    .update({ is_default: true })
    .eq('id', methodId);
}

/**
 * Register (tokenise) a payment method.
 *
 * Two flows:
 *  - Fresh registration: creates a provider mandate/registration. For
 *    cards this returns an approvalUrl (hosted tokenisation widget);
 *    the method activates via activateSavedPaymentMethod().
 *  - Claim after initial authorisation: pass `paymentId` of a payment
 *    that ran with card registration enabled — the token issued during
 *    that payment is stored against the customer immediately.
 */
export async function registerPaymentMethod(options: {
  merchantId: string;
  input: RegisterPaymentMethodInput;
}): Promise<SavedPaymentMethodResponse> {
  const { merchantId, input } = options;
  const methodCode = input.methodCode || 'zimswitch';

  // Idempotency: return the existing saved method for a repeated request
  if (input.idempotencyKey) {
    const existing = await getIdempotencyResult(merchantId, input.idempotencyKey);
    if (existing && existing.resourceType === 'saved_payment_method') {
      const { data } = await supabaseAdmin
        .from('saved_payment_methods')
        .select('*')
        .eq('id', existing.resourceId)
        .single();
      if (data) return toResponse(data);
    }
  }

  // Resolve the customer (get-or-create on external reference / email)
  let customerId = input.customerId || null;
  if (!customerId && (input.customerReference || input.customerEmail || input.customerPhone)) {
    const customer = await getOrCreateCustomer(merchantId, {
      externalReference: input.customerReference,
      email: input.customerEmail,
      phone: input.customerPhone,
      name: input.customerName,
    });
    customerId = customer.id;
  }

  const provider = resolveMandateProvider(methodCode);
  const reference = input.reference || `pm_${uuidv4()}`;

  // Create the provider-side tokenisation mandate. For cards this is a
  // hosted registration checkout (ZimSwitch: createRegistration=true);
  // for wallets it is the recurring debit mandate the customer approves.
  const mandateResult = await provider.createMandate({
    reference,
    amount: input.amount || 0,
    currency: input.currency || 'USD',
    interval: input.metadata?.interval || 'unscheduled',
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    returnUrl: input.returnUrl,
    cancelUrl: input.cancelUrl,
    metadata: { ...input.metadata, purpose: 'tokenisation', customerReference: input.customerReference },
  });

  const mandateId = uuidv4();
  const { error: mandateError } = await supabaseAdmin.from('payment_mandates').insert({
    id: mandateId,
    merchant_id: merchantId,
    provider_name: methodCode,
    provider_reference: mandateResult.providerReference,
    method_code: methodCode,
    customer_email: input.customerEmail,
    customer_phone: input.customerPhone,
    amount: input.amount || 0,
    currency: input.currency || 'USD',
    status: mandateResult.status,
    approval_url: mandateResult.approvalUrl,
    approved_at: mandateResult.status === 'active' ? new Date().toISOString() : null,
    metadata: { ...input.metadata, purpose: 'tokenisation' },
  });

  if (mandateError) {
    throw new Error(`Failed to create mandate: ${mandateError.message}`);
  }

  // Immediately-active mandates (mock, some wallets) carry the token
  // details on the mandate result itself.
  const card = extractCardDetails(mandateResult.providerResponse || mandateResult.metadata);
  const active = mandateResult.status === 'active';

  const methodId = uuidv4();
  const { data: saved, error: saveError } = await supabaseAdmin
    .from('saved_payment_methods')
    .insert({
      id: methodId,
      merchant_id: merchantId,
      customer_id: customerId,
      mandate_id: mandateId,
      provider_name: methodCode,
      method_code: methodCode,
      type: input.type || 'card',
      provider_reference: mandateResult.providerReference,
      card_brand: card.cardBrand,
      card_last4: card.cardLast4,
      card_exp_month: card.cardExpMonth,
      card_exp_year: card.cardExpYear,
      card_holder: card.cardHolder,
      label: input.label,
      status: active ? 'active' : 'pending',
      is_default: false,
      approval_url: mandateResult.approvalUrl,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
      activated_at: active ? new Date().toISOString() : null,
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (saveError || !saved) {
    throw new Error(`Failed to save payment method: ${saveError?.message}`);
  }

  if (input.setAsDefault && active) {
    await applyDefault(merchantId, customerId, methodId);
    saved.is_default = true;
  } else if (active) {
    // First active method for a customer becomes the default automatically
    const { count } = await supabaseAdmin
      .from('saved_payment_methods')
      .select('id', { count: 'exact', head: true })
      .eq('merchant_id', merchantId)
      .eq('customer_id', customerId)
      .eq('status', 'active');
    if (!count || count <= 1) {
      await applyDefault(merchantId, customerId, methodId);
      saved.is_default = true;
    }
  }

  if (input.idempotencyKey) {
    await recordIdempotencyKey(merchantId, input.idempotencyKey, 'saved_payment_method', methodId);
  }

  await deliverWebhookToMerchant(merchantId, 'payment_method.created', toResponse(saved));
  if (active) {
    await deliverWebhookToMerchant(merchantId, 'payment_method.activated', toResponse(saved));
  }

  return toResponse(saved);
}

/**
 * Claim the token created during an earlier payment authorisation.
 * Looks up the payment's provider attempt, verifies it, extracts the
 * registration/token and stores it as an active saved method.
 */
export async function registerPaymentMethodFromPayment(options: {
  merchantId: string;
  paymentId: string;
  input: RegisterPaymentMethodInput;
}): Promise<SavedPaymentMethodResponse> {
  const { merchantId, paymentId, input } = options;

  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .eq('merchant_id', merchantId)
    .single();
  if (!payment) throw new Error('Payment not found');

  const { data: attempt } = await supabaseAdmin
    .from('payment_attempts')
    .select('*, payment_providers(name)')
    .eq('payment_id', paymentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (!attempt?.provider_reference) throw new Error('Payment has no provider reference to claim');

  const providerName = attempt.payment_providers?.name || input.methodCode || 'zimswitch';
  const provider = providerRegistry.get(providerName);
  if (!provider?.getPayment) throw new Error(`Provider '${providerName}' cannot verify payments`);

  provider.initialize({ credentials: {}, environment: 'test' });
  const result = await provider.getPayment({ providerReference: attempt.provider_reference });

  const token = result.metadata?.registrationId || result.providerReference;
  const card = extractCardDetails(result.providerResponse || result.metadata);
  const active = result.status === 'succeeded' || result.status === 'processing';

  let customerId = input.customerId || payment.customer_id || null;
  if (!customerId && (input.customerReference || input.customerEmail || input.customerPhone)) {
    const customer = await getOrCreateCustomer(merchantId, {
      externalReference: input.customerReference,
      email: input.customerEmail || payment.customer_email,
      phone: input.customerPhone || payment.customer_phone,
      name: input.customerName,
    });
    customerId = customer.id;
  }

  const mandateId = uuidv4();
  await supabaseAdmin.from('payment_mandates').insert({
    id: mandateId,
    merchant_id: merchantId,
    provider_name: providerName,
    provider_reference: token,
    method_code: providerName,
    customer_email: input.customerEmail || payment.customer_email,
    customer_phone: input.customerPhone || payment.customer_phone,
    amount: payment.amount,
    currency: payment.currency,
    status: active ? 'active' : 'pending',
    approved_at: active ? new Date().toISOString() : null,
    metadata: { purpose: 'tokenisation', claimedFromPayment: paymentId },
  });

  const methodId = uuidv4();
  const { data: saved, error } = await supabaseAdmin
    .from('saved_payment_methods')
    .insert({
      id: methodId,
      merchant_id: merchantId,
      customer_id: customerId,
      mandate_id: mandateId,
      provider_name: providerName,
      method_code: providerName,
      type: 'card',
      provider_reference: token,
      card_brand: card.cardBrand,
      card_last4: card.cardLast4,
      card_exp_month: card.cardExpMonth,
      card_exp_year: card.cardExpYear,
      card_holder: card.cardHolder,
      label: input.label,
      status: active ? 'active' : 'pending',
      is_default: false,
      customer_email: input.customerEmail || payment.customer_email,
      customer_phone: input.customerPhone || payment.customer_phone,
      activated_at: active ? new Date().toISOString() : null,
      metadata: { ...input.metadata, claimedFromPayment: paymentId },
    })
    .select()
    .single();

  if (error || !saved) {
    throw new Error(`Failed to save payment method: ${error?.message}`);
  }

  if (input.setAsDefault) {
    await applyDefault(merchantId, customerId, methodId);
    saved.is_default = true;
  }

  await deliverWebhookToMerchant(merchantId, 'payment_method.created', toResponse(saved));
  if (active) {
    await deliverWebhookToMerchant(merchantId, 'payment_method.activated', toResponse(saved));
  }

  return toResponse(saved);
}

/**
 * Activate a pending saved method after the customer completes the
 * provider's hosted tokenisation flow. Resolves the durable token
 * (e.g. ZimSwitch registrationId) from the transient checkout reference.
 */
export async function activateSavedPaymentMethod(
  methodId: string,
  merchantId?: string
): Promise<SavedPaymentMethodResponse> {
  let query = supabaseAdmin.from('saved_payment_methods').select('*').eq('id', methodId);
  if (merchantId) query = query.eq('merchant_id', merchantId);
  const { data: method } = await query.single();

  if (!method) throw new Error('Saved payment method not found');
  if (method.status === 'active') return toResponse(method);
  if (method.status !== 'pending') {
    throw new Error(`Cannot activate payment method with status ${method.status}`);
  }

  const { data: mandate } = await supabaseAdmin
    .from('payment_mandates')
    .select('*')
    .eq('id', method.mandate_id)
    .single();
  if (!mandate) throw new Error('Underlying mandate not found');

  // Resolve the durable provider token (registrationId for card checkouts)
  const captured = await captureTokenForMandate(mandate);
  const tokenReference = captured?.tokenReference || mandate.provider_reference;
  const card = captured?.card || extractCardDetails(mandate.metadata?.card);

  const now = new Date().toISOString();
  await supabaseAdmin
    .from('payment_mandates')
    .update({ status: 'active', approved_at: now, provider_reference: tokenReference })
    .eq('id', mandate.id);

  const { data: updated } = await supabaseAdmin
    .from('saved_payment_methods')
    .update({
      status: 'active',
      provider_reference: tokenReference,
      card_brand: card.cardBrand || method.card_brand,
      card_last4: card.cardLast4 || method.card_last4,
      card_exp_month: card.cardExpMonth || method.card_exp_month,
      card_exp_year: card.cardExpYear || method.card_exp_year,
      card_holder: card.cardHolder || method.card_holder,
      approval_url: null,
      activated_at: now,
    })
    .eq('id', methodId)
    .select()
    .single();

  // First active method for the customer becomes default
  const { count } = await supabaseAdmin
    .from('saved_payment_methods')
    .select('id', { count: 'exact', head: true })
    .eq('merchant_id', method.merchant_id)
    .eq('customer_id', method.customer_id)
    .eq('status', 'active')
    .eq('is_default', true);
  if (!count) {
    await applyDefault(method.merchant_id, method.customer_id, methodId);
    updated!.is_default = true;
  }

  await deliverWebhookToMerchant(method.merchant_id, 'payment_method.activated', toResponse(updated!));

  return toResponse(updated!);
}

export async function getSavedPaymentMethod(
  methodId: string,
  merchantId: string
): Promise<SavedPaymentMethodResponse> {
  const { data } = await supabaseAdmin
    .from('saved_payment_methods')
    .select('*')
    .eq('id', methodId)
    .eq('merchant_id', merchantId)
    .single();

  if (!data) throw new Error('Saved payment method not found');
  return toResponse(data);
}

export async function listSavedPaymentMethods(
  merchantId: string,
  options: { customerId?: string; customerEmail?: string; status?: string; limit?: number; offset?: number } = {}
): Promise<SavedPaymentMethodResponse[]> {
  const limit = options.limit || 50;
  const offset = options.offset || 0;

  let query = supabaseAdmin
    .from('saved_payment_methods')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.customerId) query = query.eq('customer_id', options.customerId);
  if (options.customerEmail) query = query.eq('customer_email', options.customerEmail);
  if (options.status) query = query.eq('status', options.status);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list payment methods: ${error.message}`);

  return (data || []).map(toResponse);
}

/**
 * Update a saved method — rename or set it as the customer's default.
 */
export async function updateSavedPaymentMethod(
  methodId: string,
  merchantId: string,
  input: UpdatePaymentMethodInput
): Promise<SavedPaymentMethodResponse> {
  const { data: method } = await supabaseAdmin
    .from('saved_payment_methods')
    .select('*')
    .eq('id', methodId)
    .eq('merchant_id', merchantId)
    .single();

  if (!method) throw new Error('Saved payment method not found');

  const updates: Record<string, any> = {};
  if (input.label !== undefined) updates.label = input.label;
  if (Object.keys(updates).length > 0) {
    await supabaseAdmin.from('saved_payment_methods').update(updates).eq('id', methodId);
  }

  if (input.setAsDefault) {
    if (method.status !== 'active') throw new Error('Only active payment methods can be default');
    await applyDefault(merchantId, method.customer_id, methodId);
  }

  return getSavedPaymentMethod(methodId, merchantId);
}

/**
 * Remove a saved method — revokes the provider token so no further
 * merchant-initiated charges are possible.
 */
export async function removeSavedPaymentMethod(
  methodId: string,
  merchantId: string
): Promise<SavedPaymentMethodResponse> {
  const { data: method } = await supabaseAdmin
    .from('saved_payment_methods')
    .select('*')
    .eq('id', methodId)
    .eq('merchant_id', merchantId)
    .single();

  if (!method) throw new Error('Saved payment method not found');
  if (method.status === 'revoked') return toResponse(method);

  // Block removal while subscriptions still bill against it
  const { count: activeSubs } = await supabaseAdmin
    .from('subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('saved_payment_method_id', methodId)
    .in('status', ['active', 'past_due', 'paused']);
  if (activeSubs && activeSubs > 0) {
    throw new Error('Payment method is in use by active subscriptions');
  }

  // Revoke the provider token (DELETE registration / mandate revoke)
  const provider = providerRegistry.get(method.provider_name);
  if (provider?.revokeMandate && method.status === 'active') {
    try {
      provider.initialize({ credentials: {}, environment: 'test' });
      await provider.revokeMandate({
        mandateReference: method.provider_reference!,
        reason: 'payment_method_removed',
      });
    } catch {
      // Revocation is best-effort — the token is marked revoked locally regardless
    }
  }

  const now = new Date().toISOString();
  if (method.mandate_id) {
    await supabaseAdmin
      .from('payment_mandates')
      .update({ status: 'revoked', revoked_at: now })
      .eq('id', method.mandate_id);
  }

  const { data: updated } = await supabaseAdmin
    .from('saved_payment_methods')
    .update({ status: 'revoked', is_default: false })
    .eq('id', methodId)
    .select()
    .single();

  await deliverWebhookToMerchant(merchantId, 'payment_method.removed', toResponse(updated!));

  return toResponse(updated!);
}
