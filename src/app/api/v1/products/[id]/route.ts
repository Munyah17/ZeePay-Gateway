import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, isErrorResponse } from '@/lib/auth/middleware';
import { getProduct, updateProduct } from '@/lib/services/product-service';
import { z } from 'zod';

const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  price: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  images: z.array(z.string().url()).max(10).optional(),
  category: z.string().max(100).optional(),
  stockQuantity: z.number().int().min(0).nullable().optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * GET /api/v1/products/:id
 * Get a catalogue product
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
    const product = await getProduct(id, merchantId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json(
      { error: 'Product not found', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 404 }
    );
  }
}

/**
 * PATCH /api/v1/products/:id
 * Update a product — price, stock, images, availability.
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
  const validationResult = updateProductSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: validationResult.error.issues },
      { status: 400 }
    );
  }

  try {
    const product = await updateProduct(id, merchantId, validationResult.data);
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/products/:id
 * Deactivate a product — keeps the record (and payment history) but
 * removes it from storefront listings when activeOnly is used.
 */
export async function DELETE(
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
    const product = await updateProduct(id, merchantId, { isActive: false });
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error deactivating product:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate product', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
