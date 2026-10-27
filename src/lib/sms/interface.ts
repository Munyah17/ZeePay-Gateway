import {
  SendSmsInput,
  SendSmsResult,
  BulkSmsInput,
  BulkSmsResult,
  GetSmsInput,
  SmsProviderCapabilities,
  SmsProviderConfig,
  SmsTransport,
} from '@/types/sms';

// Re-export for use in base class
export type { SmsProviderConfig };

/**
 * Base interface that all SMS gateway providers must implement.
 * Keeps SMS transport (HTTP/SMPP) decoupled from the core messaging engine —
 * new gateways can be added without changing the service layer.
 */
export interface SmsProvider {
  /**
   * Provider name (e.g., 'http-gateway', 'smpp-smsc', 'infobip')
   */
  readonly name: string;

  /**
   * Transport used by this provider
   */
  readonly transport: SmsTransport;

  /**
   * Get provider capabilities
   */
  getCapabilities(): SmsProviderCapabilities;

  /**
   * Initialize the provider with credentials
   */
  initialize(config: SmsProviderConfig): void;

  /**
   * Send a single SMS
   */
  sendSms(input: SendSmsInput): Promise<SendSmsResult>;

  /**
   * Send a bulk SMS batch — same text to many recipients.
   * Optional - providers may override for batch API efficiency;
   * the base class falls back to sequential single sends.
   */
  sendBulkSms?(input: BulkSmsInput): Promise<BulkSmsResult>;

  /**
   * Query delivery status for a previously sent message.
   * Optional - only providers with status-poll endpoints implement this.
   */
  getSmsStatus?(input: GetSmsInput): Promise<SendSmsResult>;

  /**
   * Health check to verify provider connectivity
   */
  healthCheck(): Promise<boolean>;
}
