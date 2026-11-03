# ZeePay SDK — Agent Integration Guide

Instructions for AI coding agents integrating ZeePay into a merchant project. Follow these patterns exactly; do not invent endpoints.

## What this package is

`zeepay-sdk` is a thin typed wrapper over the ZeePay REST API (`https://api.zeepay.co.zw/v1`, auth via `X-API-Key` header). If the SDK doesn't cover an endpoint you need, call the REST API directly — full spec at `/openapi.yaml` on the API host (repo copy: `../docs/openapi.yaml`).

## Non-negotiable rules

1. **Secret keys are server-side only.** `zp_test_*`/`zp_live_*` keys go in env vars (`ZEEPAY_SECRET_KEY`), never in client components, browser bundles, or committed code. Framework client components (`'use client'`, `NEXT_PUBLIC_*` vars) must NEVER reference the SDK or key.
2. **Checkout is hosted.** Create a payment server-side → redirect the customer to the returned `checkoutUrl` → ZeePay handles the wallet/card interaction → customer lands on `returnUrl`/`cancelUrl`.
3. **Fulfil orders on webhooks, not the return URL.** Verify `X-ZeePay-Signature` (HMAC-SHA256 over the raw body, `sha256=` prefix, constant-time compare) before trusting any event. Signature check needs the **raw** body — use `await req.text()` / raw-body middleware, not the parsed object.
4. **Idempotency.** Pass `idempotencyKey` on create calls that may be retried (checkouts, webhook-triggered fulfillment).
5. **Product-based pricing.** When charging for a catalogue product, send `productId` + `quantity` and DO NOT send `amount` — the server resolves price/currency from the merchant's catalogue so the front store can't tamper.
6. **Test before live.** `zp_test_*` keys never move real money; providers without saved credentials return simulated results. Only `zp_live_*` + saved provider credentials process real payments.

## Canonical patterns

### Hosted checkout payment

```ts
import ZeePay from 'zeepay-sdk';

const zee = new ZeePay({ apiKey: process.env.ZEEPAY_SECRET_KEY! });

const payment = await zee.payments.create({
  amount: 10,
  currency: 'USD',
  reference: `order_${order.id}`,           // unique per order — doubles as idempotency anchor
  returnUrl: `${SITE_URL}/payment/success`,
  cancelUrl: `${SITE_URL}/payment/cancel`,
  customerEmail: order.email,
  metadata: { orderId: order.id },
});
// redirect to payment.checkoutUrl
```

### Storefront selling a catalogue product (back-store/front-store)

```ts
// pull catalogue (cache appropriately)
const { data: products } = await zee.products.list({ activeOnly: true });

// on buy:
const payment = await zee.payments.create({
  productId: product.id,     // amount/currency resolved server-side
  quantity: 2,
  reference: `order_${order.id}`,
  returnUrl: `${SITE_URL}/payment/success`,
});
// redirect to payment.checkoutUrl
```

### Webhook handler

```ts
import crypto from 'crypto';

const raw = await req.text(); // raw body — required for signature check
const sig = req.headers['x-zeepay-signature'];
const expected = 'sha256=' + crypto.createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex');
if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return 401;
const { event, data } = JSON.parse(raw);
// handle payment.succeeded / payment.failed / payment.refunded idempotently
```

### Saved cards / recurring

- Tokenise: `savedPaymentMethods.register({ customerReference, methodType: 'card' })` → redirect customer to `approvalUrl` → then `activate(id)` resolves the durable token.
- Charge: `payments.create({ savedPaymentMethodId, amount, currency, reference })` — no redirect.
- Subscriptions: `plans.create` → `subscriptions.create` → customer approves → ZeePay auto-debits. Cards debit silently; mobile money prompts the subscriber by PIN each cycle.

## Common agent mistakes to avoid

- Do NOT generate payment status polling loops on the client — use webhooks or server-side `payments.get`.
- Do NOT set `amount` when `productId` is present — it is ignored by design.
- Do NOT activate a saved payment method without the customer completing `approvalUrl` — the API rejects it.
- Do NOT store card numbers anywhere — tokenisation happens on ZeePay-hosted pages only.
- `stockQuantity: null` means unlimited stock (digital goods), not zero.
