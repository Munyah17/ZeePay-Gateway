import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/database/client';
import { providerRegistry } from '@/lib/providers/registry';
import { initializeProviderForMerchant } from '@/lib/services/provider-credentials';
import { deliverWebhookToMerchant } from '@/lib/webhooks/delivery';

/**
 * GET /api/v1/checkout/:id/verify
 *
 * Shopper result URL for hosted COPYandPAY-style checkouts. The gateway
 * redirects the shopper's browser here (with `id`/`resourcePath` query
 * params) after the hosted widget flow completes.
 *
 * Per the gateway contract: the redirect itself is NOT proof of payment.
 * We must call the provider's status endpoint server-side, confirm the
 * result code, cross-check amount + currency against the original
 * checkout, and only then mark the payment fulfilled.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: paymentId } = await params;
  const origin = request.nextUrl.origin;

  const back = (message: string) =>
    NextResponse.redirect(
      new URL(`/checkout/${paymentId}?error=${encodeURIComponent(message)}`, origin),
      303
    );

  try {
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (!payment) return back('Payment not found');
    if (payment.status === 'succeeded') {
      return NextResponse.redirect(new URL(`/checkout/${paymentId}/success`, origin), 303);
    }

    // Latest attempt carries the provider name + checkout reference
    const { data: attempt } = await supabaseAdmin
      .from('payment_attempts')
      .select('*, payment_providers(name)')
      .eq('payment_id', paymentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // The checkout ID to verify: gateway-supplied id/resourcePath param
    // first, then the stored attempt reference.
    const resourcePath = request.nextUrl.searchParams.get('resourcePath');
    const providerRef =
      request.nextUrl.searchParams.get('id') ||
      resourcePath?.match(/checkouts\/([^/]+)\//)?.[1] ||
      attempt?.provider_reference;

    if (!providerRef) return back('No checkout to verify');

    // Resolve provider: attempt join → saved method → fallback
    let providerName = attempt?.payment_providers?.name;
    if (!providerName && payment.saved_payment_method_id) {
      const { data: method } = await supabaseAdmin
        .from('saved_payment_methods')
        .select('provider_name')
        .eq('id', payment.saved_payment_method_id)
        .single();
      providerName = method?.provider_name;
    }
    providerName = providerName || 'mock';

    const provider = providerRegistry.get(providerName);
    if (!provider?.getPayment) return back('Payment verification unavailable');

    await initializeProviderForMerchant(provider, payment.merchant_id);
    // Query the gateway-supplied resourcePath verbatim when present —
    // pay-by-link uses a different path shape than regular checkouts.
    const result = await provider.getPayment({
      providerReference: providerRef,
      resourcePath: resourcePath || undefined,
    });

    // Cross-check amount, currency and merchant transaction ID against
    // the original checkout — never fulfil on a mismatched response.
    const amountOk =
      !result.amount || Math.abs(result.amount - Number(payment.amount)) < 0.005;
    const currencyOk = !result.currency || result.currency === payment.currency;
    const providerTxnId = result.providerResponse?.merchantTransactionId;
    const txnOk = !providerTxnId || providerTxnId === payment.merchant_reference;
    if (!amountOk || !currencyOk || !txnOk) {
      await supabaseAdmin
        .from('payments')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', paymentId);
      return back('Amount, currency or transaction reference mismatch — payment not fulfilled');
    }

    const succeeded = result.status === 'succeeded';
    const now = new Date().toISOString();

    await supabaseAdmin
      .from('payments')
      .update({
        status: result.status,
        completed_at: succeeded ? now : null,
        updated_at: now,
      })
      .eq('id', paymentId);

    if (attempt?.id) {
      await supabaseAdmin
        .from('payment_attempts')
        .update({
          status: result.status,
          provider_response: result.providerResponse || {},
          completed_at: succeeded ? now : null,
        })
        .eq('id', attempt.id);
    }

    await deliverWebhookToMerchant(
      payment.merchant_id,
      succeeded ? 'payment.succeeded' : 'payment.failed',
      {
        id: paymentId,
        reference: payment.merchant_reference,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: result.status,
      }
    );

    if (succeeded) {
      return NextResponse.redirect(new URL(`/checkout/${paymentId}/success`, origin), 303);
    }

    const desc =
      result.metadata?.resultDescription ||
      (result.status === 'processing' ? 'Payment is still processing — try again shortly' : 'Payment was declined');
    return back(desc);
  } catch (error) {
    return back(error instanceof Error ? error.message : 'Verification failed');
  }
}
