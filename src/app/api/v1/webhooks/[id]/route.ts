import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, isErrorResponse } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/database/client';
import { generateWebhookSecret } from '@/lib/webhooks/signature';
import { getWebhookDeliveries } from '@/lib/webhooks/delivery';

/**
 * GET /api/v1/webhooks/:id
 * Get a webhook endpoint by ID
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

  try {
    const { data, error } = await supabaseAdmin
      .from('webhook_endpoints')
      .select('id, url, events, is_active, created_at, updated_at')
      .eq('id', webhookId)
      .eq('merchant_id', merchantId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Webhook endpoint not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting webhook endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to get webhook endpoint', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/webhooks/:id
 * Update a webhook endpoint
 */
export async function PATCH(
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

  const body = await request.json();

  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.url !== undefined) {
      updateData.url = body.url;
    }

    if (body.events !== undefined) {
      updateData.events = body.events;
    }

    if (body.isActive !== undefined) {
      updateData.is_active = body.isActive;
    }

    // If rotating secret
    if (body.rotateSecret === true) {
      updateData.secret = generateWebhookSecret();
    }

    const { data, error } = await supabaseAdmin
      .from('webhook_endpoints')
      .update(updateData)
      .eq('id', webhookId)
      .eq('merchant_id', merchantId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Webhook endpoint not found' },
        { status: 404 }
      );
    }

    const response: any = {
      id: data.id,
      url: data.url,
      events: data.events,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    // Only return secret if it was rotated
    if (body.rotateSecret === true) {
      response.secret = data.secret;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating webhook endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to update webhook endpoint', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/webhooks/:id
 * Delete a webhook endpoint
 */
export async function DELETE(
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

  try {
    const { error } = await supabaseAdmin
      .from('webhook_endpoints')
      .delete()
      .eq('id', webhookId)
      .eq('merchant_id', merchantId);

    if (error) {
      return NextResponse.json(
        { error: 'Webhook endpoint not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting webhook endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook endpoint', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
