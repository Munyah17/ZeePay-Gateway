// Subscription and mandate types for recurring auto-deduct billing

export type BillingInterval = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type SubscriptionStatus =
  | 'pending'      // Awaiting customer mandate approval
  | 'active'       // Auto-deduct enabled, billing on schedule
  | 'past_due'     // Last charge failed, retrying
  | 'paused'       // Merchant paused billing
  | 'cancelled';   // Terminated (by merchant, customer, or retries exhausted)

export interface CreateSubscriptionInput {
  merchantReference: string;
  description?: string;
  amount: number;
  currency: string;
  interval: BillingInterval;
  intervalCount?: number;
  methodCode: string; // ecocash, innbucks, omari, visa, mastercard, mock
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

export interface SubscriptionResponse {
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

export interface ProcessDueResult {
  processed: number;
  succeeded: number;
  failed: number;
  cancelled: number;
  errors: { subscriptionId: string; error: string }[];
}
