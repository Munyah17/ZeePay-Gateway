import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, isErrorResponse } from '@/lib/auth/middleware';
import { getPayment, cancelPayment } from '@/lib/services/payment-service';

/**
 * GET /api/v1/payments/:id
 * Get a payment by ID
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
  const { id: paymentId } = await params;

  try {
    const payment = await getPayment(paymentId, merchantId);

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error getting payment:', error);
    return NextResponse.json(
      { error: 'Failed to get payment', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/payments/:id/cancel
 * Cancel a payment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authenticate request
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { merchantId } = authResult;
  const { id: paymentId } = await params;

  // Check if this is a cancel request
  const body = await request.json();
  if (body.action !== 'cancel') {
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  }

  try {
    const payment = await cancelPayment(paymentId, merchantId);

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error cancelling payment:', error);
    return NextResponse.json(
      { error: 'Failed to cancel payment', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
