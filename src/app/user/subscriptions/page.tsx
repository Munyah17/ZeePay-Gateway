'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';

interface UserSubscription {
  id: string;
  merchant: string;
  description: string;
  method: string;
  amount: number;
  currency: string;
  interval: string;
  status: string;
  nextDebit: string;
  mandateSince: string;
}

export default function UserSubscriptionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authed = localStorage.getItem('zeepay_authed');
      if (!authed) {
        router.push('/auth/login');
        return;
      }
    }

    setSubscriptions([
      {
        id: 'sub_a1',
        merchant: 'Netflix Zimbabwe',
        description: 'Standard plan',
        method: 'EcoCash ••• 5678',
        amount: 7.99,
        currency: 'USD',
        interval: 'monthly',
        status: 'active',
        nextDebit: '2024-02-01',
        mandateSince: '2023-06-15',
      },
      {
        id: 'sub_a2',
        merchant: 'Harare Gym Club',
        description: 'Monthly membership',
        method: 'InnBucks ••• 9012',
        amount: 30.00,
        currency: 'USD',
        interval: 'monthly',
        status: 'active',
        nextDebit: '2024-02-10',
        mandateSince: '2023-11-02',
      },
      {
        id: 'sub_a3',
        merchant: 'ZimCloud Storage',
        description: '100GB plan',
        method: 'Visa ••• 4242',
        amount: 2.99,
        currency: 'USD',
        interval: 'monthly',
        status: 'past_due',
        nextDebit: '2024-01-21 (retry)',
        mandateSince: '2023-08-20',
      },
      {
        id: 'sub_a4',
        merchant: 'DStv',
        description: 'Compact bouquet',
        method: 'EcoCash ••• 5678',
        amount: 29.00,
        currency: 'USD',
        interval: 'monthly',
        status: 'cancelled',
        nextDebit: '—',
        mandateSince: '2023-03-01',
      },
    ]);
    setLoading(false);
  }, [router]);

  const cancelSubscription = (id: string) => {
    setSubscriptions((subs) =>
      subs.map((s) => (s.id === id ? { ...s, status: 'cancelled', nextDebit: '—' } : s))
    );
  };

  const activeCount = subscriptions.filter((s) => s.status === 'active').length;
  const monthlySpend = subscriptions
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <>
      <div className="mb-4">
        <h2 className="h4 mb-1">Subscriptions & Auto-Deduct</h2>
        <p className="text-muted mb-0">Merchants you've authorized to debit you automatically</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Active Auto-Deducts</p>
                  <p className="h3 mb-0">{activeCount}</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Monthly Spend</p>
                  <p className="h3 mb-0">${monthlySpend.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Needs Attention</p>
                  <p className="h3 mb-0 text-warning">
                    {subscriptions.filter((s) => s.status === 'past_due').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {subscriptions.map((sub) => (
              <div className="col-md-6" key={sub.id}>
                <div className="card h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="card-title mb-1">{sub.merchant}</h5>
                        <p className="text-muted small mb-0">{sub.description}</p>
                      </div>
                      <StatusBadge status={sub.status} type="default" size="sm" />
                    </div>
                    <div className="d-flex justify-content-between align-items-center py-2 border-top">
                      <span className="h4 mb-0">${sub.amount.toFixed(2)}</span>
                      <span className="text-muted small">per {sub.interval.replace('ly', '')}</span>
                    </div>
                    <ul className="list-group list-group-flush small">
                      <li className="list-group-item d-flex justify-content-between px-0">
                        <span className="text-muted">Debit method</span>
                        <span>{sub.method}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between px-0">
                        <span className="text-muted">Next debit</span>
                        <span>{sub.nextDebit}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between px-0">
                        <span className="text-muted">Authorized since</span>
                        <span>{sub.mandateSince}</span>
                      </li>
                    </ul>
                    <div className="mt-3 d-flex gap-2">
                      {sub.status === 'active' && (
                        <>
                          <button className="btn btn-sm btn-outline-secondary flex-fill">Pause</button>
                          <button
                            className="btn btn-sm btn-outline-danger flex-fill"
                            onClick={() => cancelSubscription(sub.id)}
                          >
                            Stop auto-deduct
                          </button>
                        </>
                      )}
                      {sub.status === 'past_due' && (
                        <button className="btn btn-sm btn-warning flex-fill">Top up & retry</button>
                      )}
                      {sub.status === 'cancelled' && (
                        <button className="btn btn-sm btn-outline-primary flex-fill">Re-subscribe</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="alert alert-info d-flex align-items-center gap-3 mt-4" role="alert">
            <i className="bi bi-shield-check fs-4"></i>
            <div className="small">
              You only authorize each merchant once. ZeePay debits you automatically on each billing date —
              you can pause or stop any auto-deduct at any time. You'll get an SMS before each debit.
            </div>
          </div>
        </>
      )}
    </>
  );
}
