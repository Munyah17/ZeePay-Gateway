import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, isErrorResponse } from '@/lib/auth/middleware';
import { getSms } from '@/lib/services/sms-service';

/**
 * GET /api/v1/sms/:id
 * Get a single SMS message with its latest delivery status.
 * Polls the provider's status endpoint where supported (HTTP gateways);
 * SMPP delivery receipts arrive via deliver_sm on persistent binds.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { merchantId } = authResult;
  const { id } = await params;

  try {
    const sms = await getSms(id, merchantId);
    return NextResponse.json(sms);
  } catch (error) {
    return NextResponse.json(
      { error: 'SMS not found', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 404 }
    );
  }
}
