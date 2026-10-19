import { NextRequest, NextResponse } from 'next/server';
import { providerRegistry } from '@/lib/providers/registry';
import { PaymentStatus } from '@/types/provider';

/**
 * POST /api/v1/simulator/payments/:id
 * Simulate payment status changes (test mode only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // This endpoint should only be available in test mode
  const body = await request.json();
  const { status } = body;
  const { id: paymentId } = await params;

  if (!status || !['pending', 'processing', 'succeeded', 'failed', 'cancelled'].includes(status)) {
    return NextResponse.json(
      { error: 'Invalid status. Must be one of: pending, processing, succeeded, failed, cancelled' },
      { status: 400 }
    );
  }

  try {
    const mockProvider = providerRegistry.get('mock');
    if (!mockProvider) {
      return NextResponse.json(
        { error: 'Mock provider not available' },
        { status: 500 }
      );
    }

    // Cast to access simulator methods
    const simulator = mockProvider as any;
    if (typeof simulator.simulatePaymentStatus !== 'function') {
      return NextResponse.json(
        { error: 'Simulator not available' },
        { status: 500 }
      );
    }

    // Simulate the status change
    simulator.simulatePaymentStatus(paymentId, status as PaymentStatus);

    return NextResponse.json({
      success: true,
      paymentId,
      status,
    });
  } catch (error) {
    console.error('Error simulating payment:', error);
    return NextResponse.json(
      { error: 'Failed to simulate payment', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/simulator/payments/:id
 * Get simulated payment details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: paymentId } = await params;
  
  try {
    const mockProvider = providerRegistry.get('mock');
    if (!mockProvider) {
      return NextResponse.json(
        { error: 'Mock provider not available' },
        { status: 500 }
      );
    }

    const simulator = mockProvider as any;
    if (typeof simulator.getAllPayments !== 'function') {
      return NextResponse.json(
        { error: 'Simulator not available' },
        { status: 500 }
      );
    }

    const allPayments = simulator.getAllPayments();
    const payment = allPayments.find((p: any) => p.providerReference === paymentId);

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found in simulator' },
        { status: 404 }
      );
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error getting simulated payment:', error);
    return NextResponse.json(
      { error: 'Failed to get simulated payment', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
