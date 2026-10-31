import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/database/client';
import { chargeSavedPaymentMethod } from '@/lib/services/payment-service';
import { z } from 'zod';

const paySchema = z.object({
  savedPaymentMethodId: z.string().uuid(),
});

/**
 * POST /api/v1/checkout/:id/pay
 * Public one-click payment — charge a previously tokenised saved
 * payment method for this checkout's amount. The method must belong
 * to the same merchant and the same customer email on the payment.
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
      .select('id, merchant_id, merchant_reference, amount, currency, status, customer_email')
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

    // The saved method must belong to this checkout's customer —
    // prevents charging another customer's card from a guessable URL.
    const { savedPaymentMethodId } = validationResult.data;
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
  } catch (error) {
    console.error('Error processing one-click payment:', error);
    return NextResponse.json(
      { error: 'Payment failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
