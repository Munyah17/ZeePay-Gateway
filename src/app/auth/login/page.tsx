'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<'merchant' | 'admin' | 'user' | 'super-admin'>('merchant');

  const demoCredentials = {
    merchant: { email: 'merchant@acme.co.zw', password: 'DemoPass123!', redirect: '/dashboard' },
    admin: { email: 'admin@zeepay.co.zw', password: 'AdminPass123!', redirect: '/admin' },
    user: { email: 'user@example.co.zw', password: 'UserPass123!', redirect: '/user' },
    'super-admin': { email: 'ceo@zeepay.co.zw', password: 'SuperPass123!', redirect: '/super-admin' },
  };

  const fillCredentials = (role: keyof typeof demoCredentials) => {
    setUserRole(role);
    setEmail(demoCredentials[role].email);
    setPassword(demoCredentials[role].password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate authentication - in production this would call an API
    setTimeout(() => {
      const userData = {
        merchant: { name: 'John Doe', email: email, business: 'Acme Solutions', role: 'merchant' },
        admin: { name: 'Admin User', email: email, business: 'ZeePay', role: 'admin' },
        user: { name: 'Jane Smith', email: email, business: 'Personal', role: 'user' },
        'super-admin': { name: 'CEO', email: email, business: 'ZeePay Executive', role: 'super-admin' },
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('zeepay_user', JSON.stringify(userData[userRole]));
        localStorage.setItem('zeepay_authed', 'true');
      }
      router.push(demoCredentials[userRole].redirect);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="navbar navbar-light border-bottom">
        <div className="container">
          <div className="d-flex justify-content-between w-100 align-items-center">
            <Link href="/" className="navbar-brand fw-bold">ZeePay</Link>
            <Link href="/auth/register" className="btn btn-sm btn-outline-primary">
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      <main className="d-flex align-items-center justify-content-center py-5 px-4">
        <div className="w-100" style={{ maxWidth: '400px' }}>
          <div className="text-center mb-4">
            <h2 className="h4">Welcome back</h2>
            <p className="text-muted small">Log in to your ZeePay dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="alert alert-info" role="alert">
              <p className="small mb-2"><strong>Demo Mode:</strong> Click a button to auto-fill credentials</p>
              <div className="d-flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => fillCredentials('merchant')}
                  className={`btn btn-sm ${userRole === 'merchant' ? 'btn-primary' : 'btn-outline-primary'}`}
                >
                  Merchant
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('admin')}
                  className={`btn btn-sm ${userRole === 'admin' ? 'btn-primary' : 'btn-outline-primary'}`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('user')}
                  className={`btn btn-sm ${userRole === 'user' ? 'btn-primary' : 'btn-outline-primary'}`}
                >
                  User
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('super-admin')}
                  className={`btn btn-sm ${userRole === 'super-admin' ? 'btn-primary' : 'btn-outline-primary'}`}
                >
                  Super Admin
                </button>
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="email" className="form-label small">
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
                className="form-control form-control-sm"
                placeholder="you@example.com"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label small">
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
                className="form-control form-control-sm"
                placeholder="••••••••"
              />
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="form-check">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="form-check-input"
                />
                <label htmlFor="remember" className="form-check-label small">
                  Remember me
                </label>
              </div>
              <Link href="/auth/forgot-password" className="small text-decoration-none">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-100"
            >
              {loading ? 'Signing in...' : 'Log in'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="small text-muted">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-decoration-none fw-medium">
                Sign up
              </Link>
            </p>
            <p className="small text-muted mt-3">
              <i className="bi bi-info-circle me-1"></i>
              Prototype only · No real authentication
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
