import { supabaseAdmin } from '../database/client';
import { v4 as uuidv4 } from 'uuid';
import { CustomerInput, CustomerResponse } from '@/types/payment-method';

/**
 * Customers — merchant-scoped payer records that saved payment
 * methods, payments and subscriptions are associated with.
 *
 * `externalReference` is the merchant's own customer id. Supplying it
 * makes customer creation idempotent: repeat calls return the same row.
 */

function toResponse(row: any): CustomerResponse {
  return {
    id: row.id,
    reference: row.external_reference || undefined,
    email: row.email || undefined,
    phone: row.phone || undefined,
    name: row.name || undefined,
    metadata: row.metadata || undefined,
    createdAt: row.created_at,
  };
}

/**
 * Get-or-create a customer by external reference (preferred) or by
 * email/phone match. Used when a merchant tokenises a card or creates
 * a subscription for a customer they've referenced before.
 */
export async function getOrCreateCustomer(
  merchantId: string,
  input: CustomerInput
): Promise<CustomerResponse> {
  // 1. Match on external_reference — the merchant's idempotent key
  if (input.externalReference) {
    const { data: existing } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('merchant_id', merchantId)
      .eq('external_reference', input.externalReference)
      .single();
    if (existing) return toResponse(existing);
  }

  // 2. Match on email when no external reference is given
  if (!input.externalReference && input.email) {
    const { data: existing } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('merchant_id', merchantId)
      .eq('email', input.email)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();
    if (existing) return toResponse(existing);
  }

  // 3. Create
  const { data: created, error } = await supabaseAdmin
    .from('customers')
    .insert({
      id: uuidv4(),
      merchant_id: merchantId,
      external_reference: input.externalReference || null,
      email: input.email || null,
      phone: input.phone || null,
      name: input.name || null,
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error || !created) {
    // Race on the unique (merchant_id, external_reference) — re-read
    if (input.externalReference) {
      const { data: existing } = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('merchant_id', merchantId)
        .eq('external_reference', input.externalReference)
        .single();
      if (existing) return toResponse(existing);
    }
    throw new Error(`Failed to create customer: ${error?.message}`);
  }

  return toResponse(created);
}

export async function createCustomer(
  merchantId: string,
  input: CustomerInput
): Promise<CustomerResponse> {
  return getOrCreateCustomer(merchantId, input);
}

export async function getCustomer(
  customerId: string,
  merchantId: string
): Promise<CustomerResponse | null> {
  const { data } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .eq('merchant_id', merchantId)
    .single();

  return data ? toResponse(data) : null;
}

export async function listCustomers(
  merchantId: string,
  options: { limit?: number; offset?: number; email?: string } = {}
): Promise<CustomerResponse[]> {
  const limit = options.limit || 50;
  const offset = options.offset || 0;

  let query = supabaseAdmin
    .from('customers')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.email) {
    query = query.eq('email', options.email);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list customers: ${error.message}`);

  return (data || []).map(toResponse);
}
