import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, isErrorResponse } from '@/lib/auth/middleware';
import { createPayment, chargeSavedPaymentMethod, listPayments } from '@/lib/services/payment-service';
import { z } from 'zod';

// Validation schema for creating a payment
const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  reference: z.string().min(1).max(255),
  returnUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  // Merchant's own customer id — get-or-creates a customer record and
  // associates the payment with it
  customerReference: z.string().min(1).max(255).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  idempotencyKey: z.string().optional(),
  paymentMethodId: z.string().uuid().optional(),
  // One-click: charge a previously tokenised payment method directly —
  // no checkout redirect, customer authorises with a single click
  savedPaymentMethodId: z.string().uuid().optional(),
  // Request card tokenisation during this payment (createRegistration)
  saveCardForReuse: z.boolean().optional(),
});

/**
 * POST /api/v1/payments
 * Create a new payment
 */
export async function POST(request: NextRequest) {
  // Authenticate request
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { merchantId, environment } = authResult;

  // Parse and validate request body
  const body = await request.json();
  const validationResult = createPaymentSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: validationResult.error.issues },
      { status: 400 }
    );
  }

  const input = validationResult.data;

  try {
    // One-click payment — charge a tokenised saved method directly
    if (input.savedPaymentMethodId) {
      const payment = await chargeSavedPaymentMethod({
        merchantId,
        input: {
          savedPaymentMethodId: input.savedPaymentMethodId,
          amount: input.amount,
          currency: input.currency,
          reference: input.reference,
          returnUrl: input.returnUrl,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          metadata: input.metadata,
          idempotencyKey: input.idempotencyKey,
        },
      });
      return NextResponse.json(payment, { status: 201 });
    }

    const payment = await createPayment({
      merchantId,
      input: {
        amount: input.amount,
        currency: input.currency,
        reference: input.reference,
        returnUrl: input.returnUrl,
        cancelUrl: input.cancelUrl,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        metadata: {
          ...input.metadata,
          // Card tokenisation during checkout (ZimSwitch: createRegistration)
          ...(input.saveCardForReuse ? { createRegistration: true } : {}),
          ...(input.customerReference ? { customerReference: input.customerReference } : {}),
        },
      },
      idempotencyKey: input.idempotencyKey,
      paymentMethodId: input.paymentMethodId,
      environment,
      customerReference: input.customerReference,
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/payments
 * List payments for a merchant
 */
export async function GET(request: NextRequest) {
  // Authenticate request
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { merchantId } = authResult;

  // Parse query parameters
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const status = searchParams.get('status') || undefined;

  try {
    const payments = await listPayments(merchantId, { limit, offset, status });

    return NextResponse.json({
      data: payments,
      pagination: {
        limit,
        offset,
        count: payments.length,
      },
    });
  } catch (error) {
    console.error('Error listing payments:', error);
    return NextResponse.json(
      { error: 'Failed to list payments', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
