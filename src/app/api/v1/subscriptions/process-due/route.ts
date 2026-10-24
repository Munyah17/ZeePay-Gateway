import { NextRequest, NextResponse } from 'next/server';
import { processDueSubscriptions } from '@/lib/services/subscription-service';

/**
 * POST /api/v1/subscriptions/process-due
 * Billing run — charges all subscriptions whose next billing date has
 * passed. This is the auto-deduct engine and should be invoked on a
 * schedule (e.g. hourly cron, Vercel Cron, or external scheduler).
 *
 * Secured by the CRON_SECRET bearer token.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const cronSecret = process.env.CRON_SECRET || 'dev-cron-secret';

  if (token !== cronSecret) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or missing cron secret' },
      { status: 401 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '100', 10);

  try {
    const result = await processDueSubscriptions({ limit });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing due subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to process subscriptions', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/subscriptions/process-due
 * Also allow GET so schedulers that only issue GET requests
 * (e.g. Vercel Cron) can trigger the billing run.
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
