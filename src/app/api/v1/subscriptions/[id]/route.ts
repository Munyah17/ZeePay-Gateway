import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, isErrorResponse } from '@/lib/auth/middleware';
import {
  getSubscription,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
} from '@/lib/services/subscription-service';
import { z } from 'zod';

const updateSchema = z.object({
  action: z.enum(['pause', 'resume', 'cancel']),
  reason: z.string().max(500).optional(),
});

/**
 * GET /api/v1/subscriptions/:id
 * Get a subscription by ID
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
  const { id: subscriptionId } = await params;

  try {
    const subscription = await getSubscription(subscriptionId, merchantId);
    return NextResponse.json(subscription);
  } catch (error) {
    return NextResponse.json(
      { error: 'Subscription not found', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 404 }
    );
  }
}

/**
 * PATCH /api/v1/subscriptions/:id
 * Pause, resume, or cancel a subscription
 * Body: { "action": "pause" | "resume" | "cancel", "reason"?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { merchantId } = authResult;
  const { id: subscriptionId } = await params;

  const body = await request.json();
  const validationResult = updateSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: validationResult.error.issues },
      { status: 400 }
    );
  }

  const { action, reason } = validationResult.data;

  try {
    const subscription =
      action === 'pause'
        ? await pauseSubscription(subscriptionId, merchantId)
        : action === 'resume'
          ? await resumeSubscription(subscriptionId, merchantId)
          : await cancelSubscription(subscriptionId, merchantId, reason);

    return NextResponse.json(subscription);
  } catch (error) {
    console.error(`Error performing ${action} on subscription:`, error);
    return NextResponse.json(
      { error: `Failed to ${action} subscription`, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/subscriptions/:id
 * Cancel a subscription (alias for PATCH action=cancel)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { merchantId } = authResult;
  const { id: subscriptionId } = await params;
  const reason = request.nextUrl.searchParams.get('reason') || undefined;

  try {
    const subscription = await cancelSubscription(subscriptionId, merchantId, reason);
    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
