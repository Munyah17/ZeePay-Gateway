import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, isErrorResponse } from '@/lib/auth/middleware';
import {
  getSavedPaymentMethod,
  updateSavedPaymentMethod,
  removeSavedPaymentMethod,
} from '@/lib/services/saved-payment-method-service';
import { z } from 'zod';

const updateSchema = z.object({
  label: z.string().max(100).optional(),
  setAsDefault: z.boolean().optional(),
});

/**
 * GET /api/v1/saved-payment-methods/:id
 * Get a saved payment method
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
    const method = await getSavedPaymentMethod(id, merchantId);
    return NextResponse.json(method);
  } catch (error) {
    return NextResponse.json(
      { error: 'Saved payment method not found', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 404 }
    );
  }
}

/**
 * PATCH /api/v1/saved-payment-methods/:id
 * Update a saved payment method — rename label or set as default.
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
  const { id } = await params;

  const body = await request.json();
  const validationResult = updateSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: validationResult.error.issues },
      { status: 400 }
    );
  }

  try {
    const method = await updateSavedPaymentMethod(id, merchantId, validationResult.data);
    return NextResponse.json(method);
  } catch (error) {
    console.error('Error updating payment method:', error);
    return NextResponse.json(
      { error: 'Failed to update payment method', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/saved-payment-methods/:id
 * Remove a saved payment method — revokes the provider token so no
 * further merchant-initiated charges can be made against it.
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
  const { id } = await params;

  try {
    const method = await removeSavedPaymentMethod(id, merchantId);
    return NextResponse.json(method);
  } catch (error) {
    console.error('Error removing payment method:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to remove payment method', message },
      { status: message.includes('in use') ? 409 : 500 }
    );
  }
}
