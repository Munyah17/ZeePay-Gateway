import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, isErrorResponse } from '@/lib/auth/middleware';
import { openDispute, listDisputes, DisputeStatus } from '@/lib/services/dispute-service';
import { z } from 'zod';

const openDisputeSchema = z.object({
  paymentId: z.string().uuid(),
  type: z.enum([
    'payment_not_received',
    'goods_not_delivered',
    'not_as_described',
    'unauthorized',
    'duplicate_charge',
    'other',
  ]),
  description: z.string().min(10).max(2000),
  openedBy: z.enum(['customer', 'merchant']).default('merchant'),
  customerEmail: z.string().email().optional(),
  evidence: z
    .array(
      z.object({
        submittedBy: z.enum(['customer', 'merchant', 'platform']),
        note: z.string().min(1),
        attachments: z.array(z.string()).optional(),
      })
    )
    .optional(),
});

/**
 * POST /api/v1/disputes
 * Open a dispute against a payment (merchant or on a customer's behalf).
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }
  const { merchantId } = authResult;

  const body = await request.json();
  const validationResult = openDisputeSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: validationResult.error.issues },
      { status: 400 }
    );
  }

  try {
    const dispute = await openDispute({ merchantId, input: validationResult.data });
    return NextResponse.json(dispute, { status: 201 });
  } catch (error) {
    console.error('Error opening dispute:', error);
    return NextResponse.json(
      { error: 'Failed to open dispute', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/disputes?status=open&limit=50&offset=0
 * List the merchant's disputes.
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }
  const { merchantId } = authResult;

  const searchParams = request.nextUrl.searchParams;
  const status = (searchParams.get('status') as DisputeStatus | null) || undefined;
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    const disputes = await listDisputes(merchantId, { status, limit, offset });
    return NextResponse.json({ disputes, count: disputes.length });
  } catch (error) {
    console.error('Error listing disputes:', error);
    return NextResponse.json(
      { error: 'Failed to list disputes', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
