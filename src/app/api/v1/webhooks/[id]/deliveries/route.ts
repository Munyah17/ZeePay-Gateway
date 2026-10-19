import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, isErrorResponse } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/database/client';
import { getWebhookDeliveries } from '@/lib/webhooks/delivery';

/**
 * GET /api/v1/webhooks/:id/deliveries
 * Get webhook delivery history for an endpoint
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
  const { id: webhookId } = await params;

  // Verify the webhook endpoint belongs to the merchant
  const { data: endpoint, error: endpointError } = await supabaseAdmin
    .from('webhook_endpoints')
    .select('id')
    .eq('id', webhookId)
    .eq('merchant_id', merchantId)
    .single();

  if (endpointError || !endpoint) {
    return NextResponse.json(
      { error: 'Webhook endpoint not found' },
      { status: 404 }
    );
  }

  // Parse query parameters
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  try {
    const deliveries = await getWebhookDeliveries(webhookId, limit);

    return NextResponse.json({
      data: deliveries,
    });
  } catch (error) {
    console.error('Error fetching webhook deliveries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook deliveries', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
