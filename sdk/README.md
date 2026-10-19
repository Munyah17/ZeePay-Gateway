# ZeePay SDK

JavaScript/TypeScript SDK for integrating with ZeePay payment gateway.

## Installation

```bash
npm install zeepay-sdk
```

## Quick Start

```typescript
import ZeePay from 'zeepay-sdk';

const zeePay = new ZeePay({
  apiKey: 'zp_test_your_api_key_here'
});

// Create a payment
const payment = await zeePay.payments.create({
  amount: 10,
  currency: 'USD',
  reference: 'invoice_1042',
  returnUrl: 'https://myapp.com/billing/success',
  cancelUrl: 'https://myapp.com/billing/cancel'
});

console.log(payment.checkoutUrl);
// Redirect customer to payment.checkoutUrl
```

## API Reference

### Payments

#### Create a Payment

```typescript
const payment = await zeePay.payments.create({
  amount: 10,
  currency: 'USD',
  reference: 'invoice_1042',
  returnUrl: 'https://myapp.com/success',
  cancelUrl: 'https://myapp.com/cancel',
  customerEmail: 'customer@example.com',
  customerPhone: '+263123456789',
  metadata: {
    orderId: '12345'
  },
  idempotencyKey: 'unique-key-for-duplicate-requests',
  paymentMethodId: 'payment-method-id'
});
```

#### Get a Payment

```typescript
const payment = await zeePay.payments.get('payment_id');
```

#### List Payments

```typescript
const payments = await zeePay.payments.list({
  limit: 50,
  offset: 0,
  status: 'succeeded'
});
```

#### Cancel a Payment

```typescript
const payment = await zeePay.payments.cancel('payment_id');
```

### Refunds

#### Create a Refund

```typescript
const refund = await zeePay.refunds.create({
  paymentId: 'payment_id',
  amount: 10,
  currency: 'USD',
  reason: 'Customer requested refund',
  metadata: {
    reasonCode: 'CUSTOMER_REQUEST'
  }
});
```

#### Get a Refund

```typescript
const refund = await zeePay.refunds.get('refund_id');
```

### Webhooks

#### Create a Webhook Endpoint

```typescript
const webhook = await zeePay.webhooks.create({
  url: 'https://myapp.com/webhooks/zeepay',
  events: ['payment.succeeded', 'payment.failed', 'payment.refunded']
});

// Save the webhook.secret securely - you'll need it to verify signatures
console.log(webhook.secret);
```

#### List Webhooks

```typescript
const webhooks = await zeePay.webhooks.list();
```

#### Get a Webhook

```typescript
const webhook = await zeePay.webhooks.get('webhook_id');
```

#### Update a Webhook

```typescript
const webhook = await zeePay.webhooks.update('webhook_id', {
  url: 'https://myapp.com/webhooks/zeepay/new',
  events: ['payment.succeeded'],
  isActive: true,
  rotateSecret: true // Generate a new secret
});
```

#### Delete a Webhook

```typescript
await zeePay.webhooks.delete('webhook_id');
```

#### Get Webhook Delivery History

```typescript
const deliveries = await zeePay.webhooks.getDeliveries('webhook_id', 50);
```

### Payment Methods

#### List Available Payment Methods

```typescript
const methods = await zeePay.listPaymentMethods();
console.log(methods.data);
```

## Webhook Signature Verification

When you receive a webhook from ZeePay, you should verify the signature to ensure it's authentic.

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')}`;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// In your webhook handler
app.post('/webhooks/zeepay', (req, res) => {
  const signature = req.headers['x-zeepay-signature'];
  const payload = JSON.stringify(req.body);

  if (!verifyWebhookSignature(payload, signature, process.env.ZEEPAY_WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }

  // Process the webhook
  const { event, data } = req.body;

  switch (event) {
    case 'payment.succeeded':
      // Handle successful payment
      break;
    case 'payment.failed':
      // Handle failed payment
      break;
    case 'payment.refunded':
      // Handle refund
      break;
  }

  res.status(200).send('OK');
});
```

## Error Handling

The SDK throws errors for failed requests. Always wrap your API calls in try-catch blocks.

```typescript
try {
  const payment = await zeePay.payments.create({
    amount: 10,
    currency: 'USD',
    reference: 'invoice_1042'
  });
} catch (error) {
  console.error('Payment creation failed:', error.message);
  // Handle error
}
```

## Idempotency

To prevent duplicate charges, use idempotency keys for create operations.

```typescript
const payment = await zeePay.payments.create({
  amount: 10,
  currency: 'USD',
  reference: 'invoice_1042',
  idempotencyKey: 'unique-key-for-this-request'
});
```

If you retry a request with the same idempotency key, ZeePay will return the original result without creating a duplicate.

## Configuration

```typescript
const zeePay = new ZeePay({
  apiKey: 'zp_test_your_api_key_here',
  apiUrl: 'https://api.zeepay.co.zw/v1' // Optional, defaults to production API
});
```

## Test Mode

Use your test API key to process payments in test mode. No real money will be processed.

```typescript
const zeePay = new ZeePay({
  apiKey: 'zp_test_your_test_api_key_here'
});
```

## Support

For documentation and support, visit [docs.zeepay.co.zw](https://docs.zeepay.co.zw)
