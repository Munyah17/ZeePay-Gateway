import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, isErrorResponse } from '@/lib/auth/middleware';
import { getPlan, updatePlan } from '@/lib/services/subscription-service';
import { z } from 'zod';

const updatePlanSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(500).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  interval: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  intervalCount: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/v1/plans/:id
 * Get a subscription plan
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
    const plan = await getPlan(id, merchantId);
    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json(
      { error: 'Plan not found', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 404 }
    );
  }
}

/**
 * PATCH /api/v1/plans/:id
 * Update a plan. Changing terms affects only future subscriptions;
 * existing subscriptions are updated via PATCH /subscriptions/:id.
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
  const validationResult = updatePlanSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: validationResult.error.issues },
      { status: 400 }
    );
  }

  try {
    const plan = await updatePlan(id, merchantId, validationResult.data);
    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json(
      { error: 'Failed to update plan', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/plans/:id
 * Deactivate a plan — keeps the record but stops new subscriptions.
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
    const plan = await updatePlan(id, merchantId, { isActive: false });
    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error deactivating plan:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate plan', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
