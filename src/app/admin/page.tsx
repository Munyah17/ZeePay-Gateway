'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

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

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('zeepay_authed');
      localStorage.removeItem('zeepay_user');
    }
    router.push('/');
  };

  return (
    <>
      <div className="mb-4">
        <h2 className="h4">Platform overview</h2>
        <p className="text-muted">Monitor payment activity, merchants, and provider health</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="row g-4 mb-4">
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Total volume</p>
                  <p className="h3 mb-0">$248,030</p>
                  <p className="text-success small mt-2">↑ 12.4% vs previous period</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Active merchants</p>
                  <p className="h3 mb-0">48</p>
                  <p className="text-success small mt-2">↑ 8 this month</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Payment success rate</p>
                  <p className="h3 mb-0">98.7%</p>
                  <p className="text-success small mt-2">↑ 0.8 percentage points</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Open issues</p>
                  <p className="h3 mb-0">12</p>
                  <p className="text-danger small mt-2">4 require attention</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Provider health</h5>
              <Link href="/admin/providers" className="btn btn-sm btn-outline-primary">
                View all →
              </Link>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                {[
                  { name: 'EcoCash', status: 'Connected', success: '98.6%' },
                  { name: 'InnBucks', status: 'Connected', success: '97.8%' },
                  { name: 'Omari', status: 'Connected', success: '96.9%' },
                  { name: 'Visa & Mastercard', status: 'Sandbox', success: '99.1%' },
                ].map((provider) => (
                  <div key={provider.name} className="list-group-item d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-light rounded d-flex align-items-center justify-content-center"
                           style={{ width: '32px', height: '32px' }}>
                        <span className="fw-bold text-muted small">{provider.name.substring(0, 2).toUpperCase()}</span>
                      </div>
                      <div>
                        <h6 className="mb-0 small fw-medium">{provider.name}</h6>
                        <small className="text-muted">{provider.success} successful</small>
                      </div>
                    </div>
                    <span className={`badge ${provider.status === 'Connected' ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {provider.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Recent platform transactions</h5>
              <Link href="/admin/transactions" className="btn btn-sm btn-outline-primary">
                View all →
              </Link>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Payment ID</th>
                      <th>Merchant</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-monospace small">pay_8x2k91</td>
                      <td>Acme Solutions</td>
                      <td>$10.00</td>
                      <td><span className="badge bg-success">Succeeded</span></td>
                      <td className="text-muted">2 min ago</td>
                    </tr>
                    <tr>
                      <td className="font-monospace small">pay_7m4422</td>
                      <td>Acme Solutions</td>
                      <td>$50.00</td>
                      <td><span className="badge bg-success">Succeeded</span></td>
                      <td className="text-muted">5 min ago</td>
                    </tr>
                    <tr>
                      <td className="font-monospace small">pay_9q0678</td>
                      <td>TechGlobal Ltd</td>
                      <td>$15.00</td>
                      <td><span className="badge bg-danger">Failed</span></td>
                      <td className="text-muted">32 min ago</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
