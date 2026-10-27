import { supabaseAdmin } from '../database/client';
import { smsProviderRegistry } from '../sms/registry';
import { SmsProvider } from '../sms/interface';
import {
  SendSmsInput,
  SendSmsResult,
  BulkSmsInput,
  BulkSmsResult,
  SmsProviderCredentials,
  SmsStatus,
} from '@/types/sms';
import { v4 as uuidv4 } from 'uuid';
import { getIdempotencyResult, recordIdempotencyKey } from '../utils/idempotency';
import { deliverWebhookToMerchant } from '../webhooks/delivery';
import { decrypt } from '../utils/crypto';

export interface SendSmsOptions {
  merchantId: string;
  providerName?: string;
  environment?: 'test' | 'live';
  input: SendSmsInput;
  idempotencyKey?: string;
}

export interface BulkSmsOptions {
  merchantId: string;
  providerName?: string;
  environment?: 'test' | 'live';
  input: BulkSmsInput;
  idempotencyKey?: string;
}

export interface SmsResponse {
  id: string;
  externalReference: string;
  providerReference?: string;
  to: string;
  senderId?: string;
  text: string;
  status: SmsStatus;
  segments: number;
  batchId?: string;
  createdAt: string;
}

function toResponse(row: any): SmsResponse {
  return {
    id: row.id,
    externalReference: row.external_reference,
    providerReference: row.provider_reference || undefined,
    to: row.recipient_msisdn,
    senderId: row.sender_id || undefined,
    text: row.message_text,
    status: row.status,
    segments: row.segments || 1,
    batchId: row.batch_id || undefined,
    createdAt: row.created_at,
  };
}

/**
 * Resolve an SMS provider for the merchant, loading their stored
 * credentials from merchant_provider_accounts when configured.
 */
async function resolveSmsProvider(
  merchantId: string,
  providerName: string,
  environment: 'test' | 'live'
): Promise<SmsProvider> {
  const provider = smsProviderRegistry.get(providerName);
  if (!provider) {
    throw new Error(`No SMS provider available for '${providerName}'`);
  }

  let credentials: SmsProviderCredentials = {};
  const { data: providerRow } = await supabaseAdmin
    .from('payment_providers')
    .select('id')
    .eq('name', providerName)
    .maybeSingle();

  const { data: account } = providerRow
    ? await supabaseAdmin
        .from('merchant_provider_accounts')
        .select('credentials_encrypted')
        .eq('merchant_id', merchantId)
        .eq('provider_id', providerRow.id)
        .eq('environment', environment)
        .eq('is_active', true)
        .maybeSingle()
    : { data: null };

  if (account?.credentials_encrypted) {
    const decrypted = decrypt(account.credentials_encrypted);
    if (decrypted) {
      credentials = decrypted;
    }
  }

  provider.initialize({ credentials, environment });
  return provider;
}

/**
 * Send a single SMS. externalReference is the merchant's idempotency key:
 * re-sending the same reference returns the original message record.
 */
export async function sendSms(options: SendSmsOptions): Promise<SmsResponse> {
  const { merchantId, input, idempotencyKey } = options;
  const providerName = options.providerName || 'sms-http';
  const environment = options.environment || 'test';
  const externalReference = input.externalReference || uuidv4();

  if (idempotencyKey) {
    const existing = await getIdempotencyResult(merchantId, idempotencyKey);
    if (existing && existing.resourceType === 'sms') {
      const { data } = await supabaseAdmin.from('sms_messages').select('*').eq('id', existing.resourceId).single();
      if (data) return toResponse(data);
    }
  }

  const { data: existingByRef } = await supabaseAdmin
    .from('sms_messages')
    .select('*')
    .eq('merchant_id', merchantId)
    .eq('external_reference', externalReference)
    .maybeSingle();
  if (existingByRef) {
    return toResponse(existingByRef);
  }

  const provider = await resolveSmsProvider(merchantId, providerName, environment);

  const smsId = uuidv4();
  const { data: sms, error: insertError } = await supabaseAdmin
    .from('sms_messages')
    .insert({
      id: smsId,
      merchant_id: merchantId,
      provider_name: providerName,
      external_reference: externalReference,
      recipient_msisdn: input.to,
      sender_id: input.senderId,
      message_text: input.text,
      status: 'queued',
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (insertError || !sms) {
    throw new Error(`Failed to create SMS record: ${insertError?.message}`);
  }

  if (idempotencyKey) {
    await recordIdempotencyKey(merchantId, idempotencyKey, 'sms', smsId);
  }

  try {
    const result: SendSmsResult = await provider.sendSms({
      ...input,
      externalReference,
    });

    const { data: updated } = await supabaseAdmin
      .from('sms_messages')
      .update({
        status: result.status,
        provider_reference: result.providerReference || null,
        segments: result.segments || 1,
        error_message: result.status === 'failed' ? JSON.stringify(result.providerResponse) : null,
      })
      .eq('id', smsId)
      .select()
      .single();

    await deliverWebhookToMerchant(
      merchantId,
      result.status === 'failed' ? 'sms.failed' : 'sms.sent',
      toResponse(updated!)
    );

    return toResponse(updated!);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await supabaseAdmin
      .from('sms_messages')
      .update({ status: 'failed', error_message: message })
      .eq('id', smsId);

    await deliverWebhookToMerchant(merchantId, 'sms.failed', {
      ...toResponse({ ...sms, status: 'failed' }),
      error: message,
    });

    throw new Error(`SMS send failed: ${message}`);
  }
}

/**
 * Send a bulk SMS batch — same text to many recipients.
 * Each recipient gets its own sms_messages row for delivery tracking.
 */
export async function sendBulkSms(options: BulkSmsOptions): Promise<{ batchId: string; total: number; messages: SmsResponse[] }> {
  const { merchantId, input, idempotencyKey } = options;
  const providerName = options.providerName || 'sms-http';
  const environment = options.environment || 'test';
  const batchReference = input.externalReference || uuidv4();

  if (idempotencyKey) {
    const existing = await getIdempotencyResult(merchantId, idempotencyKey);
    if (existing && existing.resourceType === 'sms_batch') {
      const { data } = await supabaseAdmin
        .from('sms_messages')
        .select('*')
        .eq('batch_id', existing.resourceId)
        .order('created_at', { ascending: true });
      if (data?.length) {
        return { batchId: existing.resourceId, total: data.length, messages: data.map(toResponse) };
      }
    }
  }

  // Idempotency via batch reference on sms_batches
  const { data: existingBatch } = await supabaseAdmin
    .from('sms_batches')
    .select('*')
    .eq('merchant_id', merchantId)
    .eq('external_reference', batchReference)
    .maybeSingle();

  if (existingBatch) {
    const { data: messages } = await supabaseAdmin
      .from('sms_messages')
      .select('*')
      .eq('batch_id', existingBatch.id)
      .order('created_at', { ascending: true });
    return { batchId: existingBatch.id, total: existingBatch.total, messages: (messages || []).map(toResponse) };
  }

  const provider = await resolveSmsProvider(merchantId, providerName, environment);

  const batchId = uuidv4();
  const { error: batchError } = await supabaseAdmin.from('sms_batches').insert({
    id: batchId,
    merchant_id: merchantId,
    provider_name: providerName,
    external_reference: batchReference,
    sender_id: input.senderId,
    message_text: input.text,
    total: input.to.length,
    status: 'processing',
    metadata: input.metadata || {},
  });

  if (batchError) {
    throw new Error(`Failed to create SMS batch: ${batchError.message}`);
  }

  if (idempotencyKey) {
    await recordIdempotencyKey(merchantId, idempotencyKey, 'sms_batch', batchId);
  }

  // Persist a row per recipient first — batch results reconcile against them
  const rows = input.to.map((recipient) => ({
    id: uuidv4(),
    merchant_id: merchantId,
    provider_name: providerName,
    batch_id: batchId,
    external_reference: `${batchReference}:${recipient}`,
    recipient_msisdn: recipient,
    sender_id: input.senderId,
    message_text: input.text,
    status: 'queued',
    metadata: { ...input.metadata, batchReference },
  }));

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('sms_messages')
    .insert(rows)
    .select();

  if (insertError || !inserted) {
    throw new Error(`Failed to create SMS records: ${insertError?.message}`);
  }

  try {
    const result: BulkSmsResult = await provider.sendBulkSms!({
      ...input,
      externalReference: batchReference,
    });

    // Reconcile per-recipient results back into sms_messages
    const updates = result.results.map((r, i) => {
      const row = inserted[i];
      return supabaseAdmin
        .from('sms_messages')
        .update({
          status: r.status,
          provider_reference: r.providerReference || null,
          segments: r.segments || 1,
          error_message:
            r.status === 'failed' ? (r.metadata?.error as string) || JSON.stringify(r.providerResponse) : null,
        })
        .eq('id', row.id);
    });
    await Promise.all(updates);

    await supabaseAdmin
      .from('sms_batches')
      .update({
        status: result.failed === 0 ? 'completed' : result.queued === 0 ? 'failed' : 'completed_with_errors',
        failed_count: result.failed,
      })
      .eq('id', batchId);

    const { data: finalMessages } = await supabaseAdmin
      .from('sms_messages')
      .select('*')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: true });

    await deliverWebhookToMerchant(merchantId, 'sms.batch.completed', {
      batchId,
      batchReference,
      total: result.total,
      queued: result.queued,
      failed: result.failed,
    });

    return { batchId, total: result.total, messages: (finalMessages || []).map(toResponse) };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await supabaseAdmin
      .from('sms_batches')
      .update({ status: 'failed', error_message: message })
      .eq('id', batchId);
    await supabaseAdmin
      .from('sms_messages')
      .update({ status: 'failed', error_message: message })
      .eq('batch_id', batchId);

    await deliverWebhookToMerchant(merchantId, 'sms.batch.failed', {
      batchId,
      batchReference,
      error: message,
    });

    throw new Error(`Bulk SMS failed: ${message}`);
  }
}

/**
 * Look up a single SMS by ID. Polls provider status where supported.
 */
export async function getSms(id: string, merchantId: string): Promise<SmsResponse> {
  const { data: sms, error } = await supabaseAdmin
    .from('sms_messages')
    .select('*')
    .eq('id', id)
    .eq('merchant_id', merchantId)
    .single();

  if (error || !sms) {
    throw new Error('SMS not found');
  }

  // Sync latest delivery status from the provider where supported
  const provider = smsProviderRegistry.get(sms.provider_name);
  const getStatusFn = provider?.getSmsStatus?.bind(provider);
  if (
    getStatusFn &&
    sms.provider_reference &&
    !['delivered', 'failed', 'rejected'].includes(sms.status)
  ) {
    try {
      const result = await getStatusFn({ providerReference: sms.provider_reference });
      if (result.status !== sms.status) {
        await supabaseAdmin
          .from('sms_messages')
          .update({ status: result.status })
          .eq('id', sms.id);
        return toResponse({ ...sms, status: result.status });
      }
    } catch {
      // Provider status lookup unavailable — return stored state
    }
  }

  return toResponse(sms);
}

/**
 * List SMS messages for a merchant.
 */
export async function listSms(
  merchantId: string,
  options?: { limit?: number; offset?: number; status?: string; batchId?: string }
): Promise<SmsResponse[]> {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  let query = supabaseAdmin
    .from('sms_messages')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.status) query = query.eq('status', options.status);
  if (options?.batchId) query = query.eq('batch_id', options.batchId);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list SMS messages: ${error.message}`);

  return (data || []).map(toResponse);
}
