import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, isErrorResponse } from '@/lib/auth/middleware';
import {
  registerPaymentMethod,
  registerPaymentMethodFromPayment,
  listSavedPaymentMethods,
} from '@/lib/services/saved-payment-method-service';
import { z } from 'zod';

const registerSchema = z.object({
  methodCode: z.string().min(1).default('zimswitch'),
  type: z.enum(['card', 'wallet', 'mobile_money']).optional(),
  customerId: z.string().uuid().optional(),
  customerReference: z.string().min(1).max(255).optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().max(50).optional(),
  customerName: z.string().max(255).optional(),
  amount: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  reference: z.string().min(1).max(255).optional(),
  returnUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  label: z.string().max(100).optional(),
  setAsDefault: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  idempotencyKey: z.string().optional(),
  // Claim the token created during an earlier card payment
  paymentId: z.string().uuid().optional(),
});

/**
 * POST /api/v1/saved-payment-methods
 * Tokenise a payment method.
 *
 * Card flow (ZimSwitch-first): returns `approvalUrl` — the customer
 * enters card details on the hosted tokenisation widget once; ZeePay
 * stores only the resulting registration token. Call
 * POST /saved-payment-methods/:id/activate after the customer returns.
 *
 * Claim flow: pass `paymentId` of a payment run with card registration
 * enabled to save the token issued during that authorisation.
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { merchantId } = authResult;

  const body = await request.json();
  const validationResult = registerSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: validationResult.error.issues },
      { status: 400 }
    );
  }

  const input = validationResult.data;

  try {
    const method = input.paymentId
      ? await registerPaymentMethodFromPayment({ merchantId, paymentId: input.paymentId, input })
      : await registerPaymentMethod({ merchantId, input });

    return NextResponse.json(method, { status: 201 });
  } catch (error) {
    console.error('Error registering payment method:', error);
    return NextResponse.json(
      { error: 'Failed to register payment method', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/saved-payment-methods
 * List a merchant's saved payment methods (optionally per customer).
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { merchantId } = authResult;
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    const methods = await listSavedPaymentMethods(merchantId, {
      customerId: searchParams.get('customerId') || undefined,
      customerEmail: searchParams.get('customerEmail') || undefined,
      status: searchParams.get('status') || undefined,
      limit,
      offset,
    });

    return NextResponse.json({
      data: methods,
      pagination: { limit, offset, count: methods.length },
    });
  } catch (error) {
    console.error('Error listing saved payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to list saved payment methods', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
