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

-- Drop existing function (CASCADE: dependent triggers are recreated below)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

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

-- ============================================================
-- Seed: payment providers (idempotent upserts)
-- ============================================================

INSERT INTO payment_providers (name, provider_type, supports_test, supports_live, capabilities, config_schema)
VALUES
  ('ecocash', 'mobile_money', true, true,
   '{"createPayment": true, "getPayment": true, "refundPayment": true, "supportsWebhooks": true, "supportsRecurring": true, "createPayout": true}',
   '{
     "onlineUsername": {"label": "Instant Payment username", "required": true},
     "onlinePassword": {"label": "Instant Payment password", "required": true, "secret": true},
     "merchantCode": {"label": "Merchant code", "required": true},
     "merchantNumber": {"label": "Merchant MSISDN (263...)", "required": true},
     "merchantPin": {"label": "Merchant PIN", "required": true, "secret": true},
     "clientId": {"label": "EPG X-Client-Id", "required": false},
     "clientSecret": {"label": "EPG X-Client-Secret", "required": false, "secret": true},
     "username": {"label": "EPG channel API user", "required": false},
     "password": {"label": "EPG channel password", "required": false, "secret": true},
     "encryptionKey": {"label": "EPG encryption key", "required": false, "secret": true},
     "terminalId": {"label": "Terminal ID", "required": false},
     "location": {"label": "Merchant location", "required": false},
     "merchantName": {"label": "Merchant display name", "required": false}
   }')
ON CONFLICT (name) DO UPDATE SET
  provider_type = EXCLUDED.provider_type,
  capabilities = EXCLUDED.capabilities,
  config_schema = EXCLUDED.config_schema;

INSERT INTO payment_providers (name, provider_type, supports_test, supports_live, capabilities, config_schema)
VALUES
  ('innbucks', 'mobile_money', true, false,
   '{"createPayment": true, "getPayment": true, "refundPayment": true, "supportsWebhooks": true, "supportsRecurring": true, "createPayout": false}',
   '{
     "apiKey": {"label": "API key", "required": true, "secret": true},
     "merchantId": {"label": "Merchant ID", "required": true}
   }'),
  ('omari', 'mobile_money', true, false,
   '{"createPayment": true, "getPayment": true, "refundPayment": true, "supportsWebhooks": true, "supportsRecurring": true, "createPayout": true}',
   '{
     "apiKey": {"label": "API key", "required": true, "secret": true},
     "merchantCode": {"label": "Merchant code", "required": true}
   }'),
  ('visa', 'card', true, false,
   '{"createPayment": true, "getPayment": true, "refundPayment": true, "supportsWebhooks": true, "supportsRecurring": true, "createPayout": false}',
   '{
     "apiKey": {"label": "API key", "required": true, "secret": true},
     "merchantId": {"label": "Merchant ID", "required": true}
   }'),
  ('mastercard', 'card', true, false,
   '{"createPayment": true, "getPayment": true, "refundPayment": true, "supportsWebhooks": true, "supportsRecurring": true, "createPayout": false}',
   '{
     "apiKey": {"label": "API key", "required": true, "secret": true},
     "merchantId": {"label": "Merchant ID", "required": true}
   }'),
  ('mock', 'mock', true, false,
   '{"createPayment": true, "getPayment": true, "refundPayment": true, "supportsWebhooks": true, "supportsRecurring": true, "createPayout": false}',
   '{}')
ON CONFLICT (name) DO UPDATE SET
  provider_type = EXCLUDED.provider_type,
  capabilities = EXCLUDED.capabilities,
  config_schema = EXCLUDED.config_schema;

INSERT INTO payment_providers (name, provider_type, supports_test, supports_live, capabilities, config_schema)
VALUES
  ('zimswitch', 'card', true, true,
   '{"createPayment": true, "getPayment": true, "refundPayment": true, "supportsWebhooks": true, "supportsRecurring": true, "createPayout": false}',
   '{
     "entityId": {"label": "Entity ID (issued by acquiring bank)", "required": true},
     "accessToken": {"label": "Bearer access token", "required": true, "secret": true}
   }')
ON CONFLICT (name) DO UPDATE SET
  provider_type = EXCLUDED.provider_type,
  capabilities = EXCLUDED.capabilities,
  config_schema = EXCLUDED.config_schema;

-- ============================================================
-- SMS Gateway (bulk SMS via HTTP + SMPP transports)
-- ============================================================

-- SMS batches table (bulk campaign records)
CREATE TABLE IF NOT EXISTS sms_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  provider_name VARCHAR(50) NOT NULL, -- sms-http, sms-smpp
  external_reference VARCHAR(255) NOT NULL, -- merchant batch reference (idempotency key)
  sender_id VARCHAR(15),
  message_text TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'processing', -- processing, completed, completed_with_errors, failed
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(merchant_id, external_reference)
);

-- SMS messages table (per-recipient message records)
CREATE TABLE IF NOT EXISTS sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  provider_name VARCHAR(50) NOT NULL, -- sms-http, sms-smpp
  batch_id UUID REFERENCES sms_batches(id) ON DELETE SET NULL,
  external_reference VARCHAR(255) NOT NULL, -- merchant reference (idempotency key)
  provider_reference VARCHAR(255), -- gateway message_id / submit_sm id
  recipient_msisdn VARCHAR(20) NOT NULL,
  sender_id VARCHAR(15),
  message_text TEXT NOT NULL,
  segments INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'queued', -- queued, sent, delivered, failed, rejected
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(merchant_id, external_reference)
);

CREATE INDEX IF NOT EXISTS idx_sms_messages_merchant ON sms_messages(merchant_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_status ON sms_messages(status);
CREATE INDEX IF NOT EXISTS idx_sms_messages_batch ON sms_messages(batch_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_provider_ref ON sms_messages(provider_reference);
CREATE INDEX IF NOT EXISTS idx_sms_batches_merchant ON sms_batches(merchant_id);

-- SMS gateway provider registrations
INSERT INTO payment_providers (name, provider_type, supports_test, supports_live, capabilities, config_schema)
VALUES
  ('sms-http', 'sms', true, true,
   '{"sendSms": true, "bulkSend": true, "getDeliveryStatus": true, "supportsDeliveryReports": true}',
   '{
     "endpoint": {"label": "Submit endpoint URL", "required": true},
     "statusEndpoint": {"label": "Status polling URL base", "required": false},
     "accessToken": {"label": "Bearer access token", "required": false, "secret": true},
     "username": {"label": "Basic auth username", "required": false},
     "password": {"label": "Basic auth password", "required": false, "secret": true},
     "authHeader": {"label": "Custom auth header name", "required": false},
     "defaultSenderId": {"label": "Default sender ID", "required": false},
     "bodyFormat": {"label": "Body format (json|form)", "required": false}
   }'),
  ('sms-smpp', 'sms', true, true,
   '{"sendSms": true, "bulkSend": true, "getDeliveryStatus": false, "supportsDeliveryReports": true}',
   '{
     "host": {"label": "SMSC host", "required": true},
     "port": {"label": "SMSC port", "required": false},
     "systemId": {"label": "SMPP system_id", "required": true},
     "password": {"label": "SMPP password", "required": true, "secret": true},
     "systemType": {"label": "SMPP system_type", "required": false},
     "defaultSenderId": {"label": "Default source address", "required": false},
     "sourceAddrTon": {"label": "Source TON", "required": false},
     "sourceAddrNpi": {"label": "Source NPI", "required": false},
     "destAddrTon": {"label": "Destination TON", "required": false},
     "destAddrNpi": {"label": "Destination NPI", "required": false}
   }')
ON CONFLICT (name) DO UPDATE SET
  provider_type = EXCLUDED.provider_type,
  capabilities = EXCLUDED.capabilities,
  config_schema = EXCLUDED.config_schema;

-- ============================================================
-- Tokenisation: customers & saved payment methods
-- ============================================================

-- Customers — merchant-scoped payer records that saved payment
-- methods, payments and subscriptions are associated with.
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  external_reference VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  name VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(merchant_id, external_reference)
);

-- Saved payment methods — tokenised instruments (card registrations,
-- wallet mandates) stored as provider token references. Raw PAN/CVV
-- is never stored; only provider token + display metadata (brand/last4).
CREATE TABLE IF NOT EXISTS saved_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  mandate_id UUID REFERENCES payment_mandates(id) ON DELETE SET NULL,
  provider_name VARCHAR(50) NOT NULL,
  method_code VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'card',
  provider_reference VARCHAR(255),
  card_brand VARCHAR(50),
  card_last4 VARCHAR(4),
  card_exp_month VARCHAR(2),
  card_exp_year VARCHAR(4),
  card_holder VARCHAR(255),
  label VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, active, revoked, failed
  is_default BOOLEAN NOT NULL DEFAULT false,
  approval_url VARCHAR(500),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  activated_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription plans — reusable billing templates merchants subscribe
-- customers to. Amount/currency/interval defined once, referenced by
-- subscriptions.
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(500),
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  interval VARCHAR(20) NOT NULL,
  interval_count INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link subscriptions to their plan and (optionally) the saved payment
-- method they bill against; locked_at guards against concurrent
-- billing runs double-charging the same subscription.
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES subscription_plans(id);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS saved_payment_method_id UUID REFERENCES saved_payment_methods(id);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE;

-- Link payments to the customer + saved payment method used
-- (one-click / token-based charges).
ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS saved_payment_method_id UUID REFERENCES saved_payment_methods(id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_customers_merchant_id') THEN
    CREATE INDEX idx_customers_merchant_id ON customers(merchant_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_customers_email') THEN
    CREATE INDEX idx_customers_email ON customers(merchant_id, email);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_saved_pm_merchant_id') THEN
    CREATE INDEX idx_saved_pm_merchant_id ON saved_payment_methods(merchant_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_saved_pm_customer_id') THEN
    CREATE INDEX idx_saved_pm_customer_id ON saved_payment_methods(customer_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_saved_pm_status') THEN
    CREATE INDEX idx_saved_pm_status ON saved_payment_methods(status);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_subscription_plans_merchant_id') THEN
    CREATE INDEX idx_subscription_plans_merchant_id ON subscription_plans(merchant_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_subscriptions_plan_id') THEN
    CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_saved_payment_methods_updated_at ON saved_payment_methods;
CREATE TRIGGER update_saved_payment_methods_updated_at BEFORE UPDATE ON saved_payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
