-- ZeePay Database Schema Migration
-- This script uses IF NOT EXISTS to handle partial schema application

-- Drop existing triggers first (they will be recreated)
DROP TRIGGER IF EXISTS update_merchants_updated_at ON merchants;
DROP TRIGGER IF EXISTS update_merchant_users_updated_at ON merchant_users;
DROP TRIGGER IF EXISTS update_merchant_provider_accounts_updated_at ON merchant_provider_accounts;
DROP TRIGGER IF EXISTS update_payment_providers_updated_at ON payment_providers;
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
DROP TRIGGER IF EXISTS update_payment_attempts_updated_at ON payment_attempts;
DROP TRIGGER IF EXISTS update_refunds_updated_at ON refunds;
DROP TRIGGER IF EXISTS update_webhook_endpoints_updated_at ON webhook_endpoints;
DROP TRIGGER IF EXISTS update_settlement_records_updated_at ON settlement_records;

-- Drop existing function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Merchants table
CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name VARCHAR(255) NOT NULL,
  business_email VARCHAR(255) NOT NULL UNIQUE,
  business_phone VARCHAR(50),
  country VARCHAR(2) NOT NULL DEFAULT 'ZW',
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  verification_status VARCHAR(50) DEFAULT 'unverified',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Merchant users table
CREATE TABLE IF NOT EXISTS merchant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(merchant_id, email)
);

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  key_prefix VARCHAR(20) NOT NULL,
  environment VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Payment providers table
CREATE TABLE IF NOT EXISTS payment_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  provider_type VARCHAR(50) NOT NULL,
  supports_test BOOLEAN DEFAULT true,
  supports_live BOOLEAN DEFAULT false,
  capabilities JSONB DEFAULT '{}',
  config_schema JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Merchant provider accounts
CREATE TABLE IF NOT EXISTS merchant_provider_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES payment_providers(id),
  environment VARCHAR(20) NOT NULL,
  credentials_encrypted TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(merchant_id, provider_id, environment)
);

-- Payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES payment_providers(id),
  method_code VARCHAR(50) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  supported_currencies VARCHAR[] DEFAULT '{USD}',
  min_amount DECIMAL(12, 2) DEFAULT 0.01,
  max_amount DECIMAL(12, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_id, method_code)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  merchant_reference VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  checkout_url VARCHAR(500),
  return_url VARCHAR(500),
  cancel_url VARCHAR(500),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Payment attempts table
CREATE TABLE IF NOT EXISTS payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES payment_providers(id),
  payment_method_id UUID REFERENCES payment_methods(id),
  provider_reference VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  error_message TEXT,
  error_code VARCHAR(100),
  provider_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Refunds table
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id),
  payment_attempt_id UUID REFERENCES payment_attempts(id),
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  reason VARCHAR(500),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  provider_reference VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Webhook endpoints table
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  secret VARCHAR(255) NOT NULL,
  events VARCHAR[] NOT NULL DEFAULT '{payment.succeeded,payment.failed,payment.refunded}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook events table
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook deliveries table
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  webhook_event_id UUID NOT NULL REFERENCES webhook_events(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  http_status_code INTEGER,
  response_body TEXT,
  attempt_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Idempotency keys table
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  idempotency_key VARCHAR(255) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(merchant_id, idempotency_key)
);

-- Settlement records table
CREATE TABLE IF NOT EXISTS settlement_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  provider_id UUID NOT NULL REFERENCES payment_providers(id),
  settlement_reference VARCHAR(255) NOT NULL,
  settlement_date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  fee_amount DECIMAL(12, 2) NOT NULL,
  net_amount DECIMAL(12, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  transaction_count INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id),
  user_id UUID REFERENCES merchant_users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes (IF NOT EXISTS is not supported for indexes in PostgreSQL, so we check first)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_merchant_id') THEN
    CREATE INDEX idx_payments_merchant_id ON payments(merchant_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_status') THEN
    CREATE INDEX idx_payments_status ON payments(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_merchant_reference') THEN
    CREATE INDEX idx_payments_merchant_reference ON payments(merchant_reference);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payment_attempts_payment_id') THEN
    CREATE INDEX idx_payment_attempts_payment_id ON payment_attempts(payment_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payment_attempts_provider_reference') THEN
    CREATE INDEX idx_payment_attempts_provider_reference ON payment_attempts(provider_reference);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_webhook_deliveries_endpoint_id') THEN
    CREATE INDEX idx_webhook_deliveries_endpoint_id ON webhook_deliveries(webhook_endpoint_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_webhook_deliveries_status') THEN
    CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_idempotency_keys_key') THEN
    CREATE INDEX idx_idempotency_keys_key ON idempotency_keys(idempotency_key);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_settlement_records_merchant_id') THEN
    CREATE INDEX idx_settlement_records_merchant_id ON settlement_records(merchant_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_logs_merchant_id') THEN
    CREATE INDEX idx_audit_logs_merchant_id ON audit_logs(merchant_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_logs_created_at') THEN
    CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
  END IF;
END $$;

-- Trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchant_users_updated_at BEFORE UPDATE ON merchant_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchant_provider_accounts_updated_at BEFORE UPDATE ON merchant_provider_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_providers_updated_at BEFORE UPDATE ON payment_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_attempts_updated_at BEFORE UPDATE ON payment_attempts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON refunds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_endpoints_updated_at BEFORE UPDATE ON webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settlement_records_updated_at BEFORE UPDATE ON settlement_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Subscriptions & mandates (recurring auto-deduct)
-- ============================================================

-- Payment mandates (standing authorizations for auto-deduct)
CREATE TABLE IF NOT EXISTS payment_mandates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  provider_id UUID REFERENCES payment_providers(id),
  provider_name VARCHAR(50) NOT NULL,
  provider_reference VARCHAR(255) NOT NULL,
  method_code VARCHAR(50) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  approval_url VARCHAR(500),
  approved_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions (recurring billing schedules)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  mandate_id UUID NOT NULL REFERENCES payment_mandates(id),
  merchant_reference VARCHAR(255) NOT NULL,
  description VARCHAR(500),
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  interval VARCHAR(20) NOT NULL,
  interval_count INTEGER NOT NULL DEFAULT 1,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  next_billing_date TIMESTAMP WITH TIME ZONE,
  last_billed_at TIMESTAMP WITH TIME ZONE,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription charges (links each auto-deduct attempt to a payment)
CREATE TABLE IF NOT EXISTS subscription_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id),
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  attempt_number INTEGER NOT NULL DEFAULT 1,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for subscriptions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payment_mandates_merchant_id') THEN
    CREATE INDEX idx_payment_mandates_merchant_id ON payment_mandates(merchant_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payment_mandates_status') THEN
    CREATE INDEX idx_payment_mandates_status ON payment_mandates(status);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_subscriptions_merchant_id') THEN
    CREATE INDEX idx_subscriptions_merchant_id ON subscriptions(merchant_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_subscriptions_status') THEN
    CREATE INDEX idx_subscriptions_status ON subscriptions(status);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_subscriptions_next_billing') THEN
    CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date) WHERE status = 'active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_subscription_charges_subscription_id') THEN
    CREATE INDEX idx_subscription_charges_subscription_id ON subscription_charges(subscription_id);
  END IF;
END $$;

-- Triggers for new tables
DROP TRIGGER IF EXISTS update_payment_mandates_updated_at ON payment_mandates;
CREATE TRIGGER update_payment_mandates_updated_at BEFORE UPDATE ON payment_mandates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_charges_updated_at ON subscription_charges;
CREATE TRIGGER update_subscription_charges_updated_at BEFORE UPDATE ON subscription_charges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Payouts (disbursements to customer wallets)
-- ============================================================

CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  provider_name VARCHAR(50) NOT NULL,
  service_type VARCHAR(50) NOT NULL,
  external_reference VARCHAR(255) NOT NULL,
  provider_reference VARCHAR(255),
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  recipient_msisdn VARCHAR(20) NOT NULL,
  beneficiary_reference VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(merchant_id, external_reference)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payouts_merchant_id') THEN
    CREATE INDEX idx_payouts_merchant_id ON payouts(merchant_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payouts_status') THEN
    CREATE INDEX idx_payouts_status ON payouts(status);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payouts_external_reference') THEN
    CREATE INDEX idx_payouts_external_reference ON payouts(external_reference);
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_payouts_updated_at ON payouts;
CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
