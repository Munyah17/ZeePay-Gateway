import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/database/client';
import { chargeSavedPaymentMethod } from '@/lib/services/payment-service';
import { providerRegistry } from '@/lib/providers/registry';
import { initializeProviderForMerchant } from '@/lib/services/provider-credentials';
import { z } from 'zod';

const paySchema = z
  .object({
    savedPaymentMethodId: z.string().uuid().optional(),
    // Pay with a payment method offered on the hosted checkout —
    // e.g. EcoCash PIN-prompt debit, OPay cashier redirect.
    // Accepts a payment_methods UUID or a provider/method code
    // ('ecocash', 'mtn-momo', ...) when the methods table is unseeded.
    paymentMethodId: z.string().min(1).optional(),
    customerPhone: z.string().optional(),
    customerEmail: z.string().email().optional(),
  })
  .refine((v) => v.savedPaymentMethodId || v.paymentMethodId, {
    message: 'savedPaymentMethodId or paymentMethodId is required',
  });

/**
 * POST /api/v1/checkout/:id/pay
 *
 * Two modes:
 *  - savedPaymentMethodId: one-click charge of a tokenised method.
 *  - paymentMethodId: initiate a payment through the method's provider
 *    (mobile money debit, hosted wallet redirect, ...). Providers
 *    without saved credentials run in simulation mode until keys are
 *    pasted on the dashboard — plug and play.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: paymentId } = await params;

  const body = await request.json();
  const validationResult = paySchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: validationResult.error.issues },
      { status: 400 }
    );
  }

  try {
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('id, merchant_id, merchant_reference, amount, currency, status, customer_email, customer_phone')
      .eq('id', paymentId)
      .single();

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    if (['succeeded', 'cancelled'].includes(payment.status)) {
      return NextResponse.json(
        { error: `Payment is already ${payment.status}` },
        { status: 409 }
      );
    }

    const { savedPaymentMethodId, paymentMethodId, customerPhone, customerEmail } =
      validationResult.data;

    // ------------------------------------------------------------
    // One-click — charge a tokenised saved payment method
    // ------------------------------------------------------------
    if (savedPaymentMethodId) {
      // The saved method must belong to this checkout's customer —
      // prevents charging another customer's card from a guessable URL.
      const { data: method } = await supabaseAdmin
        .from('saved_payment_methods')
        .select('id, merchant_id, customer_email, status')
        .eq('id', savedPaymentMethodId)
        .eq('merchant_id', payment.merchant_id)
        .single();

      if (!method) {
        return NextResponse.json({ error: 'Saved payment method not found' }, { status: 404 });
      }
      if (payment.customer_email && method.customer_email !== payment.customer_email) {
        return NextResponse.json(
          { error: 'Payment method does not belong to this customer' },
          { status: 403 }
        );
      }

      const result = await chargeSavedPaymentMethod({
        merchantId: payment.merchant_id,
        input: {
          savedPaymentMethodId,
          amount: Number(payment.amount),
          currency: payment.currency,
          reference: payment.merchant_reference,
        },
      });

      return NextResponse.json(result, { status: result.status === 'failed' ? 402 : 200 });
    }

    // ------------------------------------------------------------
    // Payment method — initiate through the method's provider
    // ------------------------------------------------------------
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        paymentMethodId!
      );

    const { data: methodRow } = await supabaseAdmin
      .from('payment_methods')
      .select('id, method_code, provider_id, payment_providers(name, provider_type)')
      .eq(isUuid ? 'id' : 'method_code', paymentMethodId)
      .maybeSingle();

    const providerName =
      (methodRow?.payment_providers as any)?.name ||
      methodRow?.method_code ||
      paymentMethodId; // registry fallback when the table is unseeded

    const provider = providerRegistry.get(providerName);
    if (!provider) {
      return NextResponse.json(
        { error: `Provider '${providerName}' is not available` },
        { status: 503 }
      );
    }

    // Resolve the provider row for the attempt record
    let providerRowId = methodRow?.provider_id as string | undefined;
    if (!providerRowId) {
      const { data: row } = await supabaseAdmin
        .from('payment_providers')
        .select('id')
        .eq('name', provider.name)
        .maybeSingle();
      providerRowId = row?.id;
    }

    await initializeProviderForMerchant(provider, payment.merchant_id);

    const phone = customerPhone || payment.customer_phone;
    const result = await provider.createPayment({
      amount: Number(payment.amount),
      currency: payment.currency,
      reference: payment.merchant_reference,
      customerPhone: phone,
      customerEmail: customerEmail || payment.customer_email,
      returnUrl: `${request.nextUrl.origin}/checkout/${paymentId}/success`,
      metadata: { checkoutPaymentId: paymentId, methodCode: methodRow?.method_code || paymentMethodId },
    });

    // Record the attempt and move the payment forward (skipped when
    // the provider isn't seeded in the database yet)
    if (providerRowId) {
      await supabaseAdmin.from('payment_attempts').insert({
        payment_id: paymentId,
        provider_id: providerRowId,
        payment_method_id: isUuid ? paymentMethodId : methodRow?.id || null,
        provider_reference: result.providerReference,
        status: result.status,
        provider_response: result.providerResponse,
      });
    }

    const now = new Date().toISOString();
    await supabaseAdmin
      .from('payments')
      .update({
        status: result.status,
        ...(phone ? { customer_phone: phone } : {}),
        completed_at: result.status === 'succeeded' ? now : null,
        updated_at: now,
      })
      .eq('id', paymentId);

    return NextResponse.json(
      {
        id: paymentId,
        status: result.status,
        provider: providerName,
        providerReference: result.providerReference,
        checkoutUrl: result.checkoutUrl,
        redirect: result.redirect,
        simulated: Boolean(result.providerResponse?.simulated),
        instructions:
          result.providerResponse?.instructions ||
          (result.status === 'processing'
            ? `Approve the ${providerName} prompt on your device`
            : undefined),
      },
      { status: result.status === 'failed' ? 402 : 200 }
    );
  } catch (error) {
    console.error('Error processing checkout payment:', error);
    return NextResponse.json(
      { error: 'Payment failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
