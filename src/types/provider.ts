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
  // Server-to-server card data (PCI DSS compliance required)
  cardData?: {
    number: string;
    holder: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  };
  // Payment type: DB (debit), PA (pre-auth), CP (capture), RF (refund)
  paymentType?: 'DB' | 'PA' | 'CP' | 'RF';
}

export interface PaymentResult {
  id: string;
  providerReference: string;
  status: PaymentStatus;
  checkoutUrl?: string;
  /** Async (3DS/issuer validation) redirect returned by S2S flows —
   * the browser must submit these parameters to url via method. */
  redirect?: {
    url: string;
    method: 'GET' | 'POST';
    parameters?: Record<string, string>;
  };
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
  providerResponse?: Record<string, any>;
}

export interface GetPaymentInput {
  providerReference: string;
  /** Gateway-supplied verify path (e.g. paybylink/v1/{id}/checkouts/{id}/payment)
   * returned on the shopper redirect — query it verbatim when present. */
  resourcePath?: string;
}

export interface RefundPaymentInput {
  paymentReference: string;
  amount: number;
  currency: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface CreatePaymentLinkInput {
  amount: number;
  currency: string;
  reference: string;
  description?: string;
  expiryDate?: string;
  /** HTTPS redirect target after the customer pays on the hosted page */
  shopperResultUrl?: string;
  /** Link validity — gateway defaults to 90 days when omitted */
  validUntil?: number;
  validUntilUnit?: 'HOUR' | 'DAY';
  /** Request a qrCode in the response for in-person sharing */
  createQRCode?: boolean;
  customerEmail?: string;
  customerPhone?: string;
  metadata?: Record<string, any>;
}

export interface PaymentLinkResult {
  id: string;
  providerReference: string;
  linkUrl: string;
  qrCode?: string;
  status: 'active' | 'expired' | 'paid' | 'cancelled';
  amount: number;
  currency: string;
  reference: string;
  expiryDate?: string;
  metadata?: Record<string, any>;
  providerResponse?: Record<string, any>;
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

/**
 * Declarative description of one credential field — used to render
 * the plug-and-play credential form on the dashboard and to decide
 * whether a provider is configured (all required fields present).
 */
export interface ProviderCredentialField {
  label: string;
  required?: boolean;
  /** Render as a password field; never echoed back in API responses */
  secret?: boolean;
  placeholder?: string;
  help?: string;
}

/** Credential field set a provider needs — keyed by credentials key. */
export type ProviderConfigSchema = Record<string, ProviderCredentialField>;

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
  /** Provider can create shareable payment links */
  createPaymentLink?: boolean;
}
