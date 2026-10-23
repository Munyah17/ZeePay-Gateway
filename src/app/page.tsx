'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "One API. Every way to pay.",
      subtitle: "Accept payments from Zimbabwe and around the world with a single integration",
      cta: "Get started free",
      gradient: "from-blue-600 via-purple-600 to-pink-500",
    },
    {
      title: "Built for Zimbabwean Businesses",
      subtitle: "Local payment methods, instant settlement, and competitive rates",
      cta: "View pricing",
      gradient: "from-green-500 via-teal-500 to-blue-500",
    },
    {
      title: "Developer-First Platform",
      subtitle: "Clear APIs, comprehensive documentation, and powerful SDKs",
      cta: "Read docs",
      gradient: "from-purple-600 via-pink-500 to-red-500",
    },
    {
      title: "Secure & Compliant",
      subtitle: "PCI-DSS compliant with bank-grade security for your peace of mind",
      cta: "Learn more",
      gradient: "from-indigo-600 via-blue-600 to-cyan-500",
    },
    {
      title: "Lightning Fast Settlements",
      subtitle: "Get your money in hours, not days. Same-day settlement available",
      cta: "Contact sales",
      gradient: "from-orange-500 via-red-500 to-pink-500",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <nav className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ZeePay
              </Link>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200">Home</Link>
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200">Product</Link>
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200">Developers</Link>
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200">Pricing</Link>
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200">Company</Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200">Sign in</Link>
              <Link href="/auth/register" className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2.5 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200">
                Get started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Slider */}
        <section className="relative overflow-hidden">
          <div className="relative h-[600px]">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} opacity-90`}></div>
                <div className="relative h-full flex items-center">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="max-w-3xl">
                      <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                        {slide.title}
                      </h1>
                      <p className="text-xl text-white/90 mb-8">
                        {slide.subtitle}
                      </p>
                      <div className="flex gap-4">
                        <Link
                          href="/auth/register"
                          className="bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          {slide.cta} →
                        </Link>
                        <Link
                          href="/docs"
                          className="bg-white/20 backdrop-blur text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/30 transition-all duration-200 border border-white/30"
                        >
                          Learn more
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Slider Indicators */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          {/* Slider Navigation */}
          <button
            onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur text-white p-3 rounded-full hover:bg-white/30 transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur text-white p-3 rounded-full hover:bg-white/30 transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </section>

        {/* Payment Provider Logos */}
        <section className="py-12 bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-600 mb-8 font-medium">Trusted payment methods</p>
            <div className="flex flex-wrap justify-center items-center gap-12">
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">EC</span>
                </div>
                <span className="font-semibold text-gray-900">EcoCash</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">OM</span>
                </div>
                <span className="font-semibold text-gray-900">One Money</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
                <span className="font-semibold text-gray-900">Visa</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">MC</span>
                </div>
                <span className="font-semibold text-gray-900">Mastercard</span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-sm font-semibold bg-blue-100 text-blue-700 px-4 py-2 rounded-full inline-block mb-4">
                PLATFORM FEATURES
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to get paid</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">One developer-friendly platform from checkout to reconciliation</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100 hover:border-blue-200 group">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                  ⌘
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Simple integration</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  A clear API, SDK examples, and a test environment built for developers.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100 hover:border-purple-200 group">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                  ↗
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Hosted checkout</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Let ZeePay handle PCI compliance while you maintain your brand experience.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100 hover:border-green-200 group">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                  ⌁
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Webhooks & events</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Real-time notifications with automatic retries and signature verification.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100 hover:border-orange-200 group">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                  ⇄
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Reconciliation</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Match provider settlements against your records automatically.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100 hover:border-pink-200 group">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                  ◈
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Multiple methods</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Mobile money, cards, wallets, and bank transfers through one API.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100 hover:border-red-200 group">
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                  ↩
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Refunds & disputes</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Process refunds and manage chargebacks with clear audit trails.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100 hover:border-indigo-200 group">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                  ♙
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer management</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Track payment history and build customer profiles across transactions.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100 hover:border-teal-200 group">
                <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                  ⚑
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Risk monitoring</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Built-in fraud detection and configurable risk rules for your business.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-green-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-sm font-semibold bg-green-100 text-green-700 px-4 py-2 rounded-full inline-block mb-4">
                PAYMENT METHODS
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Supported payment methods</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">Accept payments from all major Zimbabwean and international providers</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {[
                { name: 'EcoCash', type: 'Mobile Money', color: 'from-green-400 to-green-600', icon: '📱' },
                { name: 'InnBucks', type: 'Mobile Money', color: 'from-blue-400 to-blue-600', icon: '💰' },
                { name: 'Omari', type: 'Mobile Money', color: 'from-purple-400 to-purple-600', icon: '💳' },
                { name: 'Visa', type: 'Card', color: 'from-blue-600 to-blue-800', icon: '💎' },
                { name: 'Mastercard', type: 'Card', color: 'from-red-500 to-orange-500', icon: '🔴' },
              ].map((method) => (
                <div key={method.name} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100 hover:scale-105 group">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${method.color} flex items-center justify-center text-4xl mb-6 mx-auto group-hover:scale-110 transition-transform shadow-lg`}>
                    {method.icon}
                  </div>
                  <p className="text-lg font-semibold text-gray-900 text-center">{method.name}</p>
                  <p className="text-sm text-gray-500 mt-2 text-center">{method.type}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="text-white">
                <span className="text-sm font-semibold bg-white/20 backdrop-blur px-4 py-2 rounded-full inline-block mb-6">
                  CONSUMER APP
                </span>
                <h2 className="text-4xl font-bold mb-6 leading-tight">Experience seamless payments with TopMe</h2>
                <p className="text-xl mb-8 text-white/90 leading-relaxed">
                  Our consumer-facing app for personal payments, airtime top-ups, and bill payments. 
                  Fast, secure, and designed for Zimbabwe.
                </p>
                <div className="flex gap-4 flex-wrap">
                  <a
                    href="https://topme.co.zw"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
                  >
                    Visit TopMe →
                  </a>
                  <button className="bg-white/20 backdrop-blur border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/30 transition-all">
                    Learn more
                  </button>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl blur-2xl"></div>
                  <div className="relative w-72 h-[450px] bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl shadow-2xl transform rotate-6 hover:rotate-0 transition-transform duration-500 border border-white/20">
                    <div className="p-8 h-full flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div className="text-white">
                          <p className="text-sm font-medium opacity-80">TopMe</p>
                          <p className="text-3xl font-bold">Pay</p>
                        </div>
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
                          <span className="text-3xl">💳</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-white/20 backdrop-blur rounded-2xl p-4 border border-white/10">
                          <p className="text-white text-sm font-medium opacity-80 mb-1">Airtime</p>
                          <p className="text-white font-semibold">Econet, NetOne, Telecel</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur rounded-2xl p-4 border border-white/10">
                          <p className="text-white text-sm font-medium opacity-80 mb-1">Bill Payments</p>
                          <p className="text-white font-semibold">ZESA, Water, Internet</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur rounded-2xl p-4 border border-white/10">
                          <p className="text-white text-sm font-medium opacity-80 mb-1">Send Money</p>
                          <p className="text-white font-semibold">Instant transfers</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-gradient-to-br from-green-50 via-white to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-sm font-semibold bg-purple-100 text-purple-700 px-4 py-2 rounded-full inline-block mb-4">
                WHY ZEEPAY
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why choose ZeePay?</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">Built for Zimbabwean businesses with features that matter</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="bg-white rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all border border-gray-100 group">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center text-4xl mb-8 mx-auto group-hover:scale-110 transition-transform shadow-lg">
                  ⚡
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Lightning Fast</h3>
                <p className="text-base text-gray-600 text-center leading-relaxed">
                  Process payments in seconds, not hours. Our optimized infrastructure ensures instant confirmation for all transactions.
                </p>
              </div>
              <div className="bg-white rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all border border-gray-100 group">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-4xl mb-8 mx-auto group-hover:scale-110 transition-transform shadow-lg">
                  🔒
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Bank-Grade Security</h3>
                <p className="text-base text-gray-600 text-center leading-relaxed">
                  PCI-DSS compliant with end-to-end encryption. Your customers' data is protected with the highest security standards.
                </p>
              </div>
              <div className="bg-white rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all border border-gray-100 group">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center text-4xl mb-8 mx-auto group-hover:scale-110 transition-transform shadow-lg">
                  💰
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Lowest Fees</h3>
                <p className="text-base text-gray-600 text-center leading-relaxed">
                  Competitive transaction rates with no hidden fees. Save more on every payment compared to traditional providers.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-sm font-semibold bg-orange-100 text-orange-700 px-4 py-2 rounded-full inline-block mb-4">
                DEVELOPER QUICKSTART
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Accept your first payment</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">Use the ZeePay SDK to create a checkout session on your server</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                    Install the SDK
                  </h3>
                  <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto shadow-lg">
                    <pre className="text-sm text-gray-300 font-mono">npm install zeepay</pre>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                    Create a payment on your server
                  </h3>
                  <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto shadow-lg">
                    <pre className="text-sm text-gray-300 font-mono">
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
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                    Redirect the customer
                  </h3>
                  <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto shadow-lg">
                    <pre className="text-sm text-gray-300 font-mono">window.location.href = payment.checkoutUrl;</pre>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl p-10 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Developer quickstart</h3>
                <p className="text-base text-gray-600 mb-8 leading-relaxed">
                  Get started with our test environment. No real payments are processed in sandbox mode.
                </p>
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">Test API keys</h4>
                    <p className="text-sm text-gray-600 mb-4">Use test keys for sandbox transactions</p>
                    <code className="text-sm bg-gray-100 px-4 py-2 rounded-lg block">zp_test_sk_demo_8d71</code>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">Webhook testing</h4>
                    <p className="text-sm text-gray-600 mb-4">Simulate payment events to test your handlers</p>
                    <Link href="/dashboard/simulator" className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-2">
                      Open simulator →
                    </Link>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">Full documentation</h4>
                    <p className="text-sm text-gray-600 mb-4">Complete API reference and guides</p>
                    <Link href="/docs" className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-2">
                      View docs →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-sm font-semibold bg-blue-100 text-blue-700 px-4 py-2 rounded-full inline-block mb-4">
                PRICING
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">Pay only for what you use. No monthly fees, no hidden costs</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Mobile Money</h3>
                <p className="text-4xl font-bold text-gray-900 mb-1">1.5%</p>
                <p className="text-sm text-gray-500 mb-6">per transaction</p>
                <ul className="space-y-3 mb-8">
                  <li className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-green-500">✓</span> EcoCash
                  </li>
                  <li className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-green-500">✓</span> InnBucks
                  </li>
                  <li className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-green-500">✓</span> Omari
                  </li>
                  <li className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-green-500">✓</span> Instant settlement
                  </li>
                </ul>
                <p className="text-sm text-gray-500 mb-6">+$0.10 flat fee per transaction</p>
                <Link href="/auth/register" className="block text-center text-sm font-semibold text-blue-600 hover:text-blue-700">
                  Get started →
                </Link>
              </div>
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-8 shadow-2xl transform scale-105 relative">
                <div className="absolute top-4 right-4 bg-white text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
                  POPULAR
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Cards</h3>
                <p className="text-4xl font-bold text-white mb-1">2.0%</p>
                <p className="text-sm text-white/80 mb-6">per transaction</p>
                <ul className="space-y-3 mb-8">
                  <li className="text-sm text-white flex items-center gap-2">
                    <span className="text-white">✓</span> Visa
                  </li>
                  <li className="text-sm text-white flex items-center gap-2">
                    <span className="text-white">✓</span> Mastercard
                  </li>
                  <li className="text-sm text-white flex items-center gap-2">
                    <span className="text-white">✓</span> American Express
                  </li>
                  <li className="text-sm text-white flex items-center gap-2">
                    <span className="text-white">✓</span> International cards
                  </li>
                </ul>
                <p className="text-sm text-white/80 mb-6">+$0.30 flat fee per transaction</p>
                <Link href="/auth/register" className="block text-center text-sm font-semibold bg-white text-blue-600 px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors">
                  Get started →
                </Link>
              </div>
              <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Bank Transfer</h3>
                <p className="text-4xl font-bold text-gray-900 mb-1">0.8%</p>
                <p className="text-sm text-gray-500 mb-6">per transaction</p>
                <ul className="space-y-3 mb-8">
                  <li className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-green-500">✓</span> Zimbabwean banks
                  </li>
                  <li className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-green-500">✓</span> Same-day settlement
                  </li>
                  <li className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-green-500">✓</span> Bulk payments
                  </li>
                  <li className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-green-500">✓</span> Recurring payments
                  </li>
                </ul>
                <p className="text-sm text-gray-500 mb-6">+$0.05 flat fee per transaction</p>
                <Link href="/auth/register" className="block text-center text-sm font-semibold text-blue-600 hover:text-blue-700">
                  Get started →
                </Link>
              </div>
            </div>
            <div className="mt-12 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl">
              <p className="text-base text-green-800 text-center">
                <strong>Better than Paynow:</strong> Lower transaction fees, faster settlement times, and a modern API for seamless integration. No monthly subscription fees — you only pay when you get paid.
              </p>
            </div>
          </div>
        </section>

        <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">Ready to get started?</h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Create an account and start accepting payments in minutes.
            </p>
            <Link
              href="/auth/register"
              className="inline-block bg-white text-blue-600 px-10 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
            >
              Start free trial →
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <div>
              <h4 className="text-base font-semibold mb-6">Product</h4>
              <ul className="space-y-4">
                <li><Link href="/payments" className="text-sm text-gray-400 hover:text-white transition-colors">Payments</Link></li>
                <li><Link href="/pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/docs" className="text-sm text-gray-400 hover:text-white transition-colors">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-base font-semibold mb-6">Company</h4>
              <ul className="space-y-4">
                <li><Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="text-sm text-gray-400 hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="text-sm text-gray-400 hover:text-white transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-base font-semibold mb-6">Resources</h4>
              <ul className="space-y-4">
                <li><Link href="/support" className="text-sm text-gray-400 hover:text-white transition-colors">Support</Link></li>
                <li><Link href="/status" className="text-sm text-gray-400 hover:text-white transition-colors">Status</Link></li>
                <li><Link href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-base font-semibold mb-6">Legal</h4>
              <ul className="space-y-4">
                <li><Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="/security" className="text-sm text-gray-400 hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">© 2026 ZeePay. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
