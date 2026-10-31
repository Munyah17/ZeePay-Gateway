import { supabaseAdmin } from '../database/client';
import { providerRegistry } from '../providers/registry';
import { PaymentProvider } from '../providers/interface';
import { v4 as uuidv4 } from 'uuid';
import { getIdempotencyResult, recordIdempotencyKey } from '../utils/idempotency';
import { deliverWebhookToMerchant } from '../webhooks/delivery';
import {
  CreatePlanInput,
  CreateSubscriptionInput,
  SubscriptionPlanResponse,
  SubscriptionResponse,
  SubscriptionStatus,
  ProcessDueResult,
} from '@/types/subscription';
import { captureTokenForMandate } from './saved-payment-method-service';

interface SubscriptionRow {
  id: string;
  merchant_id: string;
  mandate_id: string;
  merchant_reference: string;
  description: string | null;
  amount: number;
  currency: string;
  interval: string;
  interval_count: number;
  customer_email: string | null;
  customer_phone: string | null;
  status: SubscriptionStatus;
  next_billing_date: string | null;
  last_billed_at: string | null;
  consecutive_failures: number;
  max_retries: number;
  start_date: string;
  end_date: string | null;
  cancelled_at: string | null;
  plan_id: string | null;
  saved_payment_method_id: string | null;
  locked_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

interface MandateRow {
  id: string;
  merchant_id: string;
  provider_name: string;
  provider_reference: string;
  method_code: string;
  status: string;
  approval_url: string | null;
}

// Retry window grows linearly: +1 day after 1st failure, +2 days after 2nd, etc.
const RETRY_DELAY_DAYS = 1;

/**
 * Map a payment method code to its provider name.
 * In this platform method codes align with provider names.
 */
type MandateCapableProvider = PaymentProvider &
  Required<Pick<PaymentProvider, 'createMandate' | 'chargeMandate'>>;

function resolveProvider(methodCode: string): MandateCapableProvider {
  const provider = providerRegistry.get(methodCode);
  if (!provider) {
    throw new Error(`No provider available for method '${methodCode}'`);
  }

  const capabilities = provider.getCapabilities();
  if (!capabilities.supportsRecurring || !provider.createMandate || !provider.chargeMandate) {
    throw new Error(`Provider '${methodCode}' does not support recurring auto-deduct`);
  }

  provider.initialize({ credentials: {}, environment: 'test' });
  return provider as MandateCapableProvider;
}

/**
 * Advance a date by the billing interval.
 */
function advanceBillingDate(from: Date, interval: string, count: number): Date {
  const next = new Date(from);
  switch (interval) {
    case 'daily':
      next.setDate(next.getDate() + count);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7 * count);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + count);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + count);
      break;
  }
  return next;
}

function toResponse(row: SubscriptionRow, mandate?: MandateRow | null): SubscriptionResponse {
  return {
    id: row.id,
    reference: row.merchant_reference,
    description: row.description || undefined,
    amount: row.amount,
    currency: row.currency,
    interval: row.interval as SubscriptionResponse['interval'],
    intervalCount: row.interval_count,
    status: row.status,
    methodCode: mandate?.method_code || '',
    customerEmail: row.customer_email || undefined,
    customerPhone: row.customer_phone || undefined,
    nextBillingDate: row.next_billing_date || undefined,
    lastBilledAt: row.last_billed_at || undefined,
    approvalUrl: mandate?.approval_url || undefined,
    mandateId: row.mandate_id,
    planId: row.plan_id || undefined,
    savedPaymentMethodId: row.saved_payment_method_id || undefined,
    createdAt: row.created_at,
  };
}

// --- Subscription plans -------------------------------------------------

function planToResponse(row: any): SubscriptionPlanResponse {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    amount: row.amount,
    currency: row.currency,
    interval: row.interval,
    intervalCount: row.interval_count,
    isActive: row.is_active,
    metadata: row.metadata || undefined,
    createdAt: row.created_at,
  };
}

export async function createPlan(
  merchantId: string,
  input: CreatePlanInput
): Promise<SubscriptionPlanResponse> {
  const { data, error } = await supabaseAdmin
    .from('subscription_plans')
    .insert({
      id: uuidv4(),
      merchant_id: merchantId,
      name: input.name,
      description: input.description,
      amount: input.amount,
      currency: input.currency,
      interval: input.interval,
      interval_count: input.intervalCount || 1,
      is_active: true,
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to create plan: ${error?.message}`);
  return planToResponse(data);
}

export async function getPlan(planId: string, merchantId: string): Promise<SubscriptionPlanResponse> {
  const { data } = await supabaseAdmin
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .eq('merchant_id', merchantId)
    .single();
  if (!data) throw new Error('Plan not found');
  return planToResponse(data);
}

export async function listPlans(
  merchantId: string,
  options: { limit?: number; offset?: number; activeOnly?: boolean } = {}
): Promise<SubscriptionPlanResponse[]> {
  let query = supabaseAdmin
    .from('subscription_plans')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false })
    .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);

  if (options.activeOnly) query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list plans: ${error.message}`);
  return (data || []).map(planToResponse);
}

export async function updatePlan(
  planId: string,
  merchantId: string,
  input: Partial<CreatePlanInput> & { isActive?: boolean }
): Promise<SubscriptionPlanResponse> {
  const updates: Record<string, any> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.amount !== undefined) updates.amount = input.amount;
  if (input.currency !== undefined) updates.currency = input.currency;
  if (input.interval !== undefined) updates.interval = input.interval;
  if (input.intervalCount !== undefined) updates.interval_count = input.intervalCount;
  if (input.isActive !== undefined) updates.is_active = input.isActive;

  const { data, error } = await supabaseAdmin
    .from('subscription_plans')
    .update(updates)
    .eq('id', planId)
    .eq('merchant_id', merchantId)
    .select()
    .single();

  if (error || !data) throw new Error('Plan not found or update failed');
  return planToResponse(data);
}

/**
 * Create a subscription. Creates the underlying payment mandate with the
 * provider — for mobile money the customer approves once (USSD/PIN/web),
 * for cards the mandate is tokenized during an initial authorization.
 * Once the mandate is active, ZeePay auto-deducts on each billing date.
 */
export async function createSubscription(options: {
  merchantId: string;
  input: CreateSubscriptionInput;
}): Promise<SubscriptionResponse> {
  const { merchantId, input } = options;
  const intervalCount = input.intervalCount || 1;

  // Idempotency: return the existing subscription for a repeated request
  if (input.idempotencyKey) {
    const existing = await getIdempotencyResult(merchantId, input.idempotencyKey);
    if (existing && existing.resourceType === 'subscription') {
      const { data } = await supabaseAdmin
        .from('subscriptions')
        .select('*, payment_mandates(*)')
        .eq('id', existing.resourceId)
        .single();
      if (data) {
        return toResponse(data, data.payment_mandates);
      }
    }
  }

  // Resolve billing terms from a plan when supplied
  let amount = input.amount;
  let currency = input.currency;
  let interval = input.interval;
  const planId: string | null = input.planId || null;

  if (planId) {
    const { data: plan } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('merchant_id', merchantId)
      .single();
    if (!plan) throw new Error('Plan not found');
    if (!plan.is_active) throw new Error('Plan is not active');
    amount = amount ?? plan.amount;
    currency = currency ?? plan.currency;
    interval = interval ?? plan.interval;
    if (!input.intervalCount) {
      input.intervalCount = plan.interval_count;
    }
  }

  if (amount == null || !currency || !interval) {
    throw new Error('amount, currency and interval are required (or supply planId)');
  }
  const intervalCountFinal = input.intervalCount || intervalCount;

  // Subscribing via an already-tokenised payment method skips provider
  // mandate creation — the customer authorised once already.
  let mandateResult: { providerReference: string; status: string; approvalUrl?: string } | null = null;
  let savedMethod: any = null;

  if (input.savedPaymentMethodId) {
    const { data: method } = await supabaseAdmin
      .from('saved_payment_methods')
      .select('*')
      .eq('id', input.savedPaymentMethodId)
      .eq('merchant_id', merchantId)
      .single();
    if (!method) throw new Error('Saved payment method not found');
    if (method.status !== 'active') {
      throw new Error(`Payment method is ${method.status} — subscribe requires an active method`);
    }
    savedMethod = method;
    input.methodCode = method.method_code;
  }

  if (!input.methodCode) {
    throw new Error('methodCode is required (or supply savedPaymentMethodId)');
  }

  if (!savedMethod) {
    const provider = resolveProvider(input.methodCode);
    mandateResult = await provider.createMandate({
      reference: input.merchantReference,
      amount,
      currency,
      interval: `${intervalCountFinal} ${interval}`,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
      metadata: input.metadata,
    });
  }

  const mandateId = uuidv4();
  const { error: mandateError } = await supabaseAdmin
    .from('payment_mandates')
    .insert({
      id: mandateId,
      merchant_id: merchantId,
      provider_name: input.methodCode,
      // Saved methods reuse the token already stored at the provider
      provider_reference: savedMethod ? savedMethod.provider_reference : mandateResult!.providerReference,
      method_code: input.methodCode,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
      amount,
      currency,
      status: savedMethod ? 'active' : mandateResult!.status,
      approval_url: savedMethod ? null : mandateResult!.approvalUrl,
      approved_at: savedMethod || mandateResult!.status === 'active' ? new Date().toISOString() : null,
      metadata: { ...(input.metadata || {}), subscription: true },
    });

  if (mandateError) {
    throw new Error(`Failed to create mandate: ${mandateError.message}`);
  }

  // Active mandates start billing immediately; pending ones wait for approval
  const mandateActive = savedMethod ? true : mandateResult!.status === 'active';
  const startDate = input.startDate ? new Date(input.startDate) : new Date();

  const subscriptionId = uuidv4();
  const { data: subscription, error: subError } = await supabaseAdmin
    .from('subscriptions')
    .insert({
      id: subscriptionId,
      merchant_id: merchantId,
      mandate_id: mandateId,
      plan_id: planId,
      saved_payment_method_id: savedMethod?.id || null,
      merchant_reference: input.merchantReference,
      description: input.description,
      amount,
      currency,
      interval,
      interval_count: intervalCountFinal,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
      status: mandateActive ? 'active' : 'pending',
      next_billing_date: mandateActive ? startDate.toISOString() : null,
      max_retries: input.maxRetries || 3,
      consecutive_failures: 0,
      start_date: startDate.toISOString(),
      end_date: input.endDate || null,
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (subError || !subscription) {
    throw new Error(`Failed to create subscription: ${subError?.message}`);
  }

  if (input.idempotencyKey) {
    await recordIdempotencyKey(merchantId, input.idempotencyKey, 'subscription', subscriptionId);
  }

  const mandate: MandateRow = {
    id: mandateId,
    merchant_id: merchantId,
    provider_name: input.methodCode,
    provider_reference: savedMethod ? savedMethod.provider_reference : mandateResult!.providerReference,
    method_code: input.methodCode,
    status: savedMethod ? 'active' : mandateResult!.status,
    approval_url: savedMethod ? null : mandateResult!.approvalUrl || null,
  };

  await deliverWebhookToMerchant(merchantId, 'subscription.created', toResponse(subscription, mandate));
  if (mandateActive) {
    await deliverWebhookToMerchant(merchantId, 'subscription.activated', toResponse(subscription, mandate));
  }

  return toResponse(subscription, mandate);
}

/**
 * Mark a pending subscription's mandate as approved — called when the
 * customer completes the provider's authorization (PIN/USSD/3DS).
 */
export async function approveSubscription(subscriptionId: string): Promise<SubscriptionResponse> {
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('*, payment_mandates(*)')
    .eq('id', subscriptionId)
    .single();

  if (!sub) throw new Error('Subscription not found');
  if (sub.status !== 'pending') throw new Error(`Cannot approve subscription with status ${sub.status}`);

  const now = new Date();
  const nextBilling = advanceBillingDate(now, sub.interval, sub.interval_count);

  // For card mandates created via a hosted registration checkout, the
  // durable token (e.g. ZimSwitch registrationId) is issued only after
  // the shopper completes the widget — capture it now.
  const captured = await captureTokenForMandate(sub.payment_mandates);
  const tokenReference = captured?.tokenReference || sub.payment_mandates.provider_reference;

  await supabaseAdmin
    .from('payment_mandates')
    .update({ status: 'active', approved_at: now.toISOString(), provider_reference: tokenReference })
    .eq('id', sub.mandate_id);

  const { data: updated } = await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'active', next_billing_date: nextBilling.toISOString() })
    .eq('id', subscriptionId)
    .select()
    .single();

  await deliverWebhookToMerchant(sub.merchant_id, 'subscription.activated', toResponse(updated!, sub.payment_mandates));

  return toResponse(updated!, sub.payment_mandates);
}

/**
 * Execute one auto-deduct charge for a subscription.
 * Creates a payment record, debits the mandate via the provider,
 * and links the attempt in subscription_charges.
 */
async function chargeSubscription(subscription: SubscriptionRow, attemptNumber: number): Promise<'succeeded' | 'failed'> {
  const { data: mandate } = await supabaseAdmin
    .from('payment_mandates')
    .select('*')
    .eq('id', subscription.mandate_id)
    .single();

  if (!mandate || mandate.status !== 'active') {
    throw new Error('Mandate is not active');
  }

  const provider = resolveProvider(mandate.method_code);
  const chargeReference = `${subscription.merchant_reference}-auto-${Date.now()}`;

  // Record the payment + attempt
  const paymentId = uuidv4();
  await supabaseAdmin.from('payments').insert({
    id: paymentId,
    merchant_id: subscription.merchant_id,
    merchant_reference: chargeReference,
    amount: subscription.amount,
    currency: subscription.currency,
    status: 'processing',
    customer_email: subscription.customer_email,
    customer_phone: subscription.customer_phone,
    metadata: {
      subscriptionId: subscription.id,
      initiator: 'merchant_auto_deduct',
      ...(subscription.metadata || {}),
    },
  });

  // Resolve the provider row for the attempt record
  const { data: providerRow } = await supabaseAdmin
    .from('payment_providers')
    .select('id')
    .eq('name', mandate.method_code)
    .single();

  const chargeId = uuidv4();
  await supabaseAdmin.from('subscription_charges').insert({
    id: chargeId,
    subscription_id: subscription.id,
    payment_id: paymentId,
    amount: subscription.amount,
    currency: subscription.currency,
    status: 'pending',
    attempt_number: attemptNumber,
  });

  try {
    const result = await provider.chargeMandate({
      mandateReference: mandate.provider_reference,
      amount: subscription.amount,
      currency: subscription.currency,
      reference: chargeReference,
      metadata: { subscriptionId: subscription.id, ...subscription.metadata },
    });

    const succeeded = result.status === 'succeeded';

    await supabaseAdmin
      .from('payments')
      .update({ status: result.status, completed_at: succeeded ? new Date().toISOString() : null })
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

    await supabaseAdmin
      .from('subscription_charges')
      .update({ status: succeeded ? 'succeeded' : 'failed' })
      .eq('id', chargeId);

    if (succeeded) {
      return 'succeeded';
    }

    await supabaseAdmin
      .from('subscription_charges')
      .update({ error_message: `Provider returned status ${result.status}` })
      .eq('id', chargeId);
    return 'failed';
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    await supabaseAdmin
      .from('payments')
      .update({ status: 'failed' })
      .eq('id', paymentId);
    await supabaseAdmin
      .from('subscription_charges')
      .update({ status: 'failed', error_message: message })
      .eq('id', chargeId);

    return 'failed';
  }
}

/**
 * Billing run — the auto-deduct engine.
 * Finds all active subscriptions whose next billing date has passed
 * and charges their mandates. On failure the subscription goes
 * past_due and retries until max_retries, then it is cancelled.
 */
export async function processDueSubscriptions(options?: { limit?: number }): Promise<ProcessDueResult> {
  const limit = options?.limit || 100;
  const now = new Date();

  const { data: due, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .in('status', ['active', 'past_due'])
    .lte('next_billing_date', now.toISOString())
    .or(`locked_at.is.null,locked_at.lt.${new Date(now.getTime() - 10 * 60 * 1000).toISOString()}`)
    .order('next_billing_date', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch due subscriptions: ${error.message}`);
  }

  const result: ProcessDueResult = { processed: 0, succeeded: 0, failed: 0, cancelled: 0, errors: [] };

  for (const sub of (due || []) as SubscriptionRow[]) {
    // Skip subscriptions past their end date — cancel them instead
    if (sub.end_date && new Date(sub.end_date) <= now) {
      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'cancelled', cancelled_at: now.toISOString() })
        .eq('id', sub.id);
      result.cancelled++;
      continue;
    }

    // Claim the subscription for this run — prevents double deductions
    // when two billing runs overlap (idempotency at the schedule level).
    const { data: claimed } = await supabaseAdmin
      .from('subscriptions')
      .update({ locked_at: now.toISOString() })
      .eq('id', sub.id)
      .or(`locked_at.is.null,locked_at.lt.${new Date(now.getTime() - 10 * 60 * 1000).toISOString()}`)
      .in('status', ['active', 'past_due'])
      .lte('next_billing_date', now.toISOString())
      .select('id');

    if (!claimed || claimed.length === 0) {
      continue; // Another run claimed it — skip, don't double-charge
    }

    result.processed++;
    const attemptNumber = sub.consecutive_failures + 1;

    try {
      const outcome = await chargeSubscription(sub, attemptNumber);

      if (outcome === 'succeeded') {
        const nextBilling = advanceBillingDate(now, sub.interval, sub.interval_count);
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'active',
            last_billed_at: now.toISOString(),
            next_billing_date: nextBilling.toISOString(),
            consecutive_failures: 0,
            locked_at: null,
          })
          .eq('id', sub.id);

        result.succeeded++;
        await deliverWebhookToMerchant(sub.merchant_id, 'subscription.charge_succeeded', {
          subscriptionId: sub.id,
          reference: sub.merchant_reference,
          amount: sub.amount,
          currency: sub.currency,
          nextBillingDate: nextBilling.toISOString(),
        });
      } else {
        const failures = sub.consecutive_failures + 1;
        const exhausted = failures >= sub.max_retries;

        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: exhausted ? 'cancelled' : 'past_due',
            consecutive_failures: failures,
            cancelled_at: exhausted ? now.toISOString() : null,
            next_billing_date: exhausted
              ? null
              : advanceBillingDate(now, 'daily', RETRY_DELAY_DAYS * failures).toISOString(),
            locked_at: null,
          })
          .eq('id', sub.id);

        result.failed++;
        await deliverWebhookToMerchant(sub.merchant_id, 'subscription.charge_failed', {
          subscriptionId: sub.id,
          reference: sub.merchant_reference,
          amount: sub.amount,
          currency: sub.currency,
          attempt: failures,
          willRetry: !exhausted,
        });

        if (exhausted) {
          result.cancelled++;
          const { data: mandate } = await supabaseAdmin
            .from('payment_mandates')
            .select('*')
            .eq('id', sub.mandate_id)
            .single();
          const provider = providerRegistry.get(mandate?.method_code || 'mock');

          if (mandate && provider?.revokeMandate) {
            provider.initialize({ credentials: {}, environment: 'test' });
            await provider.revokeMandate({ mandateReference: mandate.provider_reference, reason: 'max_retries_exceeded' }).catch(() => {});
            await supabaseAdmin
              .from('payment_mandates')
              .update({ status: 'revoked', revoked_at: now.toISOString() })
              .eq('id', sub.mandate_id);
          }

          await deliverWebhookToMerchant(sub.merchant_id, 'subscription.cancelled', {
            subscriptionId: sub.id,
            reference: sub.merchant_reference,
            reason: 'max_retries_exceeded',
          });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push({ subscriptionId: sub.id, error: message });
      // Release the claim so a later run can retry this subscription
      await supabaseAdmin
        .from('subscriptions')
        .update({ locked_at: null })
        .eq('id', sub.id);
    }
  }

  return result;
}

/**
 * Pause an active subscription — stops auto-deduct until resumed.
 */
export async function pauseSubscription(subscriptionId: string, merchantId: string): Promise<SubscriptionResponse> {
  const { data: sub, error } = await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'paused' })
    .eq('id', subscriptionId)
    .eq('merchant_id', merchantId)
    .in('status', ['active', 'past_due'])
    .select('*, payment_mandates(*)')
    .single();

  if (error || !sub) throw new Error('Subscription not found or cannot be paused');

  await deliverWebhookToMerchant(merchantId, 'subscription.updated', toResponse(sub, sub.payment_mandates));
  return toResponse(sub, sub.payment_mandates);
}

/**
 * Resume a paused subscription — schedules the next billing date.
 */
export async function resumeSubscription(subscriptionId: string, merchantId: string): Promise<SubscriptionResponse> {
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('*, payment_mandates(*)')
    .eq('id', subscriptionId)
    .eq('merchant_id', merchantId)
    .single();

  if (!sub || sub.status !== 'paused') throw new Error('Subscription not found or not paused');

  const nextBilling = advanceBillingDate(new Date(), sub.interval, sub.interval_count);
  const { data: updated } = await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'active', next_billing_date: nextBilling.toISOString() })
    .eq('id', subscriptionId)
    .select('*, payment_mandates(*)')
    .single();

  await deliverWebhookToMerchant(merchantId, 'subscription.updated', toResponse(updated!, updated!.payment_mandates));
  return toResponse(updated!, updated!.payment_mandates);
}

/**
 * Cancel a subscription and revoke its mandate — stops all future auto-deducts.
 */
export async function cancelSubscription(
  subscriptionId: string,
  merchantId: string,
  reason?: string
): Promise<SubscriptionResponse> {
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('*, payment_mandates(*)')
    .eq('id', subscriptionId)
    .eq('merchant_id', merchantId)
    .single();

  if (!sub) throw new Error('Subscription not found');
  if (sub.status === 'cancelled') return toResponse(sub, sub.payment_mandates);

  const now = new Date().toISOString();

  // Revoke the mandate at the provider so no further debits are possible
  const provider = providerRegistry.get(sub.payment_mandates?.method_code || 'mock');
  if (provider?.revokeMandate && sub.payment_mandates?.status === 'active') {
    provider.initialize({ credentials: {}, environment: 'test' });
    await provider.revokeMandate({
      mandateReference: sub.payment_mandates.provider_reference,
      reason: reason || 'subscription_cancelled',
    }).catch(() => {});
  }

  await supabaseAdmin
    .from('payment_mandates')
    .update({ status: 'revoked', revoked_at: now })
    .eq('id', sub.mandate_id);

  const { data: updated } = await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'cancelled', cancelled_at: now, next_billing_date: null })
    .eq('id', subscriptionId)
    .select('*, payment_mandates(*)')
    .single();

  await deliverWebhookToMerchant(merchantId, 'subscription.cancelled', {
    ...toResponse(updated!, updated!.payment_mandates),
    reason: reason || 'cancelled',
  });

  return toResponse(updated!, updated!.payment_mandates);
}

/**
 * Get a single subscription.
 */
export async function getSubscription(subscriptionId: string, merchantId: string): Promise<SubscriptionResponse> {
  const { data: sub, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*, payment_mandates(*)')
    .eq('id', subscriptionId)
    .eq('merchant_id', merchantId)
    .single();

  if (error || !sub) throw new Error('Subscription not found');
  return toResponse(sub, sub.payment_mandates);
}

/**
 * List subscriptions for a merchant.
 */
/**
 * Move a subscription to a different plan or override its billing
 * terms — upgrades/downgrades take effect from the next billing date.
 */
export async function updateSubscriptionPlan(
  subscriptionId: string,
  merchantId: string,
  options: { planId?: string; amount?: number; interval?: string; intervalCount?: number }
): Promise<SubscriptionResponse> {
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('*, payment_mandates(*)')
    .eq('id', subscriptionId)
    .eq('merchant_id', merchantId)
    .single();

  if (!sub) throw new Error('Subscription not found');
  if (!['active', 'past_due', 'paused'].includes(sub.status)) {
    throw new Error(`Cannot change plan on a ${sub.status} subscription`);
  }

  const updates: Record<string, any> = {};

  if (options.planId) {
    const { data: plan } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('id', options.planId)
      .eq('merchant_id', merchantId)
      .single();
    if (!plan) throw new Error('Plan not found');
    if (!plan.is_active) throw new Error('Plan is not active');
    updates.plan_id = plan.id;
    updates.amount = options.amount ?? plan.amount;
    updates.interval = options.interval ?? plan.interval;
    updates.interval_count = options.intervalCount ?? plan.interval_count;
    updates.currency = plan.currency;
  } else {
    if (options.amount !== undefined) updates.amount = options.amount;
    if (options.interval !== undefined) updates.interval = options.interval;
    if (options.intervalCount !== undefined) updates.interval_count = options.intervalCount;
  }

  if (Object.keys(updates).length === 0) {
    throw new Error('Nothing to update — supply planId, amount, interval or intervalCount');
  }

  const { data: updated } = await supabaseAdmin
    .from('subscriptions')
    .update(updates)
    .eq('id', subscriptionId)
    .select('*, payment_mandates(*)')
    .single();

  await deliverWebhookToMerchant(merchantId, 'subscription.updated', toResponse(updated!, updated!.payment_mandates));

  return toResponse(updated!, updated!.payment_mandates);
}

/**
 * List subscriptions for a merchant.
 */
export async function listSubscriptions(
  merchantId: string,
  options?: { limit?: number; offset?: number; status?: string }
): Promise<SubscriptionResponse[]> {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  let query = supabaseAdmin
    .from('subscriptions')
    .select('*, payment_mandates(*)')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list subscriptions: ${error.message}`);

  return (data || []).map((sub: any) => toResponse(sub, sub.payment_mandates));
}
