import {
  CreatePaymentInput,
  PaymentResult,
  GetPaymentInput,
  RefundPaymentInput,
  RefundResult,
  ProviderConfig,
  PaymentProviderCapabilities,
} from '@/types/provider';

// Re-export ProviderConfig for use in base class
export type { ProviderConfig };

/**
 * Base interface that all payment providers must implement.
 * This allows ZeePay to add or replace providers without changing the core payment engine.
 */
export interface PaymentProvider {
  /**
   * Provider name (e.g., 'ecocash', 'innbucks', 'visa')
   */
  readonly name: string;

  /**
   * Provider type (e.g., 'mobile_money', 'card', 'wallet')
   */
  readonly type: string;

  /**
   * Get provider capabilities
   */
  getCapabilities(): PaymentProviderCapabilities;

  /**
   * Initialize the provider with credentials
   */
  initialize(config: ProviderConfig): void;

  /**
   * Create a new payment
   */
  createPayment(input: CreatePaymentInput): Promise<PaymentResult>;

  /**
   * Get payment status by provider reference
   */
  getPayment(input: GetPaymentInput): Promise<PaymentResult>;

  /**
   * Refund a payment (optional - not all providers support refunds)
   */
  refundPayment?(input: RefundPaymentInput): Promise<RefundResult>;

  /**
   * Verify webhook signature (if provider supports webhooks)
   */
  verifyWebhook?(payload: string, signature: string, secret: string): boolean;

  /**
   * Parse webhook event (if provider supports webhooks)
   */
  parseWebhook?(payload: string): {
    eventType: string;
    providerReference: string;
    data: Record<string, any>;
  };

  /**
   * Health check to verify provider is accessible
   */
  healthCheck(): Promise<boolean>;
}
