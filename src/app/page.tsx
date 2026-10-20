import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center">
              <span className="text-sm font-semibold text-gray-900">ZeePay</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/docs" className="text-xs text-gray-600 hover:text-gray-900">
                Documentation
              </Link>
              <Link href="/pricing" className="text-xs text-gray-600 hover:text-gray-900">
                Pricing
              </Link>
              <Link href="/auth/login" className="text-xs text-gray-600 hover:text-gray-900">
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="text-xs bg-black text-white px-3 py-1.5 rounded hover:bg-gray-800"
              >
                Start free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <section className="py-20 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
                Payments infrastructure for Zimbabwe
              </h1>
              <p className="mt-4 text-base text-gray-600">
                Accept payments from EcoCash, InnBucks, Omari, Visa, and Mastercard through a single API.
                Built for developers who want to focus on their product, not payment complexity.
              </p>
              <div className="mt-8 flex gap-3">
                <Link
                  href="/auth/register"
                  className="text-xs bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                >
                  Start building
                </Link>
                <Link
                  href="/docs"
                  className="text-xs border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
                >
                  Read the docs
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Unified API</h3>
                <p className="text-xs text-gray-600">
                  One integration for all payment providers. Switch providers without changing your code.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Instant payouts</h3>
                <p className="text-xs text-gray-600">
                  Get your money faster with automated settlement to your bank account.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Webhooks</h3>
                <p className="text-xs text-gray-600">
                  Real-time notifications for payment events. Build automated workflows.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Developer-first</h3>
                <p className="text-xs text-gray-600">
                  Comprehensive SDKs, detailed documentation, and responsive support.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-8">Supported payment methods</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { name: 'EcoCash', type: 'Mobile Money' },
                { name: 'InnBucks', type: 'Mobile Money' },
                { name: 'Omari', type: 'Mobile Money' },
                { name: 'Visa', type: 'Card' },
                { name: 'Mastercard', type: 'Card' },
              ].map((method) => (
                <div key={method.name} className="border border-gray-200 rounded p-4">
                  <p className="text-sm font-medium text-gray-900">{method.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{method.type}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Simple integration</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Get started in minutes with our REST API. Create payments, handle webhooks, and manage refunds with a few lines of code.
                </p>
                <div className="bg-gray-900 rounded p-4 overflow-x-auto">
                  <pre className="text-xs text-gray-300">
{`const response = await fetch('https://api.zeepay.co/v1/payments', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_live_xxx',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 100.00,
    currency: 'USD',
    paymentMethod: 'ecocash',
    customerPhone: '+263712345678'
  })
});`}
                  </pre>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Real-time dashboard</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Monitor your payments, view analytics, and manage your business from a single dashboard.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    Payment analytics and reporting
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    Real-time transaction monitoring
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    Merchant and customer management
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    Webhook configuration and testing
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-8">Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-gray-200 rounded p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Starter</h3>
                <p className="text-2xl font-semibold text-gray-900 mb-4">1.5% <span className="text-xs text-gray-500">per transaction</span></p>
                <ul className="space-y-2 mb-6">
                  <li className="text-xs text-gray-600">Up to $10,000/month</li>
                  <li className="text-xs text-gray-600">Basic dashboard</li>
                  <li className="text-xs text-gray-600">Email support</li>
                </ul>
                <Link href="/auth/register" className="block text-xs text-center border border-gray-300 py-2 rounded hover:bg-gray-50">
                  Get started
                </Link>
              </div>
              <div className="border-2 border-black rounded p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Growth</h3>
                <p className="text-2xl font-semibold text-gray-900 mb-4">1.2% <span className="text-xs text-gray-500">per transaction</span></p>
                <ul className="space-y-2 mb-6">
                  <li className="text-xs text-gray-600">Up to $100,000/month</li>
                  <li className="text-xs text-gray-600">Advanced analytics</li>
                  <li className="text-xs text-gray-600">Priority support</li>
                  <li className="text-xs text-gray-600">Custom branding</li>
                </ul>
                <Link href="/auth/register" className="block text-xs text-center bg-black text-white py-2 rounded hover:bg-gray-800">
                  Get started
                </Link>
              </div>
              <div className="border border-gray-200 rounded p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Enterprise</h3>
                <p className="text-2xl font-semibold text-gray-900 mb-4">Custom</p>
                <ul className="space-y-2 mb-6">
                  <li className="text-xs text-gray-600">Unlimited volume</li>
                  <li className="text-xs text-gray-600">Dedicated support</li>
                  <li className="text-xs text-gray-600">SLA guarantee</li>
                  <li className="text-xs text-gray-600">Custom integrations</li>
                </ul>
                <Link href="/contact" className="block text-xs text-center border border-gray-300 py-2 rounded hover:bg-gray-50">
                  Contact sales
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Ready to get started?</h2>
            <p className="text-sm text-gray-600 mb-6">
              Create an account and start accepting payments in minutes.
            </p>
            <Link
              href="/auth/register"
              className="text-xs bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              Start free trial
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-xs font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/payments" className="text-xs text-gray-600 hover:text-gray-900">Payments</Link></li>
                <li><Link href="/pricing" className="text-xs text-gray-600 hover:text-gray-900">Pricing</Link></li>
                <li><Link href="/docs" className="text-xs text-gray-600 hover:text-gray-900">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-xs text-gray-600 hover:text-gray-900">About</Link></li>
                <li><Link href="/blog" className="text-xs text-gray-600 hover:text-gray-900">Blog</Link></li>
                <li><Link href="/careers" className="text-xs text-gray-600 hover:text-gray-900">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><Link href="/support" className="text-xs text-gray-600 hover:text-gray-900">Support</Link></li>
                <li><Link href="/status" className="text-xs text-gray-600 hover:text-gray-900">Status</Link></li>
                <li><Link href="/contact" className="text-xs text-gray-600 hover:text-gray-900">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-xs text-gray-600 hover:text-gray-900">Privacy</Link></li>
                <li><Link href="/terms" className="text-xs text-gray-600 hover:text-gray-900">Terms</Link></li>
                <li><Link href="/security" className="text-xs text-gray-600 hover:text-gray-900">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-xs text-gray-500">© 2026 ZeePay. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
