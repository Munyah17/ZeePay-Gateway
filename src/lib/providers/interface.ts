import {
  CreatePaymentInput,
  PaymentResult,
  GetPaymentInput,
  RefundPaymentInput,
  RefundResult,
  CreateMandateInput,
  MandateResult,
  ChargeMandateInput,
  RevokeMandateInput,
  PayoutInput,
  PayoutResult,
  GetPayoutInput,
  ProviderConfig,
  PaymentProviderCapabilities,
  CreatePaymentLinkInput,
  PaymentLinkResult,
  ProviderConfigSchema,
} from '@/types/provider';

// Re-export ProviderConfig for use in base class
export type { ProviderConfig, ProviderConfigSchema };

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
   * Credential fields this provider needs — drives the dashboard's
   * plug-and-play credential form and the "configured" check.
   */
  readonly configSchema?: ProviderConfigSchema;

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

  /**
   * Create a payment mandate — a standing authorization allowing
   * merchant-initiated debits (subscriptions / auto-deduct).
   * Optional - only providers supporting recurring payments implement this.
   */
  createMandate?(input: CreateMandateInput): Promise<MandateResult>;

  /**
   * Charge an active mandate (merchant-initiated transaction).
   * Optional - only providers supporting recurring payments implement this.
   */
  chargeMandate?(input: ChargeMandateInput): Promise<PaymentResult>;

  /**
   * Revoke a mandate, cancelling all future auto-deductions.
   * Optional - only providers supporting recurring payments implement this.
   */
  revokeMandate?(input: RevokeMandateInput): Promise<void>;

  /**
   * Create a payout — disburse funds to a customer's wallet
   * (e.g. EcoCash Enterprise Cash-In, Disburse Change, Merchant to Subscriber).
   * Optional - only providers supporting disbursements implement this.
   */
  createPayout?(input: PayoutInput): Promise<PayoutResult>;

  /**
   * Look up a payout/transaction by the merchant's external reference.
   * Optional - only providers supporting disbursements implement this.
   */
  getPayout?(input: GetPayoutInput): Promise<PayoutResult>;

  /**
   * Create a payment link — shareable URL for invoices, campaigns, events.
   * Optional - only providers supporting Pay by Link implement this.
   */
  createPaymentLink?(input: CreatePaymentLinkInput): Promise<PaymentLinkResult>;

  /**
   * Get payment link status — active, paid, expired or deactivated.
   */
  getPaymentLink?(linkId: string): Promise<PaymentLinkResult>;

  /**
   * Deactivate a payment link so it can no longer be used.
   */
  deactivatePaymentLink?(linkId: string): Promise<void>;
}
