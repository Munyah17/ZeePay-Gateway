'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('john@acmesolutions.co.zw');
  const [password, setPassword] = useState('DemoPass123!');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate authentication - in production this would call an API
    setTimeout(() => {
      localStorage.setItem('zeepay_user', JSON.stringify({
        name: 'John Doe',
        email: email,
        business: 'Acme Solutions'
      }));
      localStorage.setItem('zeepay_authed', 'true');
      router.push('/dashboard');
    }, 500);
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
              <Link href="/auth/register" className="text-xs text-gray-600 hover:text-gray-900">
                Don't have an account? Sign up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-xl font-semibold text-gray-900">Welcome back</h1>
            <p className="text-xs text-gray-600 mt-2">Log in to your ZeePay dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:outline-none focus:border-gray-500"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="h-3 w-3 border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 text-xs text-gray-600">
                  Remember me
                </label>
              </div>
              <Link href="/auth/forgot-password" className="text-xs text-gray-600 hover:text-gray-900">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-2 rounded text-xs hover:bg-gray-800 disabled:bg-gray-300"
            >
              {loading ? 'Signing in...' : 'Log in'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-gray-900 hover:underline">
                Sign up
              </Link>
            </p>
            <p className="text-xs text-gray-500 mt-4">
              Prototype only · No real authentication is performed
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
