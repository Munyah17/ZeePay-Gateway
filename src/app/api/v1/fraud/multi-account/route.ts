import { NextRequest, NextResponse } from 'next/server';
import { requestMultiAccountAccess } from '@/lib/services/fraud-service';
import { z } from 'zod';

const requestSchema = z.object({
  email: z.string().email(),
  businessName: z.string().min(2).max(255),
  reason: z.string().min(20).max(1000),
});

/**
 * POST /api/v1/fraud/multi-account
 * Public endpoint — a blocked applicant requests a manual review for a
 * legitimate second account. Operators approve/reject via
 * PATCH /api/v1/fraud/requests/:id.
 *
 * Deliberately returns the same shape whether or not the email exists —
 * no account-enumeration oracle.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validationResult = requestSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: validationResult.error.issues },
      { status: 400 }
    );
  }

  try {
    const result = await requestMultiAccountAccess(validationResult.data);
    return NextResponse.json(
      {
        id: result.id,
        status: result.status,
        message: 'Review request submitted — our team will contact you within 2 business days.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Multi-account request error:', error);
    return NextResponse.json(
      { error: 'Failed to submit request', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
