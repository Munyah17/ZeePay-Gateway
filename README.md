# ZeePay

A unified payment gateway platform for Zimbabwe and African markets.

## Overview

ZeePay provides developers with a single API integration to accept payments through multiple payment methods including EcoCash, InnBucks, Omari, Visa, Mastercard, and more.

### Tagline

Payments without the pain.

### Key Features

- **Unified API**: One integration for multiple payment methods
- **Developer-Friendly**: Simple SDK, clear documentation, payment simulator
- **Reliable**: Idempotency, webhooks with retries, transaction state management
- **Transparent**: Clear pricing, detailed transaction records
- **SaaS-Ready**: Built for subscription billing and recurring payments

## Tech Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, TypeScript
- **Database**: PostgreSQL via Supabase
- **Authentication**: API keys, JWT tokens
- **Deployment**: Vercel (recommended)

## Project Structure

```
zeepay/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/v1/            # API endpoints
│   │   │   ├── payments/      # Payment endpoints
│   │   │   ├── refunds/       # Refund endpoints
│   │   │   ├── webhooks/      # Webhook endpoints
│   │   │   ├── payment-methods/
│   │   │   └── simulator/     # Payment simulator
│   │   ├── checkout/          # Hosted checkout pages
│   │   └── dashboard/         # Merchant dashboard
│   ├── lib/
│   │   ├── auth/              # Authentication utilities
│   │   ├── database/          # Database client & schema
│   │   ├── providers/         # Payment provider adapters
│   │   ├── services/          # Business logic services
│   │   ├── utils/             # Utility functions
│   │   └── webhooks/          # Webhook engine
│   └── types/                 # TypeScript type definitions
├── sdk/                       # JavaScript/TypeScript SDK
├── docs/                      # Documentation
│   └── openapi.yaml          # OpenAPI specification
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account (for database)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd zeepay
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file (see `.env.example` for reference):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here
NODE_ENV=development
```

4. Set up the database:
```bash
# Apply the database schema
# Copy the contents of src/lib/database/schema.sql and run it in your Supabase SQL editor
```

5. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## API Documentation

### Quick Start

```typescript
import ZeePay from 'zeepay-sdk';

const zeePay = new ZeePay({
  apiKey: 'zp_test_your_api_key_here'
});

const payment = await zeePay.payments.create({
  amount: 10,
  currency: 'USD',
  reference: 'invoice_1042'
});

console.log(payment.checkoutUrl);
// Redirect customer to payment.checkoutUrl
```

### API Endpoints

#### Payments
- `POST /api/v1/payments` - Create a payment
- `GET /api/v1/payments` - List payments
- `GET /api/v1/payments/:id` - Get a payment
- `POST /api/v1/payments/:id` - Cancel a payment

#### Refunds
- `POST /api/v1/refunds` - Create a refund
- `GET /api/v1/refunds/:id` - Get a refund

#### Payment Methods
- `GET /api/v1/payment-methods` - List available payment methods

#### Webhooks
- `POST /api/v1/webhooks` - Create webhook endpoint
- `GET /api/v1/webhooks` - List webhooks
- `GET /api/v1/webhooks/:id` - Get webhook
- `PATCH /api/v1/webhooks/:id` - Update webhook
- `DELETE /api/v1/webhooks/:id` - Delete webhook
- `GET /api/v1/webhooks/:id/deliveries` - Get webhook delivery history

For complete API documentation, see [docs/openapi.yaml](docs/openapi.yaml)

## Payment Methods

### Priority 0 (Initial Release)
- EcoCash
- InnBucks
- Omari
- Visa
- Mastercard

### Priority 1 (Near-term)
- M-Pesa
- MTN MoMo

### Priority 2 (Future)
- American Express
- UnionPay
- PalmPay
- OPay
- Wise
- Cash App

## Core Components

### 1. Payment API
Creates and retrieves payments with idempotency support.

### 2. Hosted Checkout
Mobile-first payment page with payment method selection.

### 3. Webhook Engine
Signed, retryable webhook delivery with event history.

### 4. Merchant Dashboard
- Overview with payment statistics
- Transaction management
- API key management
- Webhook configuration

### 5. Provider Adapters
Extensible provider interface for adding new payment methods.

### 6. Payment Simulator
Test payment scenarios without processing real money.

## Database Schema

Key tables:
- `merchants` - Merchant accounts
- `merchant_users` - Dashboard users
- `api_keys` - API key management
- `payments` - Canonical payment records
- `payment_attempts` - Individual payment attempts
- `refunds` - Refund records
- `webhook_endpoints` - Webhook configuration
- `webhook_events` - Durable event records
- `webhook_deliveries` - Delivery tracking
- `idempotency_keys` - Duplicate request protection

See [src/lib/database/schema.sql](src/lib/database/schema.sql) for complete schema.

## SDK Usage

### Installation

```bash
npm install zeepay-sdk
```

### Example

```typescript
import ZeePay from 'zeepay-sdk';

const zeePay = new ZeePay({
  apiKey: process.env.ZEEPAY_API_KEY
});

// Create payment
const payment = await zeePay.payments.create({
  amount: 10,
  currency: 'USD',
  reference: 'invoice_1042',
  returnUrl: 'https://myapp.com/success',
  cancelUrl: 'https://myapp.com/cancel'
});

// Redirect to checkout
window.location.href = payment.checkoutUrl;
```

See [sdk/README.md](sdk/README.md) for complete SDK documentation.

## Webhook Integration

### Setting Up Webhooks

```typescript
const webhook = await zeePay.webhooks.create({
  url: 'https://myapp.com/webhooks/zeepay',
  events: ['payment.succeeded', 'payment.failed', 'payment.refunded']
});

// Save webhook.secret securely
console.log(webhook.secret);
```

### Verifying Webhook Signatures

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')}`;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Security

- API keys are hashed using bcrypt
- Webhook signatures use HMAC-SHA256
- Sensitive data is encrypted at rest
- All API requests require authentication
- Idempotency keys prevent duplicate charges

## Architecture

```
Merchant Application
         |
         | ZeePay API
         v
    ZeePay API Layer
         |
    Payment Engine
         |
    Payment Router
    /      |      \
Cards  Mobile Money  Wallets
  |        |          |
Acquirer  EcoCash   Other
  |      InnBucks  Providers
  v        v          v
Payment Providers
         |
    Confirmed Result
         |
    ZeePay Webhooks
         |
         v
Merchant Application
```

## Roadmap

### Milestone 1: ZeePay Core ✅
- Merchant registration
- Test and live environments
- API key generation
- Payment creation and retrieval
- Hosted checkout
- Payment state management
- Webhook delivery
- Transaction dashboard
- Payment simulator

### Milestone 2: Zimbabwean Payment Providers
- EcoCash integration
- InnBucks integration
- Omari integration
- Visa/Mastercard processing

### Milestone 3: SaaS Billing
- Customer records
- Saved payment methods
- Recurring billing
- Subscription plans
- Payment retries
- Failed payment recovery

### Milestone 4: International Expansion
- Additional African payment methods
- International card processing
- Multi-currency support

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- Documentation: [docs.zeepay.co.zw](https://docs.zeepay.co.zw)
- Email: support@zeepay.co.zw
- Issues: GitHub Issues

## Acknowledgments

Built with:
- Next.js
- Supabase
- TypeScript
- Tailwind CSS
