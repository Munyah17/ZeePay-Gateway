import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, isErrorResponse } from '@/lib/auth/middleware';
import { createCustomer, listCustomers } from '@/lib/services/customer-service';
import { z } from 'zod';

const createCustomerSchema = z.object({
  externalReference: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  name: z.string().max(255).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * POST /api/v1/customers
 * Create (or return an existing) customer. Supplying the same
 * externalReference twice returns the same record — idempotent.
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { merchantId } = authResult;

  const body = await request.json();
  const validationResult = createCustomerSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: validationResult.error.issues },
      { status: 400 }
    );
  }

  if (!validationResult.data.externalReference && !validationResult.data.email && !validationResult.data.phone) {
    return NextResponse.json(
      { error: 'Provide at least one of: externalReference, email, phone' },
      { status: 400 }
    );
  }

  try {
    const customer = await createCustomer(merchantId, validationResult.data);
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/customers
 * List customers for a merchant
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
  const email = searchParams.get('email') || undefined;

  try {
    const customers = await listCustomers(merchantId, { limit, offset, email });
    return NextResponse.json({
      data: customers,
      pagination: { limit, offset, count: customers.length },
    });
  } catch (error) {
    console.error('Error listing customers:', error);
    return NextResponse.json(
      { error: 'Failed to list customers', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
