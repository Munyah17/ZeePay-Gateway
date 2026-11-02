import { supabaseAdmin } from '../database/client';
import { v4 as uuidv4 } from 'uuid';
import { ProductInput, UpdateProductInput, ProductResponse } from '@/types/product';

/**
 * Products — the merchant's sellable catalogue. ZeePay is the back
 * store: merchants manage products here (dashboard or API) and their
 * own storefront pulls them with GET /api/v1/products, then sells via
 * POST /api/v1/payments with productId.
 *
 * `externalReference` is the merchant's SKU. Supplying it makes
 * product creation idempotent: repeat calls return the same row.
 */

function toResponse(row: any): ProductResponse {
  return {
    id: row.id,
    sku: row.external_reference || undefined,
    name: row.name,
    description: row.description || undefined,
    price: Number(row.price),
    currency: row.currency,
    images: row.images || [],
    category: row.category || undefined,
    stockQuantity: row.stock_quantity,
    isActive: row.is_active,
    metadata: row.metadata || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Create a product. When `externalReference` (merchant SKU) is given
 * the call is idempotent — re-creating the same SKU returns the
 * existing product.
 */
export async function createProduct(
  merchantId: string,
  input: ProductInput
): Promise<ProductResponse> {
  if (input.externalReference) {
    const { data: existing } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('merchant_id', merchantId)
      .eq('external_reference', input.externalReference)
      .maybeSingle();
    if (existing) return toResponse(existing);
  }

  const { data: created, error } = await supabaseAdmin
    .from('products')
    .insert({
      id: uuidv4(),
      merchant_id: merchantId,
      external_reference: input.externalReference || null,
      name: input.name,
      description: input.description || null,
      price: input.price,
      currency: input.currency,
      images: input.images || [],
      category: input.category || null,
      stock_quantity: input.stockQuantity ?? null,
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error || !created) {
    // Race on the unique (merchant_id, external_reference) — re-read
    if (input.externalReference) {
      const { data: existing } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('merchant_id', merchantId)
        .eq('external_reference', input.externalReference)
        .single();
      if (existing) return toResponse(existing);
    }
    throw new Error(`Failed to create product: ${error?.message}`);
  }

  return toResponse(created);
}

export async function getProduct(
  productId: string,
  merchantId: string
): Promise<ProductResponse | null> {
  const { data } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('merchant_id', merchantId)
    .single();

  return data ? toResponse(data) : null;
}

export async function listProducts(
  merchantId: string,
  options: {
    limit?: number;
    offset?: number;
    activeOnly?: boolean;
    search?: string;
    category?: string;
  } = {}
): Promise<ProductResponse[]> {
  const limit = options.limit || 50;
  const offset = options.offset || 0;

  let query = supabaseAdmin
    .from('products')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.activeOnly) {
    query = query.eq('is_active', true);
  }
  if (options.category) {
    query = query.eq('category', options.category);
  }
  if (options.search) {
    query = query.or(`name.ilike.%${options.search}%,external_reference.ilike.%${options.search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list products: ${error.message}`);

  return (data || []).map(toResponse);
}

export async function updateProduct(
  productId: string,
  merchantId: string,
  input: UpdateProductInput
): Promise<ProductResponse> {
  const updates: Record<string, any> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.price !== undefined) updates.price = input.price;
  if (input.currency !== undefined) updates.currency = input.currency;
  if (input.images !== undefined) updates.images = input.images;
  if (input.category !== undefined) updates.category = input.category;
  if (input.stockQuantity !== undefined) updates.stock_quantity = input.stockQuantity;
  if (input.isActive !== undefined) updates.is_active = input.isActive;
  if (input.metadata !== undefined) updates.metadata = input.metadata;

  const { data, error } = await supabaseAdmin
    .from('products')
    .update(updates)
    .eq('id', productId)
    .eq('merchant_id', merchantId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to update product: ${error?.message || 'not found'}`);
  }

  return toResponse(data);
}
