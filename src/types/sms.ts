// SMS provider types and interfaces

export type SmsStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'rejected';

export type SmsTransport = 'http' | 'smpp';

export interface SendSmsInput {
  /** Recipient MSISDN in international format (e.g. 263771234567) */
  to: string;
  /** Message text — messages longer than the SMS limit are sent as concatenated SMS where the gateway supports it */
  text: string;
  /** Sender ID — alphanumeric (max 11 chars) or numeric short/long code */
  senderId?: string;
  /** Merchant's reference for idempotency / reconciliation */
  externalReference?: string;
  /** Optional delivery report callback registration hint (provider-dependent) */
  requestDeliveryReport?: boolean;
  metadata?: Record<string, any>;
}

export interface SendSmsResult {
  id: string;
  providerReference: string;
  status: SmsStatus;
  to: string;
  senderId?: string;
  externalReference?: string;
  /** Number of SMS segments used for billing */
  segments?: number;
  metadata?: Record<string, any>;
  providerResponse?: Record<string, any>;
}

export interface BulkSmsInput {
  /** List of recipient MSISDNs */
  to: string[];
  /** Shared message text for all recipients */
  text: string;
  senderId?: string;
  /** Campaign/batch reference — idempotency key for the batch */
  externalReference?: string;
  requestDeliveryReport?: boolean;
  metadata?: Record<string, any>;
}

export interface BulkSmsResult {
  id: string;
  batchReference: string;
  total: number;
  queued: number;
  failed: number;
  results: SendSmsResult[];
}

export interface GetSmsInput {
  providerReference: string;
}

export interface SmsProviderCredentials {
  [key: string]: string | number | boolean;
}

export interface SmsProviderConfig {
  credentials: SmsProviderCredentials;
  environment: 'test' | 'live';
}

export interface SmsProviderCapabilities {
  sendSms: boolean;
  bulkSend: boolean;
  getDeliveryStatus: boolean;
  supportsDeliveryReports: boolean;
}
