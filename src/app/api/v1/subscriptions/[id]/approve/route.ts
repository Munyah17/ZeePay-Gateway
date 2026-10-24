import { NextRequest, NextResponse } from 'next/server';
import { approveSubscription } from '@/lib/services/subscription-service';

/**
 * POST /api/v1/subscriptions/:id/approve
 * Mark a pending subscription's mandate as approved.
 *
 * In production this is invoked by the provider callback after the
 * customer completes mandate authorization (EcoCash PIN prompt,
 * InnBucks approval, or card 3DS/tokenization). In the sandbox it is
 * used to simulate that customer approval step.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: subscriptionId } = await params;

  try {
    const subscription = await approveSubscription(subscriptionId);
    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Error approving subscription:', error);
    return NextResponse.json(
      { error: 'Failed to approve subscription', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
