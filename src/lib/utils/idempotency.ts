import { supabaseAdmin } from '../database/client';

/**
 * Check if an idempotency key has been used before
 */
export async function getIdempotencyResult(
  merchantId: string,
  idempotencyKey: string
): Promise<{ resourceType: string; resourceId: string } | null> {
  const { data, error } = await supabaseAdmin
    .from('idempotency_keys')
    .select('resource_type, resource_id')
    .eq('merchant_id', merchantId)
    .eq('idempotency_key', idempotencyKey)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    resourceType: data.resource_type,
    resourceId: data.resource_id,
  };
}

/**
 * Record an idempotency key
 */
export async function recordIdempotencyKey(
  merchantId: string,
  idempotencyKey: string,
  resourceType: string,
  resourceId: string
): Promise<void> {
  const { error } = await supabaseAdmin.from('idempotency_keys').insert({
    merchant_id: merchantId,
    idempotency_key: idempotencyKey,
    resource_type: resourceType,
    resource_id: resourceId,
  });

  if (error) {
    // If it's a duplicate key error, that's okay - means the key was already recorded
    if (error.code !== '23505') {
      throw new Error(`Failed to record idempotency key: ${error.message}`);
    }
  }
}
