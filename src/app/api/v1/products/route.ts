import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, isErrorResponse } from '@/lib/auth/middleware';
import { createProduct, listProducts } from '@/lib/services/product-service';
import { z } from 'zod';

const createProductSchema = z.object({
  externalReference: z.string().min(1).max(255).optional(),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  price: z.number().positive(),
  currency: z.string().length(3),
  images: z.array(z.string().url()).max(10).optional(),
  category: z.string().max(100).optional(),
  stockQuantity: z.number().int().min(0).nullable().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * POST /api/v1/products
 * Create a catalogue product. Supplying the same externalReference
 * (merchant SKU) twice returns the same record — idempotent.
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  const { merchantId } = authResult;

  const body = await request.json();
  const validationResult = createProductSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: validationResult.error.issues },
      { status: 400 }
    );
  }

  try {
    const product = await createProduct(merchantId, validationResult.data);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/products
 * List catalogue products for a merchant — the "pull" endpoint a
 * storefront integration calls to render its shop front.
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
  const activeOnly = searchParams.get('activeOnly') === 'true';
  const search = searchParams.get('search') || undefined;
  const category = searchParams.get('category') || undefined;

  try {
    const products = await listProducts(merchantId, { limit, offset, activeOnly, search, category });
    return NextResponse.json({
      data: products,
      pagination: { limit, offset, count: products.length },
    });
  } catch (error) {
    console.error('Error listing products:', error);
    return NextResponse.json(
      { error: 'Failed to list products', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
