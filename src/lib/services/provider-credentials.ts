import { supabaseAdmin } from '../database/client';
import { decrypt } from '../utils/crypto';
import { PaymentProvider } from '../providers/interface';
import { ProviderCredentials } from '@/types/provider';

/**
 * Initialize a provider instance with the merchant's stored credentials.
 *
 * Every provider call must go through this before hitting the gateway —
 * initializing with `credentials: {}` means the request reaches the
 * provider unauthenticated (missing entityId/accessToken for ZimSwitch
 * Online), which silently breaks token capture, mandate charges and
 * revocations.
 *
 * Resolution order:
 *  1. merchant_provider_accounts row for this provider matching the
 *     requested environment (is_active)
 *  2. any active merchant_provider_accounts row for this provider
 *  3. empty credentials (sandbox/mock providers — they ignore config)
 *
 * When a specific account is resolved, its own environment wins so the
 * provider hits the matching gateway host.
 */
export async function initializeProviderForMerchant<T extends PaymentProvider>(
  provider: T,
  merchantId: string | null | undefined,
  environment: 'test' | 'live' = 'test'
): Promise<T> {
  let credentials: ProviderCredentials = {};
  let resolvedEnvironment = environment;

  if (merchantId) {
    const { data: providerRow } = await supabaseAdmin
      .from('payment_providers')
      .select('id')
      .eq('name', provider.name)
      .single();

    if (providerRow) {
      const { data: accounts } = await supabaseAdmin
        .from('merchant_provider_accounts')
        .select('credentials_encrypted, environment')
        .eq('merchant_id', merchantId)
        .eq('provider_id', providerRow.id)
        .eq('is_active', true);

      const account =
        accounts?.find((a) => a.environment === environment) || accounts?.[0];

      if (account?.credentials_encrypted) {
        const decrypted = decrypt(account.credentials_encrypted);
        if (decrypted) {
          credentials = decrypted;
          if (account.environment === 'live' || account.environment === 'test') {
            resolvedEnvironment = account.environment;
          }
        }
      }
    }
  }

  provider.initialize({ credentials, environment: resolvedEnvironment });
  return provider;
}
