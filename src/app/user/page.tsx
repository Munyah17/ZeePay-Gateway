'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UserDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authed = localStorage.getItem('zeepay_authed');
      if (!authed) {
        router.push('/auth/login');
        return;
      }
    }
    setLoading(false);
    setBalance(1250.00);
  }, [router]);

  return (
    <>
      <div className="mb-4">
        <h2 className="h4">Welcome back!</h2>
        <p className="text-muted">Manage your payments and transactions</p>
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
            <div className="col-md-4">
              <div className="card bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                <div className="card-body">
                  <p className="small opacity-75 mb-1">Available Balance</p>
                  <p className="h2 mb-0">${balance.toFixed(2)}</p>
                  <p className="small opacity-75 mt-2">USD</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">This Month's Spending</p>
                  <p className="h3 mb-0">$450.00</p>
                  <p className="text-success small mt-2">↓ 12% vs last month</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Total Transactions</p>
                  <p className="h3 mb-0">28</p>
                  <p className="text-muted small mt-2">This month</p>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <div className="card h-100">
                <div className="card-header">
                  <h5 className="card-title mb-0">Quick Actions</h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-6">
                      <Link href="/user/send" className="btn btn-outline-primary w-100 h-100 d-flex flex-column align-items-center justify-content-center gap-2">
                        <i className="bi bi-send fs-4"></i>
                        <span className="small">Send Money</span>
                      </Link>
                    </div>
                    <div className="col-6">
                      <Link href="/user/airtime" className="btn btn-outline-success w-100 h-100 d-flex flex-column align-items-center justify-content-center gap-2">
                        <i className="bi bi-phone fs-4"></i>
                        <span className="small">Buy Airtime</span>
                      </Link>
                    </div>
                    <div className="col-6">
                      <Link href="/user/bills" className="btn btn-outline-warning w-100 h-100 d-flex flex-column align-items-center justify-content-center gap-2">
                        <i className="bi bi-receipt fs-4"></i>
                        <span className="small">Pay Bills</span>
                      </Link>
                    </div>
                    <div className="col-6">
                      <Link href="/user/cards" className="btn btn-outline-info w-100 h-100 d-flex flex-column align-items-center justify-content-center gap-2">
                        <i className="bi bi-credit-card-2-front fs-4"></i>
                        <span className="small">My Cards</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Recent Transactions</h5>
                  <Link href="/user/history" className="btn btn-sm btn-link">View all</Link>
                </div>
                <div className="card-body">
                  <div className="list-group list-group-flush">
                    {[
                      { name: 'Econet Airtime', amount: -10.00, date: '2 hours ago', icon: 'bi-phone', color: 'text-success' },
                      { name: 'ZESA Bill Payment', amount: -50.00, date: 'Yesterday', icon: 'bi-lightning', color: 'text-warning' },
                      { name: 'Received from John', amount: 100.00, date: '2 days ago', icon: 'bi-arrow-down-left', color: 'text-success' },
                      { name: 'NetOne Airtime', amount: -5.00, date: '3 days ago', icon: 'bi-phone', color: 'text-success' },
                    ].map((tx, i) => (
                      <div key={i} className="list-group-item d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                          <div className={`bg-light rounded-circle d-flex align-items-center justify-content-center ${tx.color}`}
                               style={{ width: '40px', height: '40px' }}>
                            <i className={`bi ${tx.icon}`}></i>
                          </div>
                          <div>
                            <h6 className="mb-0 small fw-medium">{tx.name}</h6>
                            <small className="text-muted">{tx.date}</small>
                          </div>
                        </div>
                        <span className={`fw-bold ${tx.amount > 0 ? 'text-success' : 'text-danger'}`}>
                          {tx.amount > 0 ? '+' : ''}${tx.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Payment Methods</h5>
            </div>
            <div className="card-body">
              <div className="row g-4">
                {[
                  { name: 'EcoCash', type: 'Mobile Money', icon: '📱', color: 'from-green-400 to-green-600' },
                  { name: 'InnBucks', type: 'Mobile Money', icon: '💰', color: 'from-blue-400 to-blue-600' },
                  { name: 'Visa Card', type: 'Card', icon: '💳', color: 'from-blue-600 to-blue-800' },
                ].map((method) => (
                  <div key={method.name} className="col-md-4">
                    <div className="card border hover:shadow-lg transition-all">
                      <div className="card-body text-center">
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${method.color} flex items-center justify-center text-3xl mb-3 mx-auto`}>
                          {method.icon}
                        </div>
                        <h6 className="fw-medium">{method.name}</h6>
                        <p className="text-muted small">{method.type}</p>
                        <span className="badge bg-success">Active</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
