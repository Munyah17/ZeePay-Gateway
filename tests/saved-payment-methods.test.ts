import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Supabase client + webhook delivery before importing services
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
  registerPaymentMethod,
  activateSavedPaymentMethod,
  listSavedPaymentMethods,
  getSavedPaymentMethod,
  updateSavedPaymentMethod,
  removeSavedPaymentMethod,
} from '@/lib/services/saved-payment-method-service';
import { chargeSavedPaymentMethod } from '@/lib/services/payment-service';

const MERCHANT = 'm1';

function seedMerchant() {
  table('merchants').push({ id: MERCHANT });
  table('payment_providers').push({ id: 'pp_mock', name: 'mock' });
}

beforeEach(() => {
  resetDb();
  seedMerchant();
});

describe('Payment tokenisation', () => {
  it('registers a payment method and stores only the token, never card details', async () => {
    const method = await registerPaymentMethod({
      merchantId: MERCHANT,
      input: {
        methodCode: 'mock',
        customerEmail: 'cust@example.com',
        customerReference: 'cust_1',
        setAsDefault: true,
      },
    });

    expect(method.status).toBe('active');
    expect(method.methodCode).toBe('mock');
    expect(method.cardLast4).toBe('4242');
    expect(method.isDefault).toBe(true);
    expect(method.customerId).toBeTruthy();

    const row = table('saved_payment_methods')[0];
    // PCI invariant: no PAN/CVV anywhere in the stored record
    const json = JSON.stringify(row);
    expect(json).not.toMatch(/\b4\d{15}\b/); // no 16-digit PAN
    expect(json).not.toContain('cvv');
    expect(row.provider_reference).toMatch(/^mandate_/);
  });

  it('creates the customer record idempotently by external reference', async () => {
    const a = await registerPaymentMethod({
      merchantId: MERCHANT,
      input: { methodCode: 'mock', customerReference: 'cust_1', customerEmail: 'a@x.com' },
    });
    const b = await registerPaymentMethod({
      merchantId: MERCHANT,
      input: { methodCode: 'mock', customerReference: 'cust_1', customerEmail: 'a@x.com' },
    });
    expect(a.customerId).toBe(b.customerId);
    expect(table('customers')).toHaveLength(1);
    // Second active method stays non-default
    expect(b.isDefault).toBe(false);
  });

  it('activates a pending method', async () => {
    const method = await registerPaymentMethod({
      merchantId: MERCHANT,
      input: { methodCode: 'mock', customerEmail: 'c@x.com' },
    });
    // Force pending then activate
    table('saved_payment_methods')[0].status = 'pending';
    const activated = await activateSavedPaymentMethod(method.id);
    expect(activated.status).toBe('active');
    expect(activated.activatedAt).toBeTruthy();
    expect(webhookEvents.some((e) => e.eventType === 'payment_method.activated')).toBe(true);
  });

  it('updates default correctly across multiple methods', async () => {
    const first = await registerPaymentMethod({
      merchantId: MERCHANT,
      input: { methodCode: 'mock', customerReference: 'c1' },
    });
    const second = await registerPaymentMethod({
      merchantId: MERCHANT,
      input: { methodCode: 'mock', customerReference: 'c1' },
    });

    expect(first.isDefault).toBe(true);

    const updated = await updateSavedPaymentMethod(second.id, MERCHANT, { setAsDefault: true });
    expect(updated.isDefault).toBe(true);
    const reloaded = await getSavedPaymentMethod(first.id, MERCHANT);
    expect(reloaded.isDefault).toBe(false);
  });

  it('lists methods scoped by customer', async () => {
    await registerPaymentMethod({ merchantId: MERCHANT, input: { methodCode: 'mock', customerReference: 'c1' } });
    await registerPaymentMethod({ merchantId: MERCHANT, input: { methodCode: 'mock', customerReference: 'c2' } });
    const all = await listSavedPaymentMethods(MERCHANT);
    expect(all).toHaveLength(2);
    const c1 = await listSavedPaymentMethods(MERCHANT, { customerId: table('customers')[0].id });
    expect(c1).toHaveLength(1);
  });

  it('removes a method and revokes the provider token', async () => {
    const method = await registerPaymentMethod({
      merchantId: MERCHANT,
      input: { methodCode: 'mock', customerEmail: 'd@x.com' },
    });
    const removed = await removeSavedPaymentMethod(method.id, MERCHANT);
    expect(removed.status).toBe('revoked');
    expect(removed.isDefault).toBe(false);
    const mandate = table('payment_mandates')[0];
    expect(mandate.status).toBe('revoked');
    expect(webhookEvents.some((e) => e.eventType === 'payment_method.removed')).toBe(true);
  });
});

describe('One-click payments', () => {
  async function savedMethod() {
    return registerPaymentMethod({
      merchantId: MERCHANT,
      input: { methodCode: 'mock', customerEmail: 'buyer@x.com', customerReference: 'buyer' },
    });
  }

  it('charges a tokenised method without re-entering card details', async () => {
    const method = await savedMethod();
    const payment = await chargeSavedPaymentMethod({
      merchantId: MERCHANT,
      input: {
        savedPaymentMethodId: method.id,
        amount: 25,
        currency: 'USD',
        reference: 'order_1',
      },
    });

    expect(payment.status).toBe('succeeded');
    expect(payment.requiresAction).toBe(false);
    expect(payment.savedPaymentMethodId).toBe(method.id);
    expect(table('payments')[0].saved_payment_method_id).toBe(method.id);
    expect(table('payment_attempts')).toHaveLength(1);
    expect(webhookEvents.some((e) => e.eventType === 'payment.succeeded')).toBe(true);
  });

  it('is idempotent — repeat calls return the same payment', async () => {
    const method = await savedMethod();
    const input = {
      savedPaymentMethodId: method.id,
      amount: 10,
      currency: 'USD',
      reference: 'order_2',
      idempotencyKey: 'idem_1',
    };
    const first = await chargeSavedPaymentMethod({ merchantId: MERCHANT, input });
    const second = await chargeSavedPaymentMethod({ merchantId: MERCHANT, input });
    expect(second.id).toBe(first.id);
    expect(table('payments')).toHaveLength(1);
    expect(table('payment_attempts')).toHaveLength(1); // charged once
  });

  it('rejects charging a revoked method', async () => {
    const method = await savedMethod();
    await removeSavedPaymentMethod(method.id, MERCHANT);
    await expect(
      chargeSavedPaymentMethod({
        merchantId: MERCHANT,
        input: { savedPaymentMethodId: method.id, amount: 5, currency: 'USD', reference: 'r' },
      })
    ).rejects.toThrow(/revoked/);
    expect(table('payments')).toHaveLength(0);
  });

  it('rejects charging another merchant\'s method', async () => {
    const method = await savedMethod();
    await expect(
      chargeSavedPaymentMethod({
        merchantId: 'other_merchant',
        input: { savedPaymentMethodId: method.id, amount: 5, currency: 'USD', reference: 'r' },
      })
    ).rejects.toThrow(/not found/i);
  });

  it('records a failed charge and emits payment.failed', async () => {
    const method = await savedMethod();
    // Force a declined token charge via per-charge simulation metadata
    try {
      await chargeSavedPaymentMethod({
        merchantId: MERCHANT,
        input: {
          savedPaymentMethodId: method.id,
          amount: 5,
          currency: 'USD',
          reference: 'fail_1',
          metadata: { simulateOutcome: 'failed' },
        },
      });
    } catch {
      // acceptable — provider threw; payment still recorded failed
    }

    const payment = table('payments')[0];
    expect(payment.status).toBe('failed');
    expect(webhookEvents.some((e) => e.eventType === 'payment.failed')).toBe(true);
  });
});
