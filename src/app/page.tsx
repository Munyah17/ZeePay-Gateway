'use client';

import { useState } from 'react';
import Link from 'next/link';

const CheckIcon = () => (
  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center mt-0.5">
    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  </span>
);

const Star = () => (
  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.075 10.1c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* ============ HEADER ============ */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-10">
              <Link href="/" className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
                <span className="text-xl font-extrabold text-[#1a1650]">ZeePay</span>
              </Link>
              <nav className="hidden lg:flex items-center gap-7 text-[15px] font-medium text-gray-700">
                <Link href="#payments" className="hover:text-indigo-600 transition-colors">Product</Link>
                <Link href="/docs" className="hover:text-indigo-600 transition-colors">Developers</Link>
                <Link href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</Link>
                <Link href="/docs" className="hover:text-indigo-600 transition-colors">Resources</Link>
              </nav>
            </div>
            <div className="flex items-center gap-3 sm:gap-5">
              <Link href="/docs" className="hidden md:block text-[15px] font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                API status
              </Link>
              <Link href="/auth/login" className="hidden sm:block text-[15px] font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="hidden sm:block text-[15px] font-semibold bg-[#1a1650] text-white px-5 py-2.5 rounded-lg hover:bg-[#2a2170] transition-colors"
              >
                Get started
              </Link>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-[#1a1650] text-white"
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileOpen && (
            <div className="lg:hidden border-t border-gray-100 py-4 space-y-1">
              {[
                { label: 'Product', href: '#payments' },
                { label: 'Developers', href: '/docs' },
                { label: 'Pricing', href: '#pricing' },
                { label: 'Resources', href: '/docs' },
                { label: 'API status', href: '/docs' },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-left px-2 py-2.5 text-[15px] font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-3 flex flex-col gap-2">
                <Link href="/auth/login" className="block text-center px-4 py-2.5 text-[15px] font-medium text-gray-700 border border-gray-200 rounded-lg">
                  Sign in
                </Link>
                <Link href="/auth/register" className="block text-center px-4 py-2.5 text-[15px] font-semibold bg-[#1a1650] text-white rounded-lg">
                  Get started
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <main>
        {/* ============ HERO (dark navy, static) ============ */}
        <section className="bg-[#17124a] text-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              {/* Left copy */}
              <div className="text-center lg:text-left">
                <h1 className="text-4xl sm:text-5xl xl:text-[3.4rem] font-extrabold leading-[1.08] tracking-tight">
                  The payments infrastructure for African businesses
                </h1>
                <p className="mt-6 text-base sm:text-lg text-indigo-100/90 max-w-xl mx-auto lg:mx-0">
                  Join hundreds of merchants accepting EcoCash, OneMoney, cards and bank transfers through one clean API. Fast, safe, and easy.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-7 py-3.5 rounded-lg font-semibold transition-colors"
                  >
                    Start accepting payments
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                  <Link
                    href="/docs"
                    className="inline-flex items-center justify-center gap-3 border border-white/25 hover:bg-white/10 text-white px-7 py-3.5 rounded-lg font-semibold transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
                      <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.5 5.5v9l8-4.5-8-4.5z" />
                      </svg>
                    </span>
                    Our story
                  </Link>
                </div>
                <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-2 text-sm text-indigo-100/80">
                  <span className="flex">
                    <Star /><Star /><Star /><Star /><Star />
                  </span>
                  <span>4.9 average rating based on 200+ reviews</span>
                  <span className="hidden sm:inline-flex gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-green-500/80"></span>
                    <span className="w-4 h-4 rounded-full bg-blue-500/80"></span>
                    <span className="w-4 h-4 rounded-full bg-purple-500/80"></span>
                  </span>
                </div>
              </div>

              {/* Right mockup cluster */}
              <div className="relative mt-6 lg:mt-0 pb-16 sm:pb-0">
                {/* Main dashboard card */}
                <div className="relative z-10 mx-auto max-w-md lg:max-w-none bg-white/10 backdrop-blur-sm rounded-[2rem] p-2.5 border border-white/10">
                  <div className="bg-[#f4f5fb] rounded-3xl p-5 sm:p-6 text-gray-900">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </span>
                        <span className="font-bold text-sm">Payment volume</span>
                      </div>
                      <span className="text-xl font-extrabold text-[#1a1650]">$124.5K</span>
                    </div>
                    {/* Chart mock */}
                    <div className="relative h-36 mb-4">
                      <div className="absolute inset-0 flex flex-col justify-between">
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} className="border-t border-dashed border-gray-300"></div>
                        ))}
                      </div>
                      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 300 140">
                        <polyline
                          fill="none"
                          stroke="#6366f1"
                          strokeWidth="2.5"
                          points="0,120 40,95 80,105 120,70 160,80 200,50 240,60 300,25"
                        />
                        <circle cx="300" cy="25" r="5" fill="#fff" stroke="#6366f1" strokeWidth="2.5" />
                      </svg>
                      <div className="absolute top-2 right-2 bg-white rounded-lg shadow px-2.5 py-1.5">
                        <div className="h-1.5 w-12 bg-gray-200 rounded-full mb-1.5"></div>
                        <div className="h-1.5 w-8 bg-gray-200 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {[45, 60, 35, 70].map((h, i) => (
                        <div key={i} className="flex-1 bg-gray-200 rounded-md" style={{ height: `${h * 0.4}px` }}></div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating advisor card (top right) */}
                <div className="hidden sm:block absolute -top-4 right-0 lg:-right-4 z-20 bg-white rounded-2xl shadow-2xl p-4 w-56 text-gray-900">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">TM</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Payments advisor</p>
                      <p className="text-sm font-bold">Tanaka M.</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="h-1.5 bg-gray-100 rounded-full w-full"></div>
                    <div className="h-1.5 bg-gray-100 rounded-full w-3/4"></div>
                  </div>
                </div>

                {/* Floating merchant card (bottom left) — hidden on small screens to avoid overlap */}
                <div className="hidden sm:block absolute -bottom-6 left-0 lg:-left-10 z-20 bg-white rounded-2xl shadow-2xl p-4 sm:p-5 w-64 text-gray-900">
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold">GS</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-gray-500">Merchant account</p>
                      <p className="text-sm font-bold truncate">Grace Store</p>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1">
                        <svg className="w-3 h-3 text-indigo-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Verified · $12.4K this month
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <span className="flex-1 text-center text-[11px] font-semibold border border-gray-200 rounded-lg py-2 text-gray-500">Decline</span>
                    <span className="flex-1 text-center text-[11px] font-semibold bg-indigo-600 text-white rounded-lg py-2">Approve payout</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ SECTION: Accept every way Zimbabwe pays ============ */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1a1650] leading-tight">
                  Accept every way Zimbabwe pays
                </h2>
                <p className="mt-5 text-base sm:text-lg text-gray-600 leading-relaxed">
                  Browse hundreds of payment methods or let us route to the best one for each customer — mobile money, cards and bank transfers, all through one integration.
                </p>
                <ul className="mt-8 space-y-4">
                  <li className="flex gap-3 text-[15px] text-gray-800">
                    <CheckIcon />
                    Process EcoCash, OneMoney, InnBucks & cards via one API
                  </li>
                  <li className="flex gap-3 text-[15px] text-gray-800">
                    <CheckIcon />
                    Instant settlement in USD or ZWG
                  </li>
                  <li className="flex gap-3 text-[15px] text-gray-800">
                    <CheckIcon />
                    PCI-DSS compliant hosted checkout
                  </li>
                </ul>
                <Link
                  href="/auth/register"
                  className="mt-8 inline-flex items-center gap-2 bg-[#1a1650] text-white px-6 py-3.5 rounded-lg font-semibold hover:bg-[#2a2170] transition-colors"
                >
                  Explore payments
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>

              {/* Right: rounded lavender card with chart mock */}
              <div className="bg-[#dfe3fa] rounded-[2rem] p-6 sm:p-10">
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
                  <p className="font-bold text-[#1a1650] mb-6">Transaction volume</p>
                  <div className="relative h-44">
                    <div className="absolute inset-0 flex flex-col justify-between">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="border-t border-dashed border-gray-200"></div>
                      ))}
                    </div>
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 320 170">
                      <polyline
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="2.5"
                        points="0,150 40,110 80,125 120,85 160,100 200,60 240,70 280,40 320,20"
                      />
                      <circle cx="280" cy="40" r="6" fill="#fff" stroke="#6366f1" strokeWidth="2.5" />
                    </svg>
                    <div className="absolute top-3 right-4 bg-white border border-gray-100 rounded-lg shadow px-3 py-2">
                      <div className="h-1.5 w-14 bg-gray-200 rounded-full mb-1.5"></div>
                      <div className="h-1.5 w-9 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-5">
                    {[55, 40, 65, 30, 50].map((h, i) => (
                      <div key={i} className="flex-1 bg-gray-100 rounded-md" style={{ height: `${h * 0.5}px` }}></div>
                    ))}
                  </div>
                  <p className="mt-5 text-right text-xs font-semibold text-gray-400">ZeePay analytics</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ SECTION: Go live in hours (chat mock left, copy right) ============ */}
        <section className="py-16 sm:py-24 bg-[#f6f7fd]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left: dark card with chat mockup */}
              <div className="bg-[#1a1650] rounded-[2rem] p-6 sm:p-10 order-2 lg:order-1">
                <div className="bg-indigo-600 rounded-2xl p-5 text-white">
                  <div className="flex items-center gap-3 pb-4 border-b border-white/20">
                    <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-bold">ZeePay developer support</p>
                      <p className="text-[11px] text-indigo-200">Always online</p>
                    </div>
                  </div>
                  <div className="mt-4 bg-white rounded-xl p-4 text-gray-700">
                    <p className="text-xs leading-relaxed">Here is your integration checklist — let us know if you want any changes 💜</p>
                    <div className="mt-3 flex items-center gap-2 bg-indigo-50 rounded-lg px-3 py-2">
                      <span className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </span>
                      <span className="text-xs font-semibold text-indigo-900">quickstart_guide.pdf</span>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="h-2 bg-white/20 rounded-full w-full"></div>
                    <div className="h-2 bg-white/20 rounded-full w-2/3"></div>
                  </div>
                </div>
              </div>

              {/* Right copy */}
              <div className="order-1 lg:order-2">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1a1650] leading-tight">
                  Go live quickly, easily, and securely
                </h2>
                <p className="mt-5 text-base sm:text-lg text-gray-600 leading-relaxed">
                  Integrate <span className="text-indigo-600 font-medium">our developer-first API</span> in an afternoon and start processing real payments in as little as 24 hours.
                </p>
                <ul className="mt-8 space-y-4">
                  <li className="flex gap-3 text-[15px] text-gray-800">
                    <CheckIcon />
                    Get expert help to ship the perfect integration
                  </li>
                  <li className="flex gap-3 text-[15px] text-gray-800">
                    <CheckIcon />
                    Test everything in sandbox with simulated providers
                  </li>
                  <li className="flex gap-3 text-[15px] text-gray-800">
                    <CheckIcon />
                    Settle safely with automated reconciliation
                  </li>
                </ul>
                <Link
                  href="/docs"
                  className="mt-8 inline-flex items-center gap-2 bg-[#1a1650] text-white px-6 py-3.5 rounded-lg font-semibold hover:bg-[#2a2170] transition-colors"
                >
                  Read the docs
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ============ SECTION: Hub (merchants - ZeePay - customers) ============ */}
        <section className="py-16 sm:py-24 bg-[#f6f7fd] border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-10 md:gap-6 items-start">
              {/* Merchants panel */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <div className="bg-indigo-600 rounded-xl p-4 text-white mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">CS</span>
                    <div>
                      <p className="text-sm font-bold">Customer success manager</p>
                      <p className="text-[11px] text-indigo-200">Online</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-xl p-3 flex gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-gray-300 flex-shrink-0"></span>
                    <div className="flex-1 space-y-1.5 pt-1">
                      <div className="h-1.5 bg-gray-200 rounded-full w-full"></div>
                      <div className="h-1.5 bg-gray-200 rounded-full w-4/5"></div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <span className="h-2.5 w-16 bg-indigo-200 rounded-full"></span>
                    <span className="h-2.5 w-10 bg-indigo-200 rounded-full"></span>
                    <span className="w-7 h-7 rounded-full bg-gray-800 flex-shrink-0"></span>
                  </div>
                </div>
              </div>

              {/* Center hub */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <div className="flex justify-center mb-5">
                  <span className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </span>
                    <span className="text-xl font-extrabold text-[#1a1650]">ZeePay</span>
                  </span>
                </div>
                <div className="space-y-3">
                  {['Unified payments API', 'Webhooks & events', 'Escrow & settlement'].map((item) => (
                    <div key={item} className="border border-gray-100 rounded-xl py-3.5 px-4 text-center">
                      <span className="text-sm font-semibold text-[#1a1650]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customers panel */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <p className="text-sm font-bold text-[#1a1650] mb-4">Recent payments</p>
                <div className="space-y-3">
                  {['Invoice #1042', 'Order #8841', 'Subscription'].map((label) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      <div className="flex-1 space-y-1.5">
                        <div className="h-1.5 bg-gray-200 rounded-full w-3/4"></div>
                        <div className="h-1.5 bg-gray-200 rounded-full w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <span className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-lg">New payment</span>
                </div>
              </div>
            </div>

            {/* Labels row */}
            <div className="grid md:grid-cols-3 gap-10 md:gap-6 mt-8 text-center">
              <div>
                <h3 className="text-xl font-extrabold text-[#1a1650]">Merchants</h3>
                <p className="mt-1 text-sm text-gray-600">Maximize conversions with expert help from our team.</p>
              </div>
              <div className="flex items-start justify-center">
                <span className="flex items-center gap-2 mt-1">
                  <span className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </span>
                  <span className="text-lg font-extrabold text-[#1a1650]">ZeePay</span>
                </span>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-[#1a1650]">Customers</h3>
                <p className="mt-1 text-sm text-gray-600">Pay with their preferred method in seconds.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============ SECTION: Payment methods ============ */}
        <section id="payments" className="py-16 sm:py-24 bg-white scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1a1650]">Supported payment methods</h2>
              <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                Accept payments from all major Zimbabwean and international providers
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
              {[
                { name: 'EcoCash', type: 'Mobile Money', color: 'from-green-400 to-green-600', icon: '📱' },
                { name: 'InnBucks', type: 'Mobile Money', color: 'from-blue-400 to-blue-600', icon: '💰' },
                { name: 'Omari', type: 'Mobile Money', color: 'from-purple-400 to-purple-600', icon: '💳' },
                { name: 'Visa', type: 'Card', color: 'from-blue-700 to-blue-900', icon: '💎' },
                { name: 'Mastercard', type: 'Card', color: 'from-red-500 to-orange-500', icon: '🔴' },
              ].map((method) => (
                <div key={method.name} className="bg-[#f6f7fd] rounded-3xl p-6 sm:p-8 text-center hover:shadow-md transition-shadow">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${method.color} flex items-center justify-center text-3xl mb-4 mx-auto`}>
                    {method.icon}
                  </div>
                  <p className="font-bold text-[#1a1650]">{method.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{method.type}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ SECTION: Developer quickstart ============ */}
        <section className="py-16 sm:py-24 bg-[#f6f7fd]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1a1650]">Accept your first payment</h2>
              <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                Use the ZeePay SDK to create a checkout session on your server
              </p>
            </div>
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
              <div className="space-y-6">
                {[
                  {
                    step: 1,
                    title: 'Install the SDK',
                    code: 'npm install zeepay',
                  },
                  {
                    step: 2,
                    title: 'Create a payment on your server',
                    code: `import ZeePay from "zeepay";

const zee = new ZeePay(
  process.env.ZEEPAY_SECRET_KEY
);

const payment = await zee.payments.create({
  amount: 10,
  currency: "USD",
  reference: "invoice_1042"
});`,
                  },
                  {
                    step: 3,
                    title: 'Redirect the customer',
                    code: 'window.location.href = payment.checkoutUrl;',
                  },
                ].map((item) => (
                  <div key={item.step}>
                    <h3 className="text-base font-bold text-[#1a1650] mb-3 flex items-center gap-3">
                      <span className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {item.step}
                      </span>
                      {item.title}
                    </h3>
                    <div className="bg-[#1a1650] rounded-xl p-5 overflow-x-auto shadow-lg">
                      <pre className="text-xs sm:text-sm text-indigo-200 font-mono leading-relaxed">{item.code}</pre>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold text-[#1a1650] mb-4">Developer quickstart</h3>
                <p className="text-base text-gray-600 mb-8 leading-relaxed">
                  Get started with our test environment. No real payments are processed in sandbox mode.
                </p>
                <div className="space-y-5">
                  <div className="bg-[#f6f7fd] rounded-2xl p-5">
                    <h4 className="text-sm font-bold text-[#1a1650] mb-1.5">Test API keys</h4>
                    <p className="text-sm text-gray-600 mb-3">Use test keys for sandbox transactions</p>
                    <code className="text-xs bg-white border border-gray-200 px-3 py-2 rounded-lg block font-mono">zp_test_sk_demo_8d71</code>
                  </div>
                  <div className="bg-[#f6f7fd] rounded-2xl p-5">
                    <h4 className="text-sm font-bold text-[#1a1650] mb-1.5">Webhook testing</h4>
                    <p className="text-sm text-gray-600 mb-3">Simulate payment events to test your handlers</p>
                    <Link href="/dashboard/simulator" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                      Open simulator →
                    </Link>
                  </div>
                  <div className="bg-[#f6f7fd] rounded-2xl p-5">
                    <h4 className="text-sm font-bold text-[#1a1650] mb-1.5">Full documentation</h4>
                    <p className="text-sm text-gray-600 mb-3">Complete API reference and guides</p>
                    <Link href="/docs" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                      View docs →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ SECTION: Pricing ============ */}
        <section id="pricing" className="py-16 sm:py-24 bg-white scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1a1650]">Simple, transparent pricing</h2>
              <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                Pay only for what you use. No monthly fees, no hidden costs
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
              <div className="bg-[#f6f7fd] rounded-3xl p-8 flex flex-col">
                <h3 className="text-lg font-bold text-[#1a1650] mb-2">Mobile Money</h3>
                <p className="text-4xl font-extrabold text-[#1a1650] mb-1">1.5%</p>
                <p className="text-sm text-gray-500 mb-6">per transaction</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {['EcoCash', 'InnBucks', 'Omari', 'Instant settlement'].map((item) => (
                    <li key={item} className="text-sm text-gray-700 flex items-center gap-2.5">
                      <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-gray-500 mb-6">+$0.10 flat fee per transaction</p>
                <Link href="/auth/register" className="block text-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-lg py-3 transition-colors">
                  Get started
                </Link>
              </div>

              <div className="bg-[#1a1650] rounded-3xl p-8 flex flex-col relative md:scale-105 shadow-2xl">
                <span className="absolute top-5 right-5 bg-white text-[#1a1650] px-3 py-1 rounded-full text-xs font-bold">
                  POPULAR
                </span>
                <h3 className="text-lg font-bold text-white mb-2">Cards</h3>
                <p className="text-4xl font-extrabold text-white mb-1">2.0%</p>
                <p className="text-sm text-indigo-200 mb-6">per transaction</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {['Visa', 'Mastercard', 'American Express', 'International cards'].map((item) => (
                    <li key={item} className="text-sm text-indigo-100 flex items-center gap-2.5">
                      <svg className="w-4 h-4 text-indigo-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-indigo-200 mb-6">+$0.30 flat fee per transaction</p>
                <Link href="/auth/register" className="block text-center text-sm font-semibold bg-white text-[#1a1650] rounded-lg py-3 hover:bg-indigo-50 transition-colors">
                  Get started
                </Link>
              </div>

              <div className="bg-[#f6f7fd] rounded-3xl p-8 flex flex-col">
                <h3 className="text-lg font-bold text-[#1a1650] mb-2">Bank Transfer</h3>
                <p className="text-4xl font-extrabold text-[#1a1650] mb-1">0.8%</p>
                <p className="text-sm text-gray-500 mb-6">per transaction</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {['Zimbabwean banks', 'Same-day settlement', 'Bulk payments', 'Recurring payments'].map((item) => (
                    <li key={item} className="text-sm text-gray-700 flex items-center gap-2.5">
                      <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-gray-500 mb-6">+$0.05 flat fee per transaction</p>
                <Link href="/auth/register" className="block text-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-lg py-3 transition-colors">
                  Get started
                </Link>
              </div>
            </div>
            <div className="mt-10 p-6 bg-[#eef7f0] border border-green-200 rounded-2xl">
              <p className="text-sm sm:text-base text-green-900 text-center leading-relaxed">
                <strong>Better than Paynow:</strong> Lower transaction fees, faster settlement times, and a modern API for seamless integration. No monthly subscription fees — you only pay when you get paid.
              </p>
            </div>
          </div>
        </section>

        {/* ============ SECTION: Big CTA card ============ */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[#dfe3fa] rounded-[2rem] px-6 py-14 sm:py-20 text-center">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1a1650] max-w-3xl mx-auto leading-tight">
                Join hundreds of merchants already getting paid on ZeePay
              </h2>
              <Link
                href="/auth/register"
                className="mt-8 inline-flex items-center gap-2 bg-[#1a1650] text-white px-7 py-3.5 rounded-lg font-semibold hover:bg-[#2a2170] transition-colors"
              >
                Join now
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="bg-[#17124a] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
            <div className="col-span-2 md:col-span-1">
              <span className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
                <span className="text-xl font-extrabold">ZeePay</span>
              </span>
              <p className="mt-4 text-sm text-indigo-200 leading-relaxed">
                Payment infrastructure for African businesses.
              </p>
            </div>
            {[
              {
                title: 'Product',
                links: [
                  { label: 'Payments', href: '#payments' },
                  { label: 'Pricing', href: '#pricing' },
                  { label: 'Documentation', href: '/docs' },
                ],
              },
              {
                title: 'Company',
                links: [
                  { label: 'About', href: '/' },
                  { label: 'Get started', href: '/auth/register' },
                  { label: 'Sign in', href: '/auth/login' },
                ],
              },
              {
                title: 'Resources',
                links: [
                  { label: 'Support', href: '/docs' },
                  { label: 'API reference', href: '/docs' },
                  { label: 'Simulator', href: '/dashboard/simulator' },
                ],
              },
              {
                title: 'Legal',
                links: [
                  { label: 'Privacy', href: null },
                  { label: 'Terms', href: null },
                  { label: 'Security', href: null },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold mb-4 text-indigo-200">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.href ? (
                        <Link href={link.href} className="text-sm text-indigo-100/80 hover:text-white transition-colors">
                          {link.label}
                        </Link>
                      ) : (
                        <span className="text-sm text-indigo-100/50">{link.label} — coming soon</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-indigo-200">© 2026 ZeePay. All rights reserved.</p>
            <div className="flex gap-5">
              {[
                'M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z',
                'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z',
                'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
              ].map((d, i) => (
                <span key={i} className="text-indigo-300" aria-hidden="true">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d={d} /></svg>
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
