// Subscription and mandate types for recurring auto-deduct billing

export type BillingInterval = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type SubscriptionStatus =
  | 'pending'      // Awaiting customer mandate approval
  | 'active'       // Auto-deduct enabled, billing on schedule
  | 'past_due'     // Last charge failed, retrying
  | 'paused'       // Merchant paused billing
  | 'cancelled';   // Terminated (by merchant, customer, or retries exhausted)

// --- Subscription plans (reusable billing templates) ---

export interface CreatePlanInput {
  name: string;
  description?: string;
  amount: number;
  currency: string;
  interval: BillingInterval;
  intervalCount?: number;
  metadata?: Record<string, any>;
}

export interface SubscriptionPlanResponse {
  id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  interval: BillingInterval;
  intervalCount: number;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface CreateSubscriptionInput {
  merchantReference: string;
  description?: string;
  // Optional when planId is supplied — values resolve from the plan
  amount?: number;
  currency?: string;
  interval?: BillingInterval;
  intervalCount?: number;
  planId?: string; // subscribe the customer to an existing plan
  // Subscribe using an already-tokenised payment method — skips the
  // mandate approval step entirely (customer authorised once already)
  savedPaymentMethodId?: string;
  methodCode?: string; // ecocash, innbucks, omari, zimswitch, mock — optional with savedPaymentMethodId
  customerId?: string;
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
  planId?: string;
  savedPaymentMethodId?: string;
  createdAt: string;
}

export interface ProcessDueResult {
  processed: number;
  succeeded: number;
  failed: number;
  cancelled: number;
  errors: { subscriptionId: string; error: string }[];
}
