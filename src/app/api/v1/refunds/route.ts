import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, isErrorResponse } from '@/lib/auth/middleware';
import { createRefund } from '@/lib/services/refund-service';
import { z } from 'zod';

// Validation schema for creating a refund
const createRefundSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  reason: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * POST /api/v1/refunds
 * Create a new refund
 */
export async function POST(request: NextRequest) {
  // Authenticate request
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { merchantId } = authResult;

  // Parse and validate request body
  const body = await request.json();
  const validationResult = createRefundSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: validationResult.error.issues },
      { status: 400 }
    );
  }

  const input = validationResult.data;

  try {
    const refund = await createRefund({
      merchantId,
      paymentId: input.paymentId,
      input: {
        amount: input.amount,
        currency: input.currency,
        reason: input.reason,
        metadata: input.metadata,
      },
    });

    return NextResponse.json(refund, { status: 201 });
  } catch (error) {
    console.error('Error creating refund:', error);
    return NextResponse.json(
      { error: 'Failed to create refund', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
