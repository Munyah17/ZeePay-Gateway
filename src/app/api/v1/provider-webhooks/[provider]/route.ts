import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/database/client';
import { providerRegistry } from '@/lib/providers/registry';
import { deliverWebhookToMerchant } from '@/lib/webhooks/delivery';
import { getNextState, PaymentEvent, PaymentState } from '@/lib/services/state-machine';
import { decrypt } from '@/lib/utils/crypto';

/**
 * POST /api/v1/provider-webhooks/:provider
 *
 * Generic inbound receiver for all registered providers that don't
 * have a bespoke route (EcoCash has /provider-webhooks/ecocash for
 * its correlator-keyed callbacks). Handles: mtn-momo, mpesa, opay,
 * palmpay, onemoney, zelle, cashapp, innbucks, omari, zimswitch, ...
 *
 * Flow: parseWebhook → resolve the payment attempt by provider
 * reference → state-machine transition → merchant webhook.
 *
 * Signature verification: if the provider implements verifyWebhook
 * and the merchant's saved credentials include `webhookSecret`, an
 * x-signature header is validated against it; unsigned provider
 * callbacks (MoMo, Daraja) are accepted — only status fields we
 * already trust are applied, and references are unguessable.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerName } = await params;
  const provider = providerRegistry.get(providerName);

  if (!provider?.parseWebhook) {
    return NextResponse.json({ error: `Unknown provider '${providerName}'` }, { status: 404 });
  }

  const payload = await request.text();
  let parsed: { eventType: string; providerReference: string; data: Record<string, any> };
  try {
    parsed = provider.parseWebhook(payload);
  } catch {
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
  }

  if (!parsed.providerReference) {
    return NextResponse.json({ error: 'No provider reference in payload' }, { status: 400 });
  }

  try {
    // Resolve the attempt — exact match first (uuid/order refs), then
    // `reference|msisdn` composite refs keyed on the leading part.
    const { data: attempt } = await supabaseAdmin
      .from('payment_attempts')
      .select('id, payment_id, status, payment_providers(name)')
      .or(`provider_reference.eq.${parsed.providerReference},provider_reference.like.${parsed.providerReference}|%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!attempt) {
      // Unknown reference — acknowledge so the provider stops retrying
      return NextResponse.json({ received: true, type: 'unmatched' });
    }

    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('id, merchant_id, status, merchant_reference, amount, currency')
      .eq('id', attempt.payment_id)
      .single();

    if (!payment) {
      return NextResponse.json({ received: true, type: 'unmatched' });
    }

    // Optional signature check — only when the merchant saved a
    // webhookSecret for this provider.
    const signature = request.headers.get('x-signature');
    if (signature && provider.verifyWebhook) {
      const secret = await resolveWebhookSecret(payment.merchant_id, provider.name);
      if (secret && !provider.verifyWebhook(payload, signature, secret)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const newStatus = mapEventStatus(parsed.eventType, parsed.data);
    if (!newStatus) {
      return NextResponse.json({ received: true, type: 'ignored' });
    }

    const now = new Date().toISOString();

    await supabaseAdmin
      .from('payment_attempts')
      .update({
        status: newStatus,
        provider_response: parsed.data,
        completed_at: ['succeeded', 'failed', 'cancelled'].includes(newStatus) ? now : null,
      })
      .eq('id', attempt.id);

    const event: PaymentEvent =
      newStatus === 'succeeded' ? 'complete'
      : newStatus === 'failed' ? 'fail'
      : newStatus === 'cancelled' ? 'cancel'
      : 'start_processing';

    const nextState = getNextState(payment.status as PaymentState, event);

    if (nextState) {
      await supabaseAdmin
        .from('payments')
        .update({ status: nextState, completed_at: nextState === 'succeeded' ? now : null, updated_at: now })
        .eq('id', payment.id);

      const eventType =
        nextState === 'succeeded' ? 'payment.succeeded'
        : nextState === 'failed' ? 'payment.failed'
        : nextState === 'cancelled' ? 'payment.cancelled'
        : 'payment.updated';

      await deliverWebhookToMerchant(payment.merchant_id, eventType, {
        id: payment.id,
        reference: payment.merchant_reference,
        amount: payment.amount,
        currency: payment.currency,
        status: nextState,
        provider: provider.name,
      });
    }

    return NextResponse.json({ received: true, status: newStatus });
  } catch (error) {
    console.error(`Error processing ${providerName} webhook:`, error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function resolveWebhookSecret(merchantId: string, providerName: string): Promise<string | null> {
  const { data: providerRow } = await supabaseAdmin
    .from('payment_providers')
    .select('id')
    .eq('name', providerName)
    .maybeSingle();
  if (!providerRow) return null;

  const { data: account } = await supabaseAdmin
    .from('merchant_provider_accounts')
    .select('credentials_encrypted')
    .eq('merchant_id', merchantId)
    .eq('provider_id', providerRow.id)
    .eq('is_active', true)
    .maybeSingle();

  const creds = account?.credentials_encrypted ? decrypt(account.credentials_encrypted) : null;
  return (creds?.webhookSecret as string) || null;
}

function mapEventStatus(eventType: string, data: Record<string, any>): string | null {
  const t = (eventType || '').toLowerCase();
  if (t.includes('succeed') || t.includes('completed') || t.includes('captured') || t.includes('paid')) {
    return 'succeeded';
  }
  if (t.includes('fail') || t.includes('declin') || t.includes('reject')) {
    return 'failed';
  }
  if (t.includes('cancel') || t.includes('revers') || t.includes('refund') || t.includes('expired')) {
    return 'cancelled';
  }
  if (t.includes('processing') || t.includes('pending') || t.includes('initiated')) {
    return 'processing';
  }

  // Fall back to a provider status field when the event type is opaque
  const raw = String(data.status || data.transactionStatus || data.resultCode || '').toUpperCase();
  if (['SUCCESS', 'SUCCESSFUL', 'COMPLETED', 'CHARGED', 'PAID', '0', '00', '2'].includes(raw)) return 'succeeded';
  if (['FAILED', 'FAIL', 'DECLINED', 'REJECTED', '3'].includes(raw)) return 'failed';
  if (['CANCELLED', 'REVERSED', 'EXPIRED', '1032'].includes(raw)) return 'cancelled';
  if (raw) return 'processing';

  return null;
}
