// Database model types

export interface Merchant {
  id: string;
  business_name: string;
  business_email: string;
  business_phone?: string;
  country: string;
  currency: string;
  status: 'pending' | 'active' | 'suspended' | 'deleted';
  verification_status: 'unverified' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface MerchantUser {
  id: string;
  merchant_id: string;
  email: string;
  password_hash: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  merchant_id: string;
  key_hash: string;
  key_prefix: string;
  environment: 'test' | 'live';
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
  expires_at?: string;
}

export interface PaymentProvider {
  id: string;
  name: string;
  provider_type: string;
  supports_test: boolean;
  supports_live: boolean;
  capabilities: Record<string, any>;
  config_schema: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  provider_id: string;
  method_code: string;
  display_name: string;
  supported_currencies: string[];
  min_amount: number;
  max_amount?: number;
  is_active: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  merchant_id: string;
  merchant_reference: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  checkout_url?: string;
  return_url?: string;
  cancel_url?: string;
  customer_email?: string;
  customer_phone?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface PaymentAttempt {
  id: string;
  payment_id: string;
  provider_id: string;
  payment_method_id?: string;
  provider_reference?: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  error_message?: string;
  error_code?: string;
  provider_response?: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface Refund {
  id: string;
  payment_id: string;
  payment_attempt_id?: string;
  amount: number;
  currency: string;
  reason?: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  provider_reference?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface WebhookEndpoint {
  id: string;
  merchant_id: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookEvent {
  id: string;
  event_type: string;
  data: Record<string, any>;
  created_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_endpoint_id: string;
  webhook_event_id: string;
  status: 'pending' | 'delivered' | 'failed';
  http_status_code?: number;
  response_body?: string;
  attempt_count: number;
  next_retry_at?: string;
  created_at: string;
  delivered_at?: string;
}
