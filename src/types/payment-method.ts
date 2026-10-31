// Types for customers, tokenised (saved) payment methods and one-click payments

export type SavedPaymentMethodStatus = 'pending' | 'active' | 'revoked' | 'failed';
export type SavedPaymentMethodType = 'card' | 'wallet' | 'mobile_money';

// --- Customers ---

export interface CustomerInput {
  externalReference?: string; // merchant's own customer id (idempotent key)
  email?: string;
  phone?: string;
  name?: string;
  metadata?: Record<string, any>;
}

export interface CustomerResponse {
  id: string;
  reference?: string;
  email?: string;
  phone?: string;
  name?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// --- Saved (tokenised) payment methods ---

/**
 * Input for tokenising a payment method. The customer completes a
 * one-time authorisation (hosted widget / PIN prompt); ZeePay stores
 * only the provider token reference + display metadata — never PAN/CVV.
 */
export interface RegisterPaymentMethodInput {
  methodCode: string; // zimswitch | visa | mastercard | ecocash | mock ...
  type?: SavedPaymentMethodType;
  customerId?: string; // existing ZeePay customer id
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  customerReference?: string; // merchant-side customer id — get-or-create
  amount?: number; // optional initial authorisation amount
  currency?: string;
  reference?: string;
  returnUrl?: string;
  cancelUrl?: string;
  label?: string;
  setAsDefault?: boolean;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}

export interface SavedPaymentMethodResponse {
  id: string;
  customerId?: string;
  methodCode: string;
  provider: string;
  type: SavedPaymentMethodType;
  status: SavedPaymentMethodStatus;
  cardBrand?: string;
  cardLast4?: string;
  cardExpMonth?: string;
  cardExpYear?: string;
  cardHolder?: string;
  label?: string;
  isDefault: boolean;
  approvalUrl?: string;
  customerEmail?: string;
  customerPhone?: string;
  createdAt: string;
  activatedAt?: string;
}

export interface UpdatePaymentMethodInput {
  label?: string;
  setAsDefault?: boolean;
}

// --- One-click payments ---

/** Charge a previously tokenised payment method (no card re-entry). */
export interface ChargeSavedMethodInput {
  savedPaymentMethodId: string;
  amount: number;
  currency: string;
  reference: string;
  returnUrl?: string;
  customerEmail?: string;
  customerPhone?: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}
