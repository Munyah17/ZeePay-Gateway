import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../database/client';

export interface ApiKeyData {
  merchantId: string;
  environment: 'test' | 'live';
}

/**
 * Generate a new API key for a merchant
 */
export async function generateApiKey(
  merchantId: string,
  environment: 'test' | 'live'
): Promise<string> {
  const apiKey = `zp_${environment}_${uuidv4().replace(/-/g, '')}`;
  const keyPrefix = apiKey.substring(0, 20);
  const keyHash = await bcrypt.hash(apiKey, 10);

  const { error } = await supabaseAdmin.from('api_keys').insert({
    merchant_id: merchantId,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    environment,
    is_active: true,
  });

  if (error) {
    throw new Error(`Failed to generate API key: ${error.message}`);
  }

  return apiKey;
}

/**
 * Validate an API key and return merchant data
 */
export async function validateApiKey(
  apiKey: string
): Promise<ApiKeyData | null> {
  const keyPrefix = apiKey.substring(0, 20);

  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .select('merchant_id, environment, key_hash, is_active')
    .eq('key_prefix', keyPrefix)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  const isValid = await bcrypt.compare(apiKey, data.key_hash);
  if (!isValid) {
    return null;
  }

  // Update last used timestamp
  await supabaseAdmin
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_prefix', keyPrefix);

  return {
    merchantId: data.merchant_id,
    environment: data.environment,
  };
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(merchantId: string, keyPrefix: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('api_keys')
    .update({ is_active: false })
    .eq('merchant_id', merchantId)
    .eq('key_prefix', keyPrefix);

  if (error) {
    throw new Error(`Failed to revoke API key: ${error.message}`);
  }
}

/**
 * List API keys for a merchant
 */
export async function listApiKeys(merchantId: string) {
  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .select('id, key_prefix, environment, is_active, last_used_at, created_at, expires_at')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list API keys: ${error.message}`);
  }

  return data;
}
