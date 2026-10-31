import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/database/client';
import { providerRegistry } from '@/lib/providers/registry';
import { initializeProviderForMerchant } from '@/lib/services/provider-credentials';

/**
 * GET /api/v1/checkout/:id
 * Public checkout context — returns the payment, the public payment
 * method catalogue, and the customer's saved payment methods so
 * returning customers can pay in one click.
 *
 * While a payment is in-flight (pending/processing) the endpoint also
 * polls the provider's status endpoint once per request so the hosted
 * checkout page can resolve PIN-prompt / redirect completions without
 * waiting for a webhook.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: paymentId } = await params;

  try {
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select('id, merchant_id, merchant_reference, amount, currency, status, customer_email, checkout_url')
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Fetch saved methods for the payment's customer so the checkout can
    // offer one-click payment — never expose methods for other customers.
    let savedMethods: any[] = [];
    if (payment.customer_email) {
      const { data } = await supabaseAdmin
        .from('saved_payment_methods')
        .select('id, type, card_brand, card_last4, card_exp_month, card_exp_year, card_holder, label, is_default, status')
        .eq('merchant_id', payment.merchant_id)
        .eq('customer_email', payment.customer_email)
        .eq('status', 'active')
        .order('is_default', { ascending: false });
      savedMethods = (data || []).map((m: any) => ({
        id: m.id,
        type: m.type,
        cardBrand: m.card_brand,
        cardLast4: m.card_last4,
        cardExpMonth: m.card_exp_month,
        cardExpYear: m.card_exp_year,
        cardHolder: m.card_holder,
        label: m.label,
        isDefault: m.is_default,
      }));
    }

    // Public method catalogue — method names/types only, no secrets.
    const { data: methodRows } = await supabaseAdmin
      .from('payment_methods')
      .select('id, method_code, display_name, supported_currencies, payment_providers(name, provider_type)')
      .eq('is_active', true)
      .order('display_name');

    // Registry fallback when the methods table isn't seeded yet —
    // the catalogue is still plug-and-play.
    const paymentMethods =
      methodRows && methodRows.length > 0
        ? methodRows.map((m: any) => ({
            id: m.id,
            code: m.method_code,
            name: m.display_name,
            provider: m.payment_providers?.name,
            type: m.payment_providers?.provider_type,
            supportedCurrencies: m.supported_currencies,
          }))
        : providerRegistry
            .getAll()
            .filter((p) => p.name !== 'mock')
            .map((p) => ({
              id: p.name,
              code: p.name,
              name: p.name
                .split('-')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' '),
              provider: p.name,
              type: p.type,
              supportedCurrencies: ['USD'],
            }));

    // ------------------------------------------------------------------
    // Refresh in-flight payments — poll the provider once per request so
    // PIN-prompt / redirect completions resolve while the shopper waits.
    // ------------------------------------------------------------------
    let status = payment.status;
    if (['pending', 'processing'].includes(status)) {
      const { data: attempt } = await supabaseAdmin
        .from('payment_attempts')
        .select('id, provider_reference, status, created_at, payment_providers(name)')
        .eq('payment_id', paymentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const attemptAge = attempt ? Date.now() - new Date(attempt.created_at).getTime() : 0;
      const providerName = (attempt?.payment_providers as any)?.name;
      const provider = providerName ? providerRegistry.get(providerName) : undefined;

      // Re-query at most every ~1.5s per attempt and only once the
      // provider has had a moment to process the initiation call.
      if (attempt?.provider_reference && provider?.getPayment && attemptAge > 1500) {
        try {
          await initializeProviderForMerchant(provider, payment.merchant_id);
          const result = await provider.getPayment({
            providerReference: attempt.provider_reference,
          });

          if (result.status !== status && result.status !== 'pending') {
            const now = new Date().toISOString();
            status = result.status;

            await supabaseAdmin
              .from('payments')
              .update({
                status,
                completed_at: status === 'succeeded' ? now : null,
                updated_at: now,
              })
              .eq('id', paymentId);

            await supabaseAdmin
              .from('payment_attempts')
              .update({
                status,
                provider_response: result.providerResponse || {},
                completed_at: ['succeeded', 'failed', 'cancelled'].includes(status) ? now : null,
              })
              .eq('id', attempt.id);
          }
        } catch {
          // Provider unreachable / reference not yet registered —
          // surface the stored status; the next poll retries.
        }
      }
    }

    return NextResponse.json({
      id: payment.id,
      reference: payment.merchant_reference,
      amount: payment.amount,
      currency: payment.currency,
      status,
      checkoutUrl: payment.checkout_url,
      paymentMethods,
      savedPaymentMethods: savedMethods,
    });
  } catch (error) {
    console.error('Error loading checkout context:', error);
    return NextResponse.json(
      { error: 'Failed to load checkout', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
