'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('John Doe');
  const [business, setBusiness] = useState('Acme Solutions');
  const [email, setEmail] = useState('john@acmesolutions.co.zw');
  const [password, setPassword] = useState('DemoPass123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewRequired, setReviewRequired] = useState(false);
  const [reviewReason, setReviewReason] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Browser-observable fingerprint material — hashed server-side.
  // (A client's MAC address is not visible over HTTP; this is the
  // observable substitute for the multi-account policy.)
  const deviceFingerprint = () =>
    [
      navigator.userAgent,
      navigator.language,
      `${screen.width}x${screen.height}`,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ].join('|');

  const submitReviewRequest = async () => {
    const res = await fetch('/api/v1/fraud/multi-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, businessName: business, reason: reviewReason }),
    });
    if (res.ok) setReviewSubmitted(true);
    else setError('Could not submit the review request — try again.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          businessName: business,
          email,
          password,
          deviceFingerprint: deviceFingerprint(),
        }),
      });
      const data = await res.json();

      if (res.status === 403 && data.reviewRequired) {
        // Fraud gate flagged the signup — offer the manual review path
        setReviewRequired(true);
        setError(data.message);
        return;
      }
      if (!res.ok) {
        setError(data.message || data.error || 'Registration failed');
        return;
      }

      localStorage.setItem('zeepay_user', JSON.stringify({
        name: data.user.name,
        email: data.user.email,
        business: data.merchant.businessName,
        token: data.token,
      }));
      localStorage.setItem('zeepay_authed', 'true');
      router.push('/dashboard');
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center">
              <Link href="/" className="text-sm font-semibold text-gray-900">ZeePay</Link>
            </div>
            <div className="flex items-center">
              <Link href="/auth/login" className="text-xs text-gray-600 hover:text-gray-900">
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-xl font-semibold text-gray-900">Create your account</h1>
            <p className="text-xs text-gray-600 mt-2">Get started with the ZeePay sandbox. No real payments are processed in this prototype.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:outline-none focus:border-gray-500"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label htmlFor="business" className="block text-xs font-medium text-gray-700 mb-1">
                Business name
              </label>
              <input
                id="business"
                name="business"
                type="text"
                required
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:outline-none focus:border-gray-500"
                placeholder="Your business name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:outline-none focus:border-gray-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:outline-none focus:border-gray-500"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-3 w-3 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 text-xs text-gray-600">
                I agree to the demo Terms of Service and Privacy Policy.
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-2 rounded text-xs hover:bg-gray-800 disabled:bg-gray-300"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          {reviewRequired && !reviewSubmitted && (
            <div className="mt-4 border border-amber-300 bg-amber-50 rounded p-4">
              <p className="text-xs font-medium text-amber-900">
                Need a second account? Explain why and our team will review it manually.
              </p>
              <textarea
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                rows={3}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded text-xs focus:outline-none focus:border-gray-500"
                placeholder="e.g. I run two legally separate businesses..."
              />
              <button
                onClick={submitReviewRequest}
                disabled={reviewReason.trim().length < 20}
                className="mt-2 w-full bg-amber-600 text-white py-2 rounded text-xs hover:bg-amber-700 disabled:bg-amber-300"
              >
                Request manual review
              </button>
            </div>
          )}

          {reviewSubmitted && (
            <div className="mt-4 border border-green-300 bg-green-50 rounded p-4 text-xs text-green-800">
              Review request submitted — we will contact you at {email} within 2 business days.
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-gray-900 hover:underline">
                Log in
              </Link>
            </p>
            <p className="text-xs text-gray-500 mt-4">
              Prototype only · No real account is created
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
