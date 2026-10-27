import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, isErrorResponse } from '@/lib/auth/middleware';
import { sendSms, listSms } from '@/lib/services/sms-service';
import { z } from 'zod';

const sendSmsSchema = z.object({
  to: z.string().min(9).max(20).regex(/^\+?\d+$/, 'Recipient must be an MSISDN'),
  text: z.string().min(1).max(1600),
  senderId: z.string().max(15).optional(),
  externalReference: z.string().min(1).max(255).optional(),
  requestDeliveryReport: z.boolean().optional(),
  providerName: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  idempotencyKey: z.string().optional(),
});

/**
 * POST /api/v1/sms
 * Send a single SMS via the configured gateway (HTTP or SMPP).
 *
 * externalReference is the merchant's idempotency key — resending the
 * same reference returns the original message, never a duplicate.
 *
 * providerName selects the gateway:
 *   sms-http  — generic HTTP submit endpoint (default)
 *   sms-smpp  — SMPP v3.4 SMSC bind (Node runtime only)
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { merchantId, environment } = authResult;
  const body = await request.json();
  const validationResult = sendSmsSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: validationResult.error.issues },
      { status: 400 }
    );
  }

  const { providerName, idempotencyKey, ...input } = validationResult.data;

  try {
    const sms = await sendSms({
      merchantId,
      providerName,
      environment: environment as 'test' | 'live',
      input,
      idempotencyKey,
    });

    return NextResponse.json(sms, { status: 201 });
  } catch (error) {
    console.error('Error sending SMS:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/sms
 * List SMS messages for a merchant.
 * Filters: status, batchId. Pagination: limit, offset.
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
  const status = searchParams.get('status') || undefined;
  const batchId = searchParams.get('batchId') || undefined;

  try {
    const messages = await listSms(merchantId, { limit, offset, status, batchId });

    return NextResponse.json({
      data: messages,
      pagination: {
        limit,
        offset,
        count: messages.length,
      },
    });
  } catch (error) {
    console.error('Error listing SMS messages:', error);
    return NextResponse.json(
      { error: 'Failed to list SMS messages', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
