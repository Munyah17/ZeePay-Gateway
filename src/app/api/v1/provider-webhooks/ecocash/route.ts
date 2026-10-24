import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/database/client';
import { deliverWebhookToMerchant } from '@/lib/webhooks/delivery';
import { getNextState, PaymentEvent, PaymentState } from '@/lib/services/state-machine';

/**
 * POST /api/v1/provider-webhooks/ecocash
 * Receives EcoCash Instant Payment notifyUrl callbacks — wallet state
 * lifecycle events posted after the customer resolves the PIN prompt
 * (or after a refund completes). Resolves the correlator back to the
 * ZeePay payment/refund, updates its status, and emits merchant webhooks.
 *
 * Note: EcoCash does not sign these callbacks. The provider reference is
 * unguessable (timestamp + random correlator), and only fields we already
 * trust are echoed back — this route only transitions statuses.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const correlator = body.clientCorrelator || body.correlator;
  const operationStatus = body.transactionOperationStatus;
  const responseCode = body.responseCode;

  if (!correlator) {
    return NextResponse.json({ error: 'Missing clientCorrelator' }, { status: 400 });
  }

  const newStatus = mapCallbackStatus(operationStatus, responseCode);
  const now = new Date().toISOString();

  // Find the payment attempt holding this correlator
  const { data: attempt } = await supabaseAdmin
    .from('payment_attempts')
    .select('id, payment_id, status')
    .like('provider_reference', `${correlator}|%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (attempt) {
    await supabaseAdmin
      .from('payment_attempts')
      .update({
        status: newStatus,
        provider_response: body,
        completed_at: ['succeeded', 'failed', 'cancelled'].includes(newStatus) ? now : null,
      })
      .eq('id', attempt.id);

    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('id, merchant_id, status, merchant_reference, amount, currency')
      .eq('id', attempt.payment_id)
      .single();

    const event: PaymentEvent =
      newStatus === 'succeeded' ? 'complete'
      : newStatus === 'failed' ? 'fail'
      : newStatus === 'cancelled' ? 'cancel'
      : 'start_processing';

    const nextState = payment
      ? getNextState(payment.status as PaymentState, event)
      : null;

    if (payment && nextState) {
      await supabaseAdmin
        .from('payments')
        .update({ status: nextState, completed_at: nextState === 'succeeded' ? now : null })
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
        ecocashReference: body.ecocashReference,
      });
    }

    return NextResponse.json({ received: true, type: 'payment', status: newStatus });
  }

  // Otherwise try refunds (refund requests get their own correlator)
  const { data: refund } = await supabaseAdmin
    .from('refunds')
    .select('id, payment_id, status, amount, currency')
    .eq('provider_reference', correlator)
    .maybeSingle();

  if (refund) {
    const refundStatus =
      operationStatus === 'Refunded' || responseCode === '00' ? 'succeeded' : 'failed';

    await supabaseAdmin
      .from('refunds')
      .update({ status: refundStatus, completed_at: now, provider_response: body })
      .eq('id', refund.id);

    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('merchant_id, merchant_reference')
      .eq('id', refund.payment_id)
      .single();

    if (payment) {
      await deliverWebhookToMerchant(payment.merchant_id, 'refund.succeeded', {
        refundId: refund.id,
        paymentId: refund.payment_id,
        amount: refund.amount,
        currency: refund.currency,
        ecocashReference: body.ecocashReference,
      });
    }

    return NextResponse.json({ received: true, type: 'refund', status: refundStatus });
  }

  // Unknown correlator — acknowledge so EcoCash stops retrying
  return NextResponse.json({ received: true, type: 'unmatched' });
}

function mapCallbackStatus(operationStatus: string, responseCode: string): string {
  if (responseCode === '00') {
    switch ((operationStatus || '').toLowerCase()) {
      case 'charged':
        return 'succeeded';
      case 'refunded':
      case 'reversed':
        return 'cancelled';
      default:
        return 'processing';
    }
  }
  return responseCode ? 'failed' : 'processing';
}
