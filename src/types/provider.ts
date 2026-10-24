// Payment provider types and interfaces

export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
export type RefundStatus = 'pending' | 'processing' | 'succeeded' | 'failed';

export interface CreatePaymentInput {
  amount: number;
  currency: string;
  reference: string;
  returnUrl?: string;
  cancelUrl?: string;
  customerEmail?: string;
  customerPhone?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  id: string;
  providerReference: string;
  status: PaymentStatus;
  checkoutUrl?: string;
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
  providerResponse?: Record<string, any>;
}

export interface GetPaymentInput {
  providerReference: string;
}

export interface RefundPaymentInput {
  paymentReference: string;
  amount: number;
  currency: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface RefundResult {
  id: string;
  providerReference: string;
  status: RefundStatus;
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
  providerResponse?: Record<string, any>;
}

// --- Mandates (recurring debit authorizations) ---

export type MandateStatus = 'pending' | 'active' | 'revoked' | 'failed';

/**
 * Input for creating a payment mandate — a standing authorization
 * that allows merchant-initiated debits (auto-deduct).
 */
export interface CreateMandateInput {
  reference: string;
  amount: number;
  currency: string;
  interval: string;
  customerEmail?: string;
  customerPhone?: string;
  returnUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, any>;
}

export interface MandateResult {
  id: string;
  providerReference: string;
  status: MandateStatus;
  approvalUrl?: string;
  metadata?: Record<string, any>;
  providerResponse?: Record<string, any>;
}

/**
 * Input for a merchant-initiated charge against an active mandate.
 * This is the "auto-deduct" — no customer interaction required.
 */
export interface ChargeMandateInput {
  mandateReference: string;
  amount: number;
  currency: string;
  reference: string;
  metadata?: Record<string, any>;
}

export interface RevokeMandateInput {
  mandateReference: string;
  reason?: string;
}

// --- Payouts (disbursements to customer wallets) ---

export type PayoutServiceType =
  | 'enterprise_cash_in'      // Bulk disbursement into customer wallets
  | 'change_disbursement'     // POS change paid into the wallet
  | 'merchant_to_subscriber'; // Merchant payout to a subscriber

/**
 * Input for a disbursement — sending money out to a customer.
 */
export interface PayoutInput {
  serviceType: PayoutServiceType;
  amount: number;
  currency: string;
  recipientMsisdn: string;
  externalReference?: string;
  beneficiaryReference?: string;
  transferReference?: string;
  terminalId?: string;
  merchantName?: string;
  walletId?: string;
  metadata?: Record<string, any>;
}

export interface PayoutResult {
  id: string;
  providerReference: string;
  externalReference: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  amount: number;
  currency: string;
  recipientMsisdn: string;
  serviceType: string;
  metadata?: Record<string, any>;
  providerResponse?: Record<string, any>;
}

export interface GetPayoutInput {
  externalTransactionId: string;
  msisdn: string;
  currency: string;
}

export interface ProviderCredentials {
  [key: string]: string | number | boolean;
}

export interface ProviderConfig {
  credentials: ProviderCredentials;
  environment: 'test' | 'live';
}

export interface PaymentProviderCapabilities {
  createPayment: boolean;
  getPayment: boolean;
  refundPayment: boolean;
  supportsWebhooks: boolean;
  supportsRecurring: boolean;
  /** Provider can send money out to customers (disbursements) */
  createPayout?: boolean;
}
