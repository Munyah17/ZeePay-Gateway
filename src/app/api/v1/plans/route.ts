import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, isErrorResponse } from '@/lib/auth/middleware';
import { createPlan, listPlans } from '@/lib/services/subscription-service';
import { z } from 'zod';

const createPlanSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(500).optional(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  interval: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  intervalCount: z.number().int().positive().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * POST /api/v1/plans
 * Create a subscription plan — a reusable billing template with a
 * fixed amount, currency and interval that customers subscribe to.
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { merchantId } = authResult;

  const body = await request.json();
  const validationResult = createPlanSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: validationResult.error.issues },
      { status: 400 }
    );
  }

  try {
    const plan = await createPlan(merchantId, validationResult.data);
    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json(
      { error: 'Failed to create plan', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/plans
 * List subscription plans for a merchant
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { merchantId } = authResult;
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const activeOnly = searchParams.get('activeOnly') === 'true';

  try {
    const plans = await listPlans(merchantId, { limit, offset, activeOnly });
    return NextResponse.json({
      data: plans,
      pagination: { limit, offset, count: plans.length },
    });
  } catch (error) {
    console.error('Error listing plans:', error);
    return NextResponse.json(
      { error: 'Failed to list plans', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
