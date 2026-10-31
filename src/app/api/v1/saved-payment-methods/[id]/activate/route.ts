import { NextRequest, NextResponse } from 'next/server';
import { activateSavedPaymentMethod } from '@/lib/services/saved-payment-method-service';

/**
 * POST /api/v1/saved-payment-methods/:id/activate
 * Finalise tokenisation after the customer completes the provider's
 * hosted flow (ZimSwitch registration widget, 3DS, wallet approval).
 *
 * In production this is invoked by the provider callback/redirect; in
 * the sandbox it simulates the customer finishing the approval step.
 * Unauthenticated by design — same contract as /subscriptions/:id/approve.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const method = await activateSavedPaymentMethod(id);
    return NextResponse.json(method);
  } catch (error) {
    console.error('Error activating payment method:', error);
    return NextResponse.json(
      { error: 'Failed to activate payment method', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
