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
}
