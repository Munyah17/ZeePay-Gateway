import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, isErrorResponse } from '@/lib/auth/middleware';
import { getRefund } from '@/lib/services/refund-service';

/**
 * GET /api/v1/refunds/:id
 * Get a refund by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authenticate request
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { merchantId } = authResult;
  const { id: refundId } = await params;

  try {
    const refund = await getRefund(refundId, merchantId);

    if (!refund) {
      return NextResponse.json(
        { error: 'Refund not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(refund);
  } catch (error) {
    console.error('Error getting refund:', error);
    return NextResponse.json(
      { error: 'Failed to get refund', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
