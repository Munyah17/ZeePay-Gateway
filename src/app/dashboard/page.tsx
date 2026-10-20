'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalPayments: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  totalAmount: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalPayments: 0,
    successfulPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    totalAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string; business: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authed = localStorage.getItem('zeepay_authed');
      if (!authed) {
        router.push('/auth/login');
        return;
      }

      const userData = localStorage.getItem('zeepay_user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }

    fetchDashboardStats();
  }, [router]);

  useEffect(() => {
    if (!loading) {
      initCharts();
    }
  }, [loading]);

  const fetchDashboardStats = async () => {
    try {
      setStats({
        totalPayments: 150,
        successfulPayments: 142,
        pendingPayments: 5,
        failedPayments: 3,
        totalAmount: 15250.00,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const initCharts = () => {
    const ctx1 = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (ctx1) {
      new (window as any).Chart(ctx1, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Revenue',
            data: [12000, 19000, 15000, 25000, 22000, 30000],
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    }

    const ctx2 = document.getElementById('paymentMethodChart') as HTMLCanvasElement;
    if (ctx2) {
      new (window as any).Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: ['EcoCash', 'Visa', 'Mastercard', 'InnBucks'],
          datasets: [{
            data: [40, 30, 20, 10],
            backgroundColor: ['#0d6efd', '#198754', '#dc3545', '#ffc107']
          }]
        },
        options: {
          responsive: true
        }
      });
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('zeepay_authed');
      localStorage.removeItem('zeepay_user');
    }
    router.push('/');
  };

  return (
    <>
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <h2 className="h4">Good afternoon, {user?.name?.split(' ')[0] || 'John'} 👋</h2>
            <p className="text-muted">Here's what's happening with your payments</p>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-md-6 col-lg-3">
              <div className="card">
                <div className="card-body">
                  <h6 className="card-subtitle mb-2 text-muted">Total volume</h6>
                  <h3 className="card-title">$12,480</h3>
                  <p className="card-text text-success small">↑ 12.4% vs previous period</p>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card">
                <div className="card-body">
                  <h6 className="card-subtitle mb-2 text-muted">Successful payments</h6>
                  <h3 className="card-title">142</h3>
                  <p className="card-text text-success small">↑ 18.2% vs previous period</p>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card">
                <div className="card-body">
                  <h6 className="card-subtitle mb-2 text-muted">Pending payments</h6>
                  <h3 className="card-title">5</h3>
                  <p className="card-text text-danger small">↓ 50% vs previous period</p>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card">
                <div className="card-body">
                  <h6 className="card-subtitle mb-2 text-muted">Failed payments</h6>
                  <h3 className="card-title">2</h3>
                  <p className="card-text text-success small">↓ 3.1% vs previous period</p>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-lg-8">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Revenue Overview</h5>
                </div>
                <div className="card-body">
                  <canvas id="revenueChart" height="300"></canvas>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Payment Methods</h5>
                </div>
                <div className="card-body">
                  <canvas id="paymentMethodChart" height="300"></canvas>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <Link
                    href="/dashboard/transactions"
                    className="card text-decoration-none text-dark h-100"
                  >
                    <div className="card-body">
                      <i className="bi bi-credit-card fs-2 text-primary mb-2"></i>
                      <h6 className="card-title">View Transactions</h6>
                      <p className="card-text small text-muted">Browse all payment transactions</p>
                    </div>
                  </Link>
                </div>
                <div className="col-md-4">
                  <Link
                    href="/dashboard/settings"
                    className="card text-decoration-none text-dark h-100"
                  >
                    <div className="card-body">
                      <i className="bi bi-key fs-2 text-primary mb-2"></i>
                      <h6 className="card-title">API Keys</h6>
                      <p className="card-text small text-muted">Manage your API credentials</p>
                    </div>
                  </Link>
                </div>
                <div className="col-md-4">
                  <Link
                    href="/dashboard/settings"
                    className="card text-decoration-none text-dark h-100"
                  >
                    <div className="card-body">
                      <i className="bi bi-gear fs-2 text-primary mb-2"></i>
                      <h6 className="card-title">Webhooks</h6>
                      <p className="card-text small text-muted">Configure webhook endpoints</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Recent Transactions</h5>
              <Link href="/dashboard/transactions" className="btn btn-sm btn-outline-primary">
                View all
              </Link>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>INV-1042</td>
                      <td>$10.00</td>
                      <td><span className="badge bg-success">Succeeded</span></td>
                      <td>2 min ago</td>
                    </tr>
                    <tr>
                      <td>INV-1041</td>
                      <td>$25.00</td>
                      <td><span className="badge bg-success">Succeeded</span></td>
                      <td>5 min ago</td>
                    </tr>
                    <tr>
                      <td>INV-1040</td>
                      <td>$20.00</td>
                      <td><span className="badge bg-warning text-dark">Pending</span></td>
                      <td>12 min ago</td>
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
