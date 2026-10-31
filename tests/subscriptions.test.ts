import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/database/client', async () => {
  const fake = await import('./helpers/fake-db');
  return { supabaseAdmin: fake.supabaseAdmin, supabaseClient: fake.supabaseAdmin };
});
vi.mock('@/lib/webhooks/delivery', async () => {
  const fake = await import('./helpers/fake-db');
  return { deliverWebhookToMerchant: fake.deliverWebhookToMerchant };
});

import { table, resetDb, webhookEvents } from './helpers/fake-db';
import {
  createPlan,
  listPlans,
  updatePlan,
  createSubscription,
  approveSubscription,
  processDueSubscriptions,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  updateSubscriptionPlan,
  getSubscription,
} from '@/lib/services/subscription-service';
import { registerPaymentMethod } from '@/lib/services/saved-payment-method-service';
import { providerRegistry } from '@/lib/providers/registry';
import { MockProvider } from '@/lib/providers/mock/mock-provider';

const MERCHANT = 'm1';

beforeEach(() => {
  resetDb();
  table('merchants').push({ id: MERCHANT });
  table('payment_providers').push({ id: 'pp_mock', name: 'mock' });
});

describe('Subscription plans', () => {
  it('creates, lists, updates and deactivates plans', async () => {
    const plan = await createPlan(MERCHANT, {
      name: 'Pro',
      amount: 25,
      currency: 'USD',
      interval: 'monthly',
    });
    expect(plan.isActive).toBe(true);

    const plans = await listPlans(MERCHANT);
    expect(plans).toHaveLength(1);

    const updated = await updatePlan(plan.id, MERCHANT, { amount: 30 });
    expect(updated.amount).toBe(30);

    const deactivated = await updatePlan(plan.id, MERCHANT, { isActive: false });
    expect(deactivated.isActive).toBe(false);
  });
});

describe('Recurring subscriptions', () => {
  it('creates a subscription from a plan — terms resolve from the plan', async () => {
    const plan = await createPlan(MERCHANT, { name: 'Pro', amount: 20, currency: 'USD', interval: 'monthly' });
    const sub = await createSubscription({
      merchantId: MERCHANT,
      input: { merchantReference: 'sub_1', planId: plan.id, methodCode: 'mock', customerEmail: 'a@x.com' },
    });
    expect(sub.status).toBe('active'); // mock mandates auto-approve
    expect(sub.amount).toBe(20);
    expect(sub.interval).toBe('monthly');
    expect(sub.planId).toBe(plan.id);
  });

  it('creates a subscription on a tokenised card — no approval step needed', async () => {
    const method = await registerPaymentMethod({
      merchantId: MERCHANT,
      input: { methodCode: 'mock', customerEmail: 's@x.com', customerReference: 's1' },
    });
    const sub = await createSubscription({
      merchantId: MERCHANT,
      input: {
        merchantReference: 'sub_card',
        amount: 15,
        currency: 'USD',
        interval: 'monthly',
        savedPaymentMethodId: method.id,
        customerEmail: 's@x.com',
      },
    });
    expect(sub.status).toBe('active');
    expect(sub.savedPaymentMethodId).toBe(method.id);
    expect(sub.approvalUrl).toBeUndefined();
    // The mandate reuses the stored provider token
    const mandate = table('payment_mandates').find((m) => m.id === sub.mandateId);
    expect(mandate?.provider_reference).toBe(table('saved_payment_methods')[0].provider_reference);
    expect(webhookEvents.some((e) => e.eventType === 'subscription.activated')).toBe(true);
  });

  it('rejects a subscription on a non-active saved method', async () => {
    const method = await registerPaymentMethod({
      merchantId: MERCHANT,
      input: { methodCode: 'mock', customerEmail: 'p@x.com' },
    });
    table('saved_payment_methods')[0].status = 'pending';
    await expect(
      createSubscription({
        merchantId: MERCHANT,
        input: { merchantReference: 'sub_x', amount: 5, currency: 'USD', interval: 'monthly', savedPaymentMethodId: method.id },
      })
    ).rejects.toThrow(/pending/);
  });

  it('approves a pending subscription and starts billing', async () => {
    const sub = await createSubscription({
      merchantId: MERCHANT,
      input: { merchantReference: 'sub_2', amount: 10, currency: 'USD', interval: 'monthly', methodCode: 'mock' },
    });
    table('subscriptions').find((s) => s.id === sub.id)!.status = 'pending';
    table('subscriptions').find((s) => s.id === sub.id)!.next_billing_date = null;

    const approved = await approveSubscription(sub.id);
    expect(approved.status).toBe('active');
    expect(approved.nextBillingDate).toBeTruthy();
    expect(webhookEvents.some((e) => e.eventType === 'subscription.activated')).toBe(true);
  });

  it('auto-deducts on the billing date and advances the schedule', async () => {
    const sub = await createSubscription({
      merchantId: MERCHANT,
      input: { merchantReference: 'sub_3', amount: 10, currency: 'USD', interval: 'monthly', methodCode: 'mock' },
    });
    // Make it due right now
    const row = table('subscriptions').find((s) => s.id === sub.id)!;
    row.next_billing_date = new Date(Date.now() - 1000).toISOString();

    const result = await processDueSubscriptions();
    expect(result.processed).toBe(1);
    expect(result.succeeded).toBe(1);

    const charge = table('subscription_charges')[0];
    expect(charge.subscription_id).toBe(sub.id);
    expect(charge.status).toBe('succeeded');
    expect(charge.amount).toBe(10);

    // Schedule advanced ~1 month, failure count reset, lock released
    expect(new Date(row.next_billing_date).getTime()).toBeGreaterThan(Date.now() + 25 * 86400000);
    expect(row.consecutive_failures).toBe(0);
    expect(row.locked_at).toBeNull();

    expect(webhookEvents.some((e) => e.eventType === 'subscription.charge_succeeded')).toBe(true);
  });

  it('does not double-charge when a second run overlaps (lock claim)', async () => {
    const sub = await createSubscription({
      merchantId: MERCHANT,
      input: { merchantReference: 'sub_lock', amount: 10, currency: 'USD', interval: 'monthly', methodCode: 'mock' },
    });
    const row = table('subscriptions').find((s) => s.id === sub.id)!;
    row.next_billing_date = new Date(Date.now() - 1000).toISOString();
    // Simulate another run holding the claim
    row.locked_at = new Date().toISOString();

    const result = await processDueSubscriptions();
    expect(result.processed).toBe(0);
    expect(table('subscription_charges')).toHaveLength(0);
    expect(table('payments')).toHaveLength(0);
  });

  it('retries failed renewals then cancels when retries are exhausted', async () => {
    const sub = await createSubscription({
      merchantId: MERCHANT,
      input: { merchantReference: 'sub_4', amount: 10, currency: 'USD', interval: 'monthly', methodCode: 'mock', maxRetries: 2 },
    });
    const row = table('subscriptions').find((s) => s.id === sub.id)!;
    const mock = providerRegistry.get('mock') as MockProvider;
    const mandateRef = table('payment_mandates')[0].provider_reference;
    mock.simulateMandateOutcome(mandateRef, 'failed');

    // Attempt 1 — past_due, retry scheduled
    row.next_billing_date = new Date(Date.now() - 1000).toISOString();
    let result = await processDueSubscriptions();
    expect(result.failed).toBe(1);
    expect(row.status).toBe('past_due');
    expect(row.consecutive_failures).toBe(1);
    expect(row.next_billing_date).not.toBeNull(); // retry scheduled

    // Attempt 2 — retries exhausted → cancelled
    row.next_billing_date = new Date(Date.now() - 1000).toISOString();
    result = await processDueSubscriptions();
    expect(row.status).toBe('cancelled');
    expect(webhookEvents.some((e) => e.eventType === 'subscription.charge_failed')).toBe(true);
    expect(webhookEvents.some((e) => e.eventType === 'subscription.cancelled')).toBe(true);
  });

  it('upgrades/downgrades a plan — new terms from next billing date', async () => {
    const basic = await createPlan(MERCHANT, { name: 'Basic', amount: 10, currency: 'USD', interval: 'monthly' });
    const pro = await createPlan(MERCHANT, { name: 'Pro', amount: 30, currency: 'USD', interval: 'monthly' });
    const sub = await createSubscription({
      merchantId: MERCHANT,
      input: { merchantReference: 'sub_5', planId: basic.id, methodCode: 'mock' },
    });

    const upgraded = await updateSubscriptionPlan(sub.id, MERCHANT, { planId: pro.id });
    expect(upgraded.planId).toBe(pro.id);
    expect(upgraded.amount).toBe(30);
    expect(webhookEvents.some((e) => e.eventType === 'subscription.updated')).toBe(true);
  });

  it('pauses, resumes and cancels subscriptions', async () => {
    const sub = await createSubscription({
      merchantId: MERCHANT,
      input: { merchantReference: 'sub_6', amount: 10, currency: 'USD', interval: 'monthly', methodCode: 'mock' },
    });
    expect((await pauseSubscription(sub.id, MERCHANT)).status).toBe('paused');
    expect((await resumeSubscription(sub.id, MERCHANT)).status).toBe('active');
    expect((await cancelSubscription(sub.id, MERCHANT, 'customer request')).status).toBe('cancelled');
    expect(webhookEvents.some((e) => e.eventType === 'subscription.cancelled')).toBe(true);
  });

  it('cancelling revokes the provider mandate', async () => {
    const sub = await createSubscription({
      merchantId: MERCHANT,
      input: { merchantReference: 'sub_7', amount: 10, currency: 'USD', interval: 'monthly', methodCode: 'mock' },
    });
    await cancelSubscription(sub.id, MERCHANT);
    const mandate = table('payment_mandates')[0];
    expect(mandate.status).toBe('revoked');
    const fetched = await getSubscription(sub.id, MERCHANT);
    expect(fetched.status).toBe('cancelled');
  });
});
