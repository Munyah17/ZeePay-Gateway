import { supabaseAdmin } from '../database/client';
import { providerRegistry } from '../providers/registry';
import { PaymentProvider } from '../providers/interface';
import { PayoutInput, PayoutResult } from '@/types/provider';
import { v4 as uuidv4 } from 'uuid';
import { getIdempotencyResult, recordIdempotencyKey } from '../utils/idempotency';
import { deliverWebhookToMerchant } from '../webhooks/delivery';
import { initializeProviderForMerchant } from './provider-credentials';

export interface CreatePayoutOptions {
  merchantId: string;
  providerName?: string;
  environment?: 'test' | 'live';
  input: PayoutInput;
  idempotencyKey?: string;
}

export interface PayoutResponse {
  id: string;
  externalReference: string;
  providerReference?: string;
  serviceType: string;
  amount: number;
  currency: string;
  recipientMsisdn: string;
  status: string;
  createdAt: string;
}

function toResponse(row: any): PayoutResponse {
  return {
    id: row.id,
    externalReference: row.external_reference,
    providerReference: row.provider_reference || undefined,
    serviceType: row.service_type,
    amount: row.amount,
    currency: row.currency,
    recipientMsisdn: row.recipient_msisdn,
    status: row.status,
    createdAt: row.created_at,
  };
}

/**
 * Resolve a payout-capable provider for the merchant, loading their
 * stored provider credentials when a merchant_provider_accounts row exists.
 */
type PayoutCapableProvider = PaymentProvider &
  Required<Pick<PaymentProvider, 'createPayout'>>;

async function resolveProvider(
  merchantId: string,
  providerName: string,
  environment: 'test' | 'live'
): Promise<PayoutCapableProvider> {
  const provider = providerRegistry.get(providerName);
  if (!provider) {
    throw new Error(`No provider available for '${providerName}'`);
  }
  if (!provider.getCapabilities().createPayout || !provider.createPayout) {
    throw new Error(`Provider '${providerName}' does not support payouts/disbursements`);
  }

  // Load the merchant's stored credentials for this provider, if configured
  await initializeProviderForMerchant(provider, merchantId, environment);
  return provider as PayoutCapableProvider;
}

/**
 * Create a payout — disburse funds into a customer's wallet.
 * E.g. EcoCash Enterprise Cash-In (bulk), Disburse Change (POS change),
 * or Merchant to Subscriber (single payout).
 *
 * The externalReference is the merchant's idempotency key for the payout:
 * re-sending the same reference returns the original transaction.
 */
export async function createPayout(options: CreatePayoutOptions): Promise<PayoutResponse> {
  const { merchantId, input, idempotencyKey } = options;
  const providerName = options.providerName || 'ecocash';
  const environment = options.environment || 'test';
  const externalReference = input.externalReference || uuidv4();

  // Idempotency — by explicit key or by externalReference uniqueness
  if (idempotencyKey) {
    const existing = await getIdempotencyResult(merchantId, idempotencyKey);
    if (existing && existing.resourceType === 'payout') {
      const { data } = await supabaseAdmin.from('payouts').select('*').eq('id', existing.resourceId).single();
      if (data) return toResponse(data);
    }
  }

  const { data: existingByRef } = await supabaseAdmin
    .from('payouts')
    .select('*')
    .eq('merchant_id', merchantId)
    .eq('external_reference', externalReference)
    .maybeSingle();
  if (existingByRef) {
    return toResponse(existingByRef);
  }

  const provider = await resolveProvider(merchantId, providerName, environment);

  // Record the payout before calling the provider so the outcome can be
  // reconciled even if the response is lost.
  const payoutId = uuidv4();
  const { data: payout, error: insertError } = await supabaseAdmin
    .from('payouts')
    .insert({
      id: payoutId,
      merchant_id: merchantId,
      provider_name: providerName,
      service_type: input.serviceType,
      external_reference: externalReference,
      amount: input.amount,
      currency: input.currency,
      recipient_msisdn: input.recipientMsisdn,
      beneficiary_reference: input.beneficiaryReference,
      status: 'processing',
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (insertError || !payout) {
    throw new Error(`Failed to create payout record: ${insertError?.message}`);
  }

  if (idempotencyKey) {
    await recordIdempotencyKey(merchantId, idempotencyKey, 'payout', payoutId);
  }

  try {
    const result: PayoutResult = await provider.createPayout({
      ...input,
      externalReference,
    });

    const { data: updated } = await supabaseAdmin
      .from('payouts')
      .update({
        status: result.status,
        provider_reference: result.providerReference,
        error_message: result.status === 'failed' ? JSON.stringify(result.providerResponse) : null,
      })
      .eq('id', payoutId)
      .select()
      .single();

    await deliverWebhookToMerchant(
      merchantId,
      result.status === 'succeeded' ? 'payout.succeeded' : 'payout.failed',
      toResponse(updated!)
    );

    return toResponse(updated!);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await supabaseAdmin
      .from('payouts')
      .update({ status: 'failed', error_message: message })
      .eq('id', payoutId);

    await deliverWebhookToMerchant(merchantId, 'payout.failed', {
      ...toResponse({ ...payout, status: 'failed' }),
      error: message,
    });

    throw new Error(`Payout failed: ${message}`);
  }
}

/**
 * Look up a payout by external reference. Queries the provider's
 * transaction lookup for the latest state and syncs the local record.
 */
export async function getPayout(externalReference: string, merchantId: string): Promise<PayoutResponse> {
  const { data: payout, error } = await supabaseAdmin
    .from('payouts')
    .select('*')
    .eq('merchant_id', merchantId)
    .eq('external_reference', externalReference)
    .single();

  if (error || !payout) {
    throw new Error('Payout not found');
  }

  // Sync latest state from the provider when the method is available
  const provider = providerRegistry.get(payout.provider_name);
  const getPayoutFn = provider?.getPayout?.bind(provider);
  if (getPayoutFn && payout.status !== 'succeeded' && payout.status !== 'failed') {
    try {
      await initializeProviderForMerchant(provider!, merchantId);
      const result = await getPayoutFn({
        externalTransactionId: externalReference,
        msisdn: payout.recipient_msisdn,
        currency: payout.currency,
      });

      await supabaseAdmin
        .from('payouts')
        .update({ status: result.status, provider_reference: result.providerReference })
        .eq('id', payout.id);

      return toResponse({ ...payout, status: result.status, provider_reference: result.providerReference });
    } catch {
      // Provider lookup unavailable — return stored state
    }
  }

  return toResponse(payout);
}

/**
 * List payouts for a merchant.
 */
export async function listPayouts(
  merchantId: string,
  options?: { limit?: number; offset?: number; status?: string; serviceType?: string }
): Promise<PayoutResponse[]> {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  let query = supabaseAdmin
    .from('payouts')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.status) query = query.eq('status', options.status);
  if (options?.serviceType) query = query.eq('service_type', options.serviceType);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list payouts: ${error.message}`);

  return (data || []).map(toResponse);
}
