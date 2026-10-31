<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ZeePay Project Information

## Build Commands

- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## SDK Build Commands

- `cd sdk && npm run build` - Build the TypeScript SDK

## Database Setup

1. Create a Supabase project
2. Run the schema from `src/lib/database/schema.sql` in the Supabase SQL editor
3. Set environment variables in `.env.local`

## Environment Variables

Required environment variables (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `JWT_SECRET` - Secret for JWT token generation
- `ENCRYPTION_KEY` - Key for encrypting sensitive data
- `NODE_ENV` - Environment (development/production)

## Key Architecture Patterns

### Provider Adapter Pattern
All payment providers implement the `PaymentProvider` interface defined in `src/lib/providers/interface.ts`. This allows adding new providers without changing the core payment engine.

### Idempotency
All create operations support idempotency keys to prevent duplicate charges. Implementation in `src/lib/utils/idempotency.ts`.

### State Machine
Payment state transitions are managed by a state machine in `src/lib/services/state-machine.ts` to ensure only valid transitions occur.

### Webhook Delivery
Webhooks are delivered with retries using exponential backoff. Signatures are verified using HMAC-SHA256. Implementation in `src/lib/webhooks/delivery.ts`.

### Provider plug-and-play (simulation mode)
Every provider adapter declares a `configSchema` (credential fields with `required`/`secret` flags). When a merchant has NOT saved credentials, `shouldSimulate()` in `src/lib/providers/base.ts` returns true and the provider answers with simulated results (PIN-prompt style: `processing` → `succeeded`). Saving credentials via `PUT /api/v1/provider-accounts` (AES-256-GCM into `merchant_provider_accounts`) switches the same code paths to the real gateway instantly. `GET /api/v1/provider-accounts` lists providers + config status; `POST` with `{action:'test'}` runs a health check; `DELETE` deactivates. Dashboard UI: Settings → Payment Providers tab. Live environment NEVER simulates.

Registered providers: mock, ecocash, innbucks, omari, onemoney, mtn-momo, mpesa, opay, palmpay, zelle, cashapp, visa, mastercard, zimswitch.

- `POST /api/v1/payments` resolves the provider via `paymentMethodId` → `payment_methods` → registry (mock when no method given).
- `POST /api/v1/checkout/:id/pay` accepts `paymentMethodId` + `customerPhone` (or `savedPaymentMethodId` for one-click). `GET /api/v1/checkout/:id` returns the public method catalogue and polls the provider once per request to resolve in-flight payments.
- `POST /api/v1/provider-webhooks/:provider` is the generic inbound receiver (EcoCash has its own correlator-keyed route that takes precedence).

### EcoCash Provider (real API)
`src/lib/providers/ecocash/ecocash-provider.ts` implements the real EcoCash developer API: Online Payments (Basic auth, `/payment/v1/transactions/amount/` + `/refund/`, lookup keyed on `endUserId`+`clientCorrelator`) for collections, and the shared EPG `/api/serviceRequest` endpoint (`X-Client-Id`/`X-Client-Secret` headers + channel API user) for disbursements — `ENTERPRISECASHINV2`, `CHANGEDISBURSEV2`, `MERCHTOSUBV2`, `EXTERNALTRANSACTIONLOOKUP`. Provider references encode `correlator|msisdn` for lookups. Merchant provider credentials live in `merchant_provider_accounts.credentials_encrypted` (AES-256-GCM via `src/lib/utils/crypto.ts`).

### Card Processing (ZimSwitch Online)
`src/lib/providers/cards/zimswitch-provider.ts` implements the ZimSwitch Online gateway API (ACI/OPE-style): `POST /v1/checkouts` → hosted COPYandPAY widget (low PCI scope), `GET /v1/checkouts/{id}/payment` verify, `POST /v1/payments/{id}` RF refunds, `createRegistration` tokenization + `/v1/registrations/{id}/payments` for recurring MIT debits. Auth: Bearer token + `entityId` — both issued by an acquiring bank. ZimSwitch Online handles domestic ZimSwitch cards + international Visa/Mastercard through one integration.

### Payouts / Disbursements
`src/lib/services/payout-service.ts` + `POST/GET /api/v1/payouts` (+`/payouts/:externalReference` lookup). `externalReference` is the idempotency key (unique per merchant).

### Subscriptions / Auto-Deduct
Recurring billing is implemented via **payment mandates** — standing authorizations the customer approves once, after which ZeePay debits automatically (including mobile money methods with no native recurring support). Service: `src/lib/services/subscription-service.ts`. Provider mandate methods: `createMandate`, `chargeMandate`, `revokeMandate` on the `PaymentProvider` interface. The billing engine runs via `POST /api/v1/subscriptions/process-due` (secured by `CRON_SECRET` env, schedule hourly).

## Testing

Use the payment simulator at `/dashboard/simulator` to test payment scenarios without processing real money.

## API Documentation

Complete OpenAPI specification available in `docs/openapi.yaml`.
