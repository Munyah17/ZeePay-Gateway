import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, isErrorResponse } from '@/lib/auth/middleware';
import { createPayout, listPayouts } from '@/lib/services/payout-service';
import { z } from 'zod';

const createPayoutSchema = z.object({
  serviceType: z.enum(['enterprise_cash_in', 'change_disbursement', 'merchant_to_subscriber']),
  amount: z.number().positive(),
  currency: z.string().length(3),
  recipientMsisdn: z.string().min(9),
  externalReference: z.string().min(1).max(255).optional(),
  beneficiaryReference: z.string().max(255).optional(),
  transferReference: z.string().max(255).optional(),
  terminalId: z.string().max(100).optional(),
  merchantName: z.string().max(255).optional(),
  walletId: z.string().max(10).optional(),
  providerName: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  idempotencyKey: z.string().optional(),
});

/**
 * POST /api/v1/payouts
 * Disburse funds into a customer's wallet.
 *
 * serviceType selects the disbursement service:
 *   enterprise_cash_in      — bulk disbursement (payroll, growers, grants)
 *   change_disbursement     — POS change paid into the wallet
 *   merchant_to_subscriber  — single merchant payout to a subscriber
 *
 * externalReference is the idempotency key — resending the same
 * reference returns the original transaction, never a duplicate.
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { merchantId, environment } = authResult;
  const body = await request.json();
  const validationResult = createPayoutSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: validationResult.error.issues },
      { status: 400 }
    );
  }

  const { providerName, idempotencyKey, ...input } = validationResult.data;

  try {
    const payout = await createPayout({
      merchantId,
      providerName,
      environment: environment as 'test' | 'live',
      input,
      idempotencyKey,
    });

    return NextResponse.json(payout, { status: 201 });
  } catch (error) {
    console.error('Error creating payout:', error);
    return NextResponse.json(
      { error: 'Failed to create payout', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/payouts
 * List payouts for a merchant
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
  const serviceType = searchParams.get('serviceType') || undefined;

  try {
    const payouts = await listPayouts(merchantId, { limit, offset, status, serviceType });

    return NextResponse.json({
      data: payouts,
      pagination: {
        limit,
        offset,
        count: payouts.length,
      },
    });
  } catch (error) {
    console.error('Error listing payouts:', error);
    return NextResponse.json(
      { error: 'Failed to list payouts', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
