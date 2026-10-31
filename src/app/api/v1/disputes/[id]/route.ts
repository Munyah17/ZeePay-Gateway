import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, isErrorResponse } from '@/lib/auth/middleware';
import { getDispute, addDisputeEvidence, resolveDispute } from '@/lib/services/dispute-service';
import { z } from 'zod';

const patchSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('add_evidence'),
    submittedBy: z.enum(['customer', 'merchant', 'platform']).default('merchant'),
    note: z.string().min(1),
    attachments: z.array(z.string()).optional(),
  }),
  z.object({
    action: z.literal('resolve'),
    outcome: z.enum(['customer', 'merchant', 'closed']),
    note: z.string().optional(),
    resolvedBy: z.string().default('merchant'),
    autoRefund: z.boolean().optional(),
  }),
]);

/**
 * GET /api/v1/disputes/:id
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
    const dispute = await getDispute(id, merchantId);
    return NextResponse.json(dispute);
  } catch (error) {
    return NextResponse.json(
      { error: 'Dispute not found', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 404 }
    );
  }
}

/**
 * PATCH /api/v1/disputes/:id
 * Submit evidence or resolve the dispute. Resolving in the customer's
 * favour can trigger an automatic refund via autoRefund=true.
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
  const validationResult = patchSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: validationResult.error.issues },
      { status: 400 }
    );
  }

  try {
    if (validationResult.data.action === 'add_evidence') {
      const { submittedBy, note, attachments } = validationResult.data;
      const dispute = await addDisputeEvidence(id, merchantId, { submittedBy, note, attachments });
      return NextResponse.json(dispute);
    }

    const { outcome, note, resolvedBy, autoRefund } = validationResult.data;
    const dispute = await resolveDispute({
      disputeId: id,
      merchantId,
      outcome,
      note,
      resolvedBy,
      autoRefund,
    });
    return NextResponse.json(dispute);
  } catch (error) {
    console.error('Error updating dispute:', error);
    return NextResponse.json(
      { error: 'Failed to update dispute', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
