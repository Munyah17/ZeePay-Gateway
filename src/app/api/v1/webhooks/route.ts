import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, isErrorResponse } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/database/client';
import { generateWebhookSecret } from '@/lib/webhooks/signature';
import { z } from 'zod';

// Validation schema for creating a webhook endpoint
const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
});

/**
 * POST /api/v1/webhooks
 * Create a new webhook endpoint
 */
export async function POST(request: NextRequest) {
  // Authenticate request
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { merchantId } = authResult;

  // Parse and validate request body
  const body = await request.json();
  const validationResult = createWebhookSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: validationResult.error.issues },
      { status: 400 }
    );
  }

  const input = validationResult.data;

  try {
    const secret = generateWebhookSecret();

    const { data, error } = await supabaseAdmin
      .from('webhook_endpoints')
      .insert({
        merchant_id: merchantId,
        url: input.url,
        secret,
        events: input.events,
        is_active: true,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create webhook endpoint: ${error?.message}`);
    }

    // Return the secret only once
    return NextResponse.json(
      {
        id: data.id,
        url: data.url,
        events: data.events,
        secret, // Only shown on creation
        isActive: data.is_active,
        createdAt: data.created_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating webhook endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook endpoint', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/webhooks
 * List webhook endpoints for a merchant
 */
export async function GET(request: NextRequest) {
  // Authenticate request
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { merchantId } = authResult;

  try {
    const { data, error } = await supabaseAdmin
      .from('webhook_endpoints')
      .select('id, url, events, is_active, created_at, updated_at')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch webhook endpoints: ${error.message}`);
    }

    return NextResponse.json({
      data: data || [],
    });
  } catch (error) {
    console.error('Error listing webhook endpoints:', error);
    return NextResponse.json(
      { error: 'Failed to list webhook endpoints', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
