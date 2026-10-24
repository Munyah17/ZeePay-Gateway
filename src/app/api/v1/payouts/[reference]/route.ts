import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, isErrorResponse } from '@/lib/auth/middleware';
import { getPayout } from '@/lib/services/payout-service';

/**
 * GET /api/v1/payouts/:reference
 * Look up a payout by its externalReference.
 * Syncs the latest state from the provider's transaction lookup
 * when the payout hasn't reached a terminal status.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { merchantId } = authResult;
  const { reference } = await params;

  try {
    const payout = await getPayout(reference, merchantId);
    return NextResponse.json(payout);
  } catch (error) {
    return NextResponse.json(
      { error: 'Payout not found', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 404 }
    );
  }
}
