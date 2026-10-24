'use client';

import Link from 'next/link';

const endpoints = [
  { method: 'POST', path: '/v1/payments', description: 'Create a payment' },
  { method: 'GET', path: '/v1/payments/:id', description: 'Retrieve a payment' },
  { method: 'GET', path: '/v1/payments', description: 'List payments' },
  { method: 'POST', path: '/v1/refunds', description: 'Create a refund' },
  { method: 'GET', path: '/v1/refunds/:id', description: 'Retrieve a refund' },
  { method: 'GET', path: '/v1/customers', description: 'List customers' },
  { method: 'POST', path: '/v1/payment_links', description: 'Create a payment link' },
  { method: 'GET', path: '/v1/settlements', description: 'List settlements' },
  { method: 'POST', path: '/v1/webhooks', description: 'Register a webhook endpoint' },
  { method: 'POST', path: '/v1/subscriptions', description: 'Create a subscription (auto-deduct)' },
  { method: 'GET', path: '/v1/subscriptions', description: 'List subscriptions' },
  { method: 'GET', path: '/v1/subscriptions/:id', description: 'Retrieve a subscription' },
  { method: 'PATCH', path: '/v1/subscriptions/:id', description: 'Pause, resume, or cancel' },
  { method: 'POST', path: '/v1/subscriptions/:id/approve', description: 'Approve a mandate (sandbox)' },
];

const events = [
  { event: 'payment.succeeded', description: 'Payment completed successfully' },
  { event: 'payment.failed', description: 'Payment attempt failed' },
  { event: 'payment.expired', description: 'Checkout session expired' },
  { event: 'refund.succeeded', description: 'Refund completed' },
  { event: 'settlement.paid', description: 'Settlement paid to merchant' },
  { event: 'dispute.created', description: 'A dispute was opened' },
  { event: 'subscription.created', description: 'Subscription created (mandate pending)' },
  { event: 'subscription.activated', description: 'Mandate approved, auto-deduct enabled' },
  { event: 'subscription.charge_succeeded', description: 'Recurring debit succeeded' },
  { event: 'subscription.charge_failed', description: 'Recurring debit failed (will retry)' },
  { event: 'subscription.updated', description: 'Subscription paused or resumed' },
  { event: 'subscription.cancelled', description: 'Subscription ended' },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="navbar navbar-light border-bottom">
        <div className="container">
          <div className="d-flex justify-content-between w-100 align-items-center">
            <Link href="/" className="navbar-brand fw-bold">ZeePay</Link>
            <div className="d-flex gap-2">
              <Link href="/auth/login" className="btn btn-sm btn-outline-secondary">Sign in</Link>
              <Link href="/auth/register" className="btn btn-sm btn-primary">Get started</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container py-5">
        <div className="row">
          <div className="col-lg-3 mb-4">
            <div className="position-sticky" style={{ top: '1rem' }}>
              <p className="text-muted small text-uppercase fw-semibold mb-2">Documentation</p>
              <ul className="nav flex-column small">
                <li className="nav-item"><a href="#quickstart" className="nav-link px-0 text-dark">Quickstart</a></li>
                <li className="nav-item"><a href="#auth" className="nav-link px-0 text-dark">Authentication</a></li>
                <li className="nav-item"><a href="#api" className="nav-link px-0 text-dark">API Reference</a></li>
                <li className="nav-item"><a href="#subscriptions" className="nav-link px-0 text-dark">Subscriptions</a></li>
                <li className="nav-item"><a href="#webhooks" className="nav-link px-0 text-dark">Webhooks</a></li>
                <li className="nav-item"><a href="#errors" className="nav-link px-0 text-dark">Errors & Idempotency</a></li>
              </ul>
            </div>
          </div>

          <div className="col-lg-9">
            <h1 className="h3 mb-2">ZeePay API Documentation</h1>
            <p className="text-muted">
              Base URL: <code className="text-dark">https://api.zeepay.co.zw</code> ·
              Version: <code className="text-dark">v1 (2024-01)</code>
            </p>

            <section id="quickstart" className="mb-5">
              <h2 className="h5 mb-3">Quickstart</h2>
              <p className="small">Install the SDK and create your first payment:</p>
              <div className="card bg-dark text-light mb-3">
                <div className="card-body">
                  <pre className="mb-0 small" style={{ color: '#c7d2fe' }}>{`npm install zeepay

import ZeePay from "zeepay";
const zee = new ZeePay(process.env.ZEEPAY_SECRET_KEY);

const payment = await zee.payments.create({
  amount: 10,
  currency: "USD",
  reference: "invoice_1042"
});
// Redirect the customer to payment.checkoutUrl`}</pre>
                </div>
              </div>
            </section>

            <section id="auth" className="mb-5">
              <h2 className="h5 mb-3">Authentication</h2>
              <p className="small">
                Authenticate with a secret key in the <code>Authorization: Bearer zp_sk_...</code> header.
                Use <code>zp_test_sk_...</code> keys in sandbox mode — no real payments are processed.
                Never expose secret keys in client-side code.
              </p>
            </section>

            <section id="api" className="mb-5">
              <h2 className="h5 mb-3">API Reference</h2>
              <div className="card">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Method</th>
                        <th>Endpoint</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {endpoints.map((e) => (
                        <tr key={e.path + e.method}>
                          <td>
                            <span className={`badge ${e.method === 'POST' ? 'bg-success' : 'bg-primary'}`}>{e.method}</span>
                          </td>
                          <td><code className="small">{e.path}</code></td>
                          <td className="small text-muted">{e.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="small text-muted mt-2">
                Full OpenAPI 3.0 specification: <code>docs/openapi.yaml</code>
              </p>
            </section>

            <section id="subscriptions" className="mb-5">
              <h2 className="h5 mb-3">Subscriptions & Auto-Deduct</h2>
              <p className="small">
                ZeePay subscriptions debit your customers automatically on each billing date —
                <strong> including EcoCash, InnBucks and Omari wallets that don't natively support
                recurring payments</strong>. A mandate is created when you create a subscription; the
                customer approves it once, then ZeePay handles every debit.
              </p>
              <ol className="small text-muted">
                <li className="mb-2">
                  <strong>Create:</strong> <code>POST /v1/subscriptions</code> with <code>methodCode</code>,
                  <code>amount</code>, <code>interval</code> and customer details.
                </li>
                <li className="mb-2">
                  <strong>Approve:</strong> the customer authorizes once (wallet PIN / card 3DS) via the
                  returned <code>approvalUrl</code>. In sandbox, call
                  <code>POST /v1/subscriptions/:id/approve</code> to simulate it.
                </li>
                <li className="mb-2">
                  <strong>Auto-deduct:</strong> the billing engine debits on each
                  <code>nextBillingDate</code>. Failed debits retry automatically (subscription becomes
                  <code>past_due</code>) until <code>maxRetries</code> is exhausted.
                </li>
              </ol>
              <div className="card bg-dark text-light">
                <div className="card-body">
                  <pre className="mb-0 small" style={{ color: '#c7d2fe' }}>{`const sub = await zee.subscriptions.create({
  merchantReference: "plan_premium",
  amount: 9.99,
  currency: "USD",
  interval: "monthly",
  methodCode: "ecocash",           // auto-deduct EcoCash monthly!
  customerPhone: "+263771234567"
});
// Redirect customer to sub.approvalUrl to authorize the mandate`}</pre>
                </div>
              </div>
            </section>

            <section id="webhooks" className="mb-5">
              <h2 className="h5 mb-3">Webhooks</h2>
              <p className="small">
                ZeePay sends signed events to your endpoint. Verify signatures using
                HMAC-SHA256 with your webhook secret in the <code>X-ZeePay-Signature</code> header.
                Failed deliveries retry up to 5 times with exponential backoff.
              </p>
              <div className="card">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Event</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((e) => (
                        <tr key={e.event}>
                          <td><code className="small">{e.event}</code></td>
                          <td className="small text-muted">{e.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section id="errors" className="mb-5">
              <h2 className="h5 mb-3">Errors & Idempotency</h2>
              <p className="small">
                Errors use conventional HTTP codes — <code>4xx</code> for client errors and <code>5xx</code> for
                platform errors. All create endpoints accept an <code>Idempotency-Key</code> header to safely
                retry requests without duplicating charges.
              </p>
            </section>

            <div className="alert alert-info small">
              <i className="bi bi-info-circle me-1"></i>
              Try everything risk-free in the <Link href="/dashboard/simulator" className="alert-link">payment simulator</Link>.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
