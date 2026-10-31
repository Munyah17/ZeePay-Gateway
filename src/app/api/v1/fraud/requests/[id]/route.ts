import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/database/client';
import { reviewMultiAccountRequest } from '@/lib/services/fraud-service';
import { z } from 'zod';

const reviewSchema = z.object({
  approve: z.boolean(),
  note: z.string().max(500).optional(),
});

/**
 * Platform-ops auth — CRON_SECRET bearer (same trust level as the
 * billing runner). These endpoints decide who gets a second account.
 */
function authorised(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET || 'dev-cron-secret';
  if (process.env.NODE_ENV === 'production' && !process.env.CRON_SECRET) return false;
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  return token === secret;
}

/**
 * GET /api/v1/fraud/requests?status=pending  — list review queue.
 * GET /api/v1/fraud/requests/:id            — (this file) handled below.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authorised(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const { data } = await supabaseAdmin
    .from('multi_account_requests')
    .select('*')
    .eq('id', id)
    .single();
  if (!data) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  return NextResponse.json(data);
}

/**
 * PATCH /api/v1/fraud/requests/:id
 * Approve or reject a multi-account request. An approval lets the same
 * email register exactly one additional account.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authorised(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  const body = await request.json();
  const validationResult = reviewSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: validationResult.error.issues },
      { status: 400 }
    );
  }

  try {
    const result = await reviewMultiAccountRequest(id, {
      approve: validationResult.data.approve,
      reviewer: 'platform-ops',
      note: validationResult.data.note,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to review request', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
