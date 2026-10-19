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

## Testing

Use the payment simulator at `/dashboard/simulator` to test payment scenarios without processing real money.

## API Documentation

Complete OpenAPI specification available in `docs/openapi.yaml`.
