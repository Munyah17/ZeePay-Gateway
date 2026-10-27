import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, isErrorResponse } from '@/lib/auth/middleware';
import { sendBulkSms } from '@/lib/services/sms-service';
import { z } from 'zod';

const bulkSmsSchema = z.object({
  to: z.array(z.string().min(9).max(20).regex(/^\+?\d+$/)).min(1).max(10000),
  text: z.string().min(1).max(1600),
  senderId: z.string().max(15).optional(),
  externalReference: z.string().min(1).max(255).optional(),
  requestDeliveryReport: z.boolean().optional(),
  providerName: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  idempotencyKey: z.string().optional(),
});

/**
 * POST /api/v1/sms/bulk
 * Send the same SMS to many recipients as a tracked batch.
 *
 * externalReference is the idempotency key for the whole batch —
 * resending the same reference returns the original batch, never
 * duplicate sends.
 *
 * Each recipient gets an individual sms_messages row for per-message
 * delivery tracking; the batch summary lives in sms_batches.
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { merchantId, environment } = authResult;
  const body = await request.json();
  const validationResult = bulkSmsSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: validationResult.error.issues },
      { status: 400 }
    );
  }

  const { providerName, idempotencyKey, ...input } = validationResult.data;

  try {
    const result = await sendBulkSms({
      merchantId,
      providerName,
      environment: environment as 'test' | 'live',
      input,
      idempotencyKey,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error sending bulk SMS:', error);
    return NextResponse.json(
      { error: 'Failed to send bulk SMS', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
