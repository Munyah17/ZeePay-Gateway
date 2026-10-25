'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ToastProvider, toast } from '@/components/ui';
import { copyToClipboard } from '@/utils/actions';

type Lang = 'curl' | 'node' | 'python' | 'php';

const langExamples: Record<Lang, string> = {
  curl: `curl -X POST https://api.zeepay.co.zw/api/v1/payments \\
  -H "Authorization: Bearer YOUR_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 1000,
    "currency": "USD",
    "payment_method": "ecocash",
    "customer_email": "customer@example.com",
    "metadata": { "order_id": "12345" }
  }'`,
  node: `const Zeepay = require('zeepay-node');
const client = new Zeepay('YOUR_SECRET_KEY');

const payment = await client.payments.create({
  amount: 1000,
  currency: 'USD',
  payment_method: 'ecocash',
  customer_email: 'customer@example.com',
  metadata: { order_id: '12345' },
});`,
  python: `import zeepay

client = zeepay.Client('YOUR_SECRET_KEY')

payment = client.payments.create(
    amount=1000,
    currency='USD',
    payment_method='ecocash',
    customer_email='customer@example.com',
    metadata={'order_id': '12345'},
)`,
  php: `<?php
$client = new \Zeepay\Client('YOUR_SECRET_KEY');

$payment = $client->payments->create([
    'amount' => 1000,
    'currency' => 'USD',
    'payment_method' => 'ecocash',
    'customer_email' => 'customer@example.com',
    'metadata' => ['order_id' => '12345'],
]);`,
};

export default function DeveloperPlatform() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Lang>('curl');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authed = localStorage.getItem('zeepay_authed');
      if (!authed) {
        router.push('/auth/login');
        return;
      }
    }
    setLoading(false);
  }, [router]);

  const apiEndpoints = [
    {
      method: 'POST',
      path: '/api/v1/payments',
      description: 'Create a new payment',
      auth: 'Required',
    },
    {
      method: 'GET',
      path: '/api/v1/payments/{id}',
      description: 'Retrieve payment details',
      auth: 'Required',
    },
    {
      method: 'POST',
      path: '/api/v1/refunds',
      description: 'Create a refund',
      auth: 'Required',
    },
    {
      method: 'GET',
      path: '/api/v1/payment-methods',
      description: 'List available payment methods',
      auth: 'Required',
    },
    {
      method: 'POST',
      path: '/api/v1/webhooks',
      description: 'Create webhook endpoint',
      auth: 'Required',
    },
  ];

  return (
    <ToastProvider>
      <div className="mb-4">
        <h2 className="h4">Developer Platform</h2>
        <p className="text-muted">API documentation, integration guides, and developer resources</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Quick Links */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <Link href="/dashboard/settings" className="card text-decoration-none text-dark h-100">
                <div className="card-body">
                  <div className="text-primary mb-2">
                    <i className="bi bi-key fs-4"></i>
                  </div>
                  <h6 className="mb-1">API Keys</h6>
                  <p className="text-muted small mb-0">Manage your API credentials</p>
                </div>
              </Link>
            </div>
            <div className="col-md-3">
              <Link href="/dashboard/settings" className="card text-decoration-none text-dark h-100">
                <div className="card-body">
                  <div className="text-primary mb-2">
                    <i className="bi bi-broadcast fs-4"></i>
                  </div>
                  <h6 className="mb-1">Webhooks</h6>
                  <p className="text-muted small mb-0">Configure webhook endpoints</p>
                </div>
              </Link>
            </div>
            <div className="col-md-3">
              <Link href="/dashboard/simulator" className="card text-decoration-none text-dark h-100">
                <div className="card-body">
                  <div className="text-primary mb-2">
                    <i className="bi bi-play-circle fs-4"></i>
                  </div>
                  <h6 className="mb-1">Test Simulator</h6>
                  <p className="text-muted small mb-0">Test payments in sandbox</p>
                </div>
              </Link>
            </div>
            <div className="col-md-3">
              <a
                href="/docs/openapi.yaml"
                target="_blank"
                rel="noreferrer"
                className="card text-decoration-none text-dark h-100"
              >
                <div className="card-body">
                  <div className="text-primary mb-2">
                    <i className="bi bi-book fs-4"></i>
                  </div>
                  <h6 className="mb-1">Full Documentation</h6>
                  <p className="text-muted small mb-0">Complete API reference</p>
                </div>
              </a>
            </div>
          </div>

          <div className="row g-4">
            {/* API Documentation */}
            <div className="col-lg-8">
              <div className="card h-100">
                <div className="card-header">
                  <h5 className="card-title mb-0">API Reference</h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Method</th>
                          <th>Endpoint</th>
                          <th>Description</th>
                          <th>Auth</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apiEndpoints.map((endpoint, index) => (
                          <tr key={index}>
                            <td>
                              <span className={`badge ${
                                endpoint.method === 'POST' ? 'bg-success' :
                                endpoint.method === 'GET' ? 'bg-primary' :
                                endpoint.method === 'PUT' ? 'bg-warning text-dark' :
                                endpoint.method === 'DELETE' ? 'bg-danger' : 'bg-secondary'
                              }`}>
                                {endpoint.method}
                              </span>
                            </td>
                            <td className="font-monospace small">{endpoint.path}</td>
                            <td className="small">{endpoint.description}</td>
                            <td>
                              <span className="badge bg-info text-dark">{endpoint.auth}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Start Guide */}
            <div className="col-lg-4">
              <div className="card h-100">
                <div className="card-header">
                  <h5 className="card-title mb-0">Quick Start</h5>
                </div>
                <div className="card-body">
                  <ol className="small">
                    <li className="mb-3">
                      <strong>1. Get your API keys</strong>
                      <p className="text-muted mb-0">Navigate to Settings to generate your public and secret keys.</p>
                    </li>
                    <li className="mb-3">
                      <strong>2. Make your first payment</strong>
                      <p className="text-muted mb-0">Use the API to create a payment with your preferred method.</p>
                    </li>
                    <li className="mb-3">
                      <strong>3. Set up webhooks</strong>
                      <p className="text-muted mb-0">Configure webhooks to receive payment status updates.</p>
                    </li>
                    <li>
                      <strong>4. Test in sandbox</strong>
                      <p className="text-muted mb-0">Use the simulator to test before going live.</p>
                    </li>
                  </ol>
                  <button
                    className="btn btn-primary w-100 mt-3"
                    onClick={() => window.open('/docs/openapi.yaml', '_blank')}
                  >
                    <i className="bi bi-book me-2"></i>
                    View Full Guide
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Code Example */}
          <div className="card mt-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Create Payment Example</h5>
              <div className="btn-group btn-group-sm">
                {(['curl', 'node', 'python', 'php'] as Lang[]).map((l) => (
                  <button
                    key={l}
                    className={`btn ${lang === l ? 'btn-secondary' : 'btn-outline-secondary'}`}
                    onClick={() => setLang(l)}
                  >
                    {l === 'curl' ? 'cURL' : l === 'node' ? 'Node.js' : l === 'python' ? 'Python' : 'PHP'}
                  </button>
                ))}
              </div>
            </div>
            <div className="card-body">
              <pre className="bg-dark text-light p-3 rounded">
                <code>{langExamples[lang]}</code>
              </pre>
              <button
                className="btn btn-sm btn-outline-primary mt-2"
                onClick={() => { copyToClipboard(langExamples[lang]); toast('Code copied to clipboard'); }}
              >
                <i className="bi bi-clipboard me-1"></i>
                Copy Code
              </button>
            </div>
          </div>

          {/* SDKs and Libraries */}
          <div className="card mt-4">
            <div className="card-header">
              <h5 className="card-title mb-0">Official SDKs</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="card h-100">
                    <div className="card-body">
                      <h6 className="mb-2">
                        <i className="bi bi-file-code me-2"></i>
                        Node.js SDK
                      </h6>
                      <p className="text-muted small mb-2">Official Node.js library for ZeePay API</p>
                      <code
                        className="small d-block"
                        role="button"
                        style={{ cursor: 'pointer' }}
                        title="Click to copy"
                        onClick={() => { copyToClipboard('npm install zeepay-node'); toast('Install command copied'); }}
                      >
                        npm install zeepay-node
                      </code>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card h-100">
                    <div className="card-body">
                      <h6 className="mb-2">
                        <i className="bi bi-file-code me-2"></i>
                        Python SDK
                      </h6>
                      <p className="text-muted small mb-2">Official Python library for ZeePay API</p>
                      <code
                        className="small d-block"
                        role="button"
                        style={{ cursor: 'pointer' }}
                        title="Click to copy"
                        onClick={() => { copyToClipboard('pip install zeepay-python'); toast('Install command copied'); }}
                      >
                        pip install zeepay-python
                      </code>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card h-100">
                    <div className="card-body">
                      <h6 className="mb-2">
                        <i className="bi bi-file-code me-2"></i>
                        PHP SDK
                      </h6>
                      <p className="text-muted small mb-2">Official PHP library for ZeePay API</p>
                      <code
                        className="small d-block"
                        role="button"
                        style={{ cursor: 'pointer' }}
                        title="Click to copy"
                        onClick={() => { copyToClipboard('composer require zeepay/php'); toast('Install command copied'); }}
                      >
                        composer require zeepay/php
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="card mt-4">
            <div className="card-header">
              <h5 className="card-title mb-0">Developer Support</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="d-flex gap-3">
                    <div className="text-primary fs-4">
                      <i className="bi bi-chat-dots"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">Live Chat</h6>
                      <p className="text-muted small mb-0">Chat with our support team</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex gap-3">
                    <div className="text-primary fs-4">
                      <i className="bi bi-envelope"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">Email Support</h6>
                      <p className="text-muted small mb-0">developers@zeepay.co.zw</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex gap-3">
                    <div className="text-primary fs-4">
                      <i className="bi bi-github"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">GitHub</h6>
                      <p className="text-muted small mb-0">View our open-source projects</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </ToastProvider>
  );
}
