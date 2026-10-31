import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, isErrorResponse } from '@/lib/auth/middleware';
import { createSubscription, listSubscriptions } from '@/lib/services/subscription-service';
import { z } from 'zod';

// Validation schema for creating a subscription
const createSubscriptionSchema = z.object({
  merchantReference: z.string().min(1).max(255),
  description: z.string().max(500).optional(),
  // Optional when planId is supplied — resolved from the plan
  amount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  interval: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  intervalCount: z.number().int().positive().optional(),
  planId: z.string().uuid().optional(),
  // Bill against an already-tokenised saved payment method — skips the
  // mandate approval step entirely (one authorisation covers all debits)
  savedPaymentMethodId: z.string().uuid().optional(),
  methodCode: z.string().min(1).optional(),
  customerId: z.string().uuid().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  returnUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  maxRetries: z.number().int().min(0).max(10).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  idempotencyKey: z.string().optional(),
});

/**
 * POST /api/v1/subscriptions
 * Create a subscription with auto-deduct.
 * For mobile money methods (ecocash, innbucks, omari) the customer
 * approves the mandate once; afterwards ZeePay debits automatically
 * on each billing date. For cards the mandate is tokenized.
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { merchantId } = authResult;

  const body = await request.json();
  const validationResult = createSubscriptionSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: validationResult.error.issues },
      { status: 400 }
    );
  }

  try {
    const subscription = await createSubscription({
      merchantId,
      input: validationResult.data,
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/subscriptions
 * List subscriptions for a merchant
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
  const status = searchParams.get('status') || undefined;

  try {
    const subscriptions = await listSubscriptions(merchantId, { limit, offset, status });

    return NextResponse.json({
      data: subscriptions,
      pagination: {
        limit,
        offset,
        count: subscriptions.length,
      },
    });
  } catch (error) {
    console.error('Error listing subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to list subscriptions', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
