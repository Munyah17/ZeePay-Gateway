'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="navbar navbar-light border-bottom">
        <div className="container">
          <div className="d-flex justify-content-between w-100 align-items-center">
            <Link href="/" className="navbar-brand fw-bold">ZeePay</Link>
            <Link href="/auth/login" className="btn btn-sm btn-outline-primary">
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      <main className="d-flex align-items-center justify-content-center py-5 px-4">
        <div className="w-100" style={{ maxWidth: '400px' }}>
          {sent ? (
            <div className="text-center">
              <div className="mb-4">
                <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success-subtle" style={{ width: '64px', height: '64px' }}>
                  <i className="bi bi-check-lg fs-2 text-success"></i>
                </span>
              </div>
              <h2 className="h4">Check your email</h2>
              <p className="text-muted small">
                If an account exists for <strong>{email}</strong>, we've sent a password reset link. It expires in 30 minutes.
              </p>
              <Link href="/auth/login" className="btn btn-primary w-100 mt-3">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-4">
                <h2 className="h4">Reset your password</h2>
                <p className="text-muted small">Enter your email and we'll send you a reset link</p>
              </div>

              <form onSubmit={handleSubmit}>
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

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-100"
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <p className="small text-muted">
                  Remembered it?{' '}
                  <Link href="/auth/login" className="text-decoration-none fw-medium">
                    Sign in
                  </Link>
                </p>
                <p className="small text-muted mt-3">
                  <i className="bi bi-info-circle me-1"></i>
                  Prototype only · No real email is sent
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
