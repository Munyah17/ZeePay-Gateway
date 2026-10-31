import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/database/client';

/**
 * GET /api/v1/checkout/:id
 * Public checkout context — returns the payment plus the customer's
 * saved payment methods so returning customers can pay in one click.
 * Saved methods are only exposed for the customer email on the payment.
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

    return NextResponse.json({
      id: payment.id,
      reference: payment.merchant_reference,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
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
