export interface CreatePaymentInput {
  amount: number;
  currency: string;
  reference: string;
  returnUrl?: string;
  cancelUrl?: string;
  customerEmail?: string;
  customerPhone?: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
  paymentMethodId?: string;
}

export interface Payment {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  checkoutUrl?: string;
  createdAt: string;
}

export interface CreateRefundInput {
  paymentId: string;
  amount: number;
  currency: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  reason?: string;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  provider: string;
  type: string;
  supportedCurrencies: string[];
  minAmount: number;
  maxAmount?: number;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookInput {
  url: string;
  events: string[];
}

export interface ZeePayConfig {
  apiKey: string;
  apiUrl?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ListPaymentsOptions {
  limit?: number;
  offset?: number;
  status?: string;
}

export interface ListPaymentsResponse {
  data: Payment[];
  pagination: {
    limit: number;
    offset: number;
    count: number;
  };
}

// --- Subscriptions (auto-deduct) ---

export type BillingInterval = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type SubscriptionStatus =
  | 'pending'
  | 'active'
  | 'past_due'
  | 'paused'
  | 'cancelled';

export interface CreateSubscriptionInput {
  merchantReference: string;
  description?: string;
  amount: number;
  currency: string;
  interval: BillingInterval;
  intervalCount?: number;
  methodCode: string;
  customerEmail?: string;
  customerPhone?: string;
  returnUrl?: string;
  cancelUrl?: string;
  startDate?: string;
  endDate?: string;
  maxRetries?: number;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}

export interface Subscription {
  id: string;
  reference: string;
  description?: string;
  amount: number;
  currency: string;
  interval: BillingInterval;
  intervalCount: number;
  status: SubscriptionStatus;
  methodCode: string;
  customerEmail?: string;
  customerPhone?: string;
  nextBillingDate?: string;
  lastBilledAt?: string;
  approvalUrl?: string;
  mandateId: string;
  createdAt: string;
}

export interface ListSubscriptionsOptions {
  limit?: number;
  offset?: number;
  status?: string;
}

export interface ListSubscriptionsResponse {
  data: Subscription[];
  pagination: {
    limit: number;
    offset: number;
    count: number;
  };
}
