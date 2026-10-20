import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-sm font-semibold text-gray-900">ZeePay</Link>
              <div className="flex gap-6">
                <Link href="/" className="text-xs text-gray-600 hover:text-gray-900">Home</Link>
                <Link href="#" className="text-xs text-gray-600 hover:text-gray-900">Product</Link>
                <Link href="#" className="text-xs text-gray-600 hover:text-gray-900">Developers</Link>
                <Link href="#" className="text-xs text-gray-600 hover:text-gray-900">Pricing</Link>
                <Link href="#" className="text-xs text-gray-600 hover:text-gray-900">Company</Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login" className="text-xs text-gray-600 hover:text-gray-900">Sign in</Link>
              <Link href="/auth/register" className="text-xs bg-black text-white px-3 py-1.5 rounded hover:bg-gray-800">
                Get started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <section className="py-20 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded inline-block mb-4">
                  BUILT FOR DEVELOPERS IN ZIMBABWE
                </span>
                <h1 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl mb-4">
                  One API.<br />
                  <span className="text-gray-600">Every way to pay.</span>
                </h1>
                <p className="text-base text-gray-600 mb-8">
                  Accept payments from Zimbabwe and around the world with a single integration. Less payment plumbing, 
                  clearer transactions, and a checkout your customers can understand.
                </p>
                <div className="flex gap-3 mb-8">
                  <Link
                    href="/auth/register"
                    className="text-xs bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                  >
                    Get started free →
                  </Link>
                  <Link
                    href="/docs"
                    className="text-xs border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
                  >
                    View documentation
                  </Link>
                </div>
                <div className="flex gap-8">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">15+</p>
                    <p className="text-xs text-gray-500">Planned methods</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">One API</p>
                    <p className="text-xs text-gray-500">Unified integration</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">24/7</p>
                    <p className="text-xs text-gray-500">Self-service tools</p>
                  </div>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-gray-900">ZeePay checkout</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Secure demo</span>
                </div>
                <p className="text-xs text-gray-500 mb-4">PAYMENT SUMMARY</p>
                <p className="text-2xl font-semibold text-gray-900 mb-1">$10.00</p>
                <p className="text-xs text-gray-500 mb-4">Invoice #INV-1042 · Acme Solutions</p>
                <div className="space-y-3 mb-4">
                  {['Visa & Mastercard', 'EcoCash', 'InnBucks', 'Omari'].map((method, i) => (
                    <div key={method} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700">{method}</span>
                      <span className={i === 0 ? 'text-blue-600' : 'text-gray-300'}>
                        {i === 0 ? '●' : '○'}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 text-center">🔒 Secure checkout · Demo interface</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Everything you need to get paid</h2>
              <p className="text-sm text-gray-600">One developer-friendly platform from checkout to reconciliation</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="text-3xl mb-3">⌘</div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Simple integration</h3>
                <p className="text-xs text-gray-600">
                  A clear API, SDK examples, and a test environment built for developers.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="text-3xl mb-3">↗</div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Hosted checkout</h3>
                <p className="text-xs text-gray-600">
                  Let ZeePay handle PCI compliance while you maintain your brand experience.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="text-3xl mb-3">⌁</div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Webhooks & events</h3>
                <p className="text-xs text-gray-600">
                  Real-time notifications with automatic retries and signature verification.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="text-3xl mb-3">⇄</div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Reconciliation</h3>
                <p className="text-xs text-gray-600">
                  Match provider settlements against your records automatically.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="text-3xl mb-3">◈</div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Multiple methods</h3>
                <p className="text-xs text-gray-600">
                  Mobile money, cards, wallets, and bank transfers through one API.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="text-3xl mb-3">↩</div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Refunds & disputes</h3>
                <p className="text-xs text-gray-600">
                  Process refunds and manage chargebacks with clear audit trails.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="text-3xl mb-3">♙</div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Customer management</h3>
                <p className="text-xs text-gray-600">
                  Track payment history and build customer profiles across transactions.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="text-3xl mb-3">⚑</div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Risk monitoring</h3>
                <p className="text-xs text-gray-600">
                  Built-in fraud detection and configurable risk rules for your business.
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
            <div className="text-center mb-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Accept your first payment</h2>
              <p className="text-sm text-gray-600">Use the ZeePay SDK to create a checkout session on your server</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">1. Install the SDK</h3>
                <div className="bg-gray-900 rounded p-4 overflow-x-auto mb-6">
                  <pre className="text-xs text-gray-300">npm install zeepay</pre>
                </div>
                
                <h3 className="text-sm font-semibold text-gray-900 mb-4">2. Create a payment on your server</h3>
                <div className="bg-gray-900 rounded p-4 overflow-x-auto mb-6">
                  <pre className="text-xs text-gray-300">
{`import ZeePay from "zeepay";

const zee = new ZeePay(
  process.env.ZEEPAY_SECRET_KEY
);

const payment = await zee.payments.create({
  amount: 10,
  currency: "USD",
  reference: "invoice_1042"
});

return Response.json({ 
  checkoutUrl: payment.checkoutUrl 
});`}
                  </pre>
                </div>

                <h3 className="text-sm font-semibold text-gray-900 mb-4">3. Redirect the customer</h3>
                <div className="bg-gray-900 rounded p-4 overflow-x-auto">
                  <pre className="text-xs text-gray-300">window.location.href = payment.checkoutUrl;</pre>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Developer quickstart</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Get started with our test environment. No real payments are processed in sandbox mode.
                </p>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded p-4">
                    <h4 className="text-xs font-semibold text-gray-900 mb-2">Test API keys</h4>
                    <p className="text-xs text-gray-600 mb-2">Use test keys for sandbox transactions</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">zp_test_sk_demo_8d71</code>
                  </div>
                  <div className="border border-gray-200 rounded p-4">
                    <h4 className="text-xs font-semibold text-gray-900 mb-2">Webhook testing</h4>
                    <p className="text-xs text-gray-600 mb-2">Simulate payment events to test your handlers</p>
                    <Link href="/dashboard/simulator" className="text-xs text-blue-600 hover:text-blue-700">
                      Open simulator →
                    </Link>
                  </div>
                  <div className="border border-gray-200 rounded p-4">
                    <h4 className="text-xs font-semibold text-gray-900 mb-2">Full documentation</h4>
                    <p className="text-xs text-gray-600 mb-2">Complete API reference and guides</p>
                    <Link href="/docs" className="text-xs text-blue-600 hover:text-blue-700">
                      View docs →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Simple, transparent pricing</h2>
              <p className="text-sm text-gray-600">Pay only for what you use. No monthly fees, no hidden costs</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-gray-200 rounded p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Mobile Money</h3>
                <p className="text-2xl font-semibold text-gray-900 mb-1">1.5%</p>
                <p className="text-xs text-gray-500 mb-4">per transaction</p>
                <ul className="space-y-2 mb-6">
                  <li className="text-xs text-gray-600">EcoCash</li>
                  <li className="text-xs text-gray-600">InnBucks</li>
                  <li className="text-xs text-gray-600">Omari</li>
                  <li className="text-xs text-gray-600">Instant settlement</li>
                </ul>
                <p className="text-xs text-gray-500 mb-4">+$0.10 flat fee per transaction</p>
              </div>
              <div className="border-2 border-black rounded p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">Cards</h3>
                  <span className="text-xs bg-black text-white px-2 py-1 rounded">POPULAR</span>
                </div>
                <p className="text-2xl font-semibold text-gray-900 mb-1">2.0%</p>
                <p className="text-xs text-gray-500 mb-4">per transaction</p>
                <ul className="space-y-2 mb-6">
                  <li className="text-xs text-gray-600">Visa</li>
                  <li className="text-xs text-gray-600">Mastercard</li>
                  <li className="text-xs text-gray-600">American Express</li>
                  <li className="text-xs text-gray-600">International cards</li>
                </ul>
                <p className="text-xs text-gray-500 mb-4">+$0.30 flat fee per transaction</p>
              </div>
              <div className="border border-gray-200 rounded p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Bank Transfer</h3>
                <p className="text-2xl font-semibold text-gray-900 mb-1">0.8%</p>
                <p className="text-xs text-gray-500 mb-4">per transaction</p>
                <ul className="space-y-2 mb-6">
                  <li className="text-xs text-gray-600">Zimbabwean banks</li>
                  <li className="text-xs text-gray-600">Same-day settlement</li>
                  <li className="text-xs text-gray-600">Bulk payments</li>
                  <li className="text-xs text-gray-600">Recurring payments</li>
                </ul>
                <p className="text-xs text-gray-500 mb-4">+$0.05 flat fee per transaction</p>
              </div>
            </div>
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-xs text-green-800">
                <strong>Better than Paynow:</strong> Lower transaction fees, faster settlement times, and a modern API for seamless integration. No monthly subscription fees — you only pay when you get paid.
              </p>
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
