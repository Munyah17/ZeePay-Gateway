'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import DataTable from '@/components/DataTable';

interface Subscription {
  id: string;
  customer: string;
  method: string;
  amount: number;
  currency: string;
  interval: string;
  status: string;
  nextBilling: string;
  lastBilled: string;
  failedAttempts: number;
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authed = localStorage.getItem('zeepay_authed');
      if (!authed) {
        router.push('/auth/login');
        return;
      }
    }

    // Demo data — in production this comes from GET /api/v1/subscriptions
    setSubscriptions([
      {
        id: 'sub_8x21',
        customer: 'Tendai Mukono',
        method: 'EcoCash',
        amount: 25.00,
        currency: 'USD',
        interval: 'monthly',
        status: 'active',
        nextBilling: '2024-02-01',
        lastBilled: '2024-01-01',
        failedAttempts: 0,
      },
      {
        id: 'sub_8x22',
        customer: 'Rutendo Dube',
        method: 'Visa',
        amount: 49.99,
        currency: 'USD',
        interval: 'monthly',
        status: 'active',
        nextBilling: '2024-02-05',
        lastBilled: '2024-01-05',
        failedAttempts: 0,
      },
      {
        id: 'sub_8x23',
        customer: 'Simba Chikafu',
        method: 'InnBucks',
        amount: 10.00,
        currency: 'USD',
        interval: 'weekly',
        status: 'past_due',
        nextBilling: '2024-01-20',
        lastBilled: '2024-01-08',
        failedAttempts: 1,
      },
      {
        id: 'sub_8x24',
        customer: 'Nyasha Karemba',
        method: 'Omari',
        amount: 99.00,
        currency: 'USD',
        interval: 'yearly',
        status: 'pending',
        nextBilling: '—',
        lastBilled: '—',
        failedAttempts: 0,
      },
      {
        id: 'sub_8x25',
        customer: 'Chipo Moyo',
        method: 'EcoCash',
        amount: 15.00,
        currency: 'USD',
        interval: 'monthly',
        status: 'cancelled',
        nextBilling: '—',
        lastBilled: '2023-12-15',
        failedAttempts: 3,
      },
    ]);
    setLoading(false);
  }, [router]);

  const activeCount = subscriptions.filter((s) => s.status === 'active').length;
  const mrr = subscriptions
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => {
      const monthly = s.interval === 'weekly' ? s.amount * 4.33 : s.interval === 'yearly' ? s.amount / 12 : s.amount;
      return sum + monthly;
    }, 0);

  const columns = [
    { key: 'customer', label: 'Customer', sortable: true },
    { key: 'method', label: 'Auto-deduct via', sortable: true },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value: number, row: Subscription) => `${row.currency} ${value.toFixed(2)}`,
    },
    { key: 'interval', label: 'Interval', sortable: true },
    { key: 'nextBilling', label: 'Next Billing', sortable: true },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => <StatusBadge status={value} type="default" size="sm" />,
    },
  ];

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">Subscriptions</h2>
          <p className="text-muted mb-0">Recurring billing with auto-deduct on EcoCash, InnBucks, Omari and cards</p>
        </div>
        <button className="btn btn-primary btn-sm">
          <i className="bi bi-plus-circle me-2"></i>
          New Subscription
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="alert alert-success d-flex align-items-center gap-3 mb-4" role="alert">
            <i className="bi bi-lightning-charge-fill fs-4"></i>
            <div>
              <strong>Auto-deduct is live.</strong> ZeePay subscriptions debit your customers automatically on each
              billing date — including mobile money wallets that don't natively support recurring payments.
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Active Subscriptions</p>
                  <p className="h3 mb-0">{activeCount}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Monthly Recurring Revenue</p>
                  <p className="h3 mb-0 text-success">${mrr.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Past Due</p>
                  <p className="h3 mb-0 text-warning">
                    {subscriptions.filter((s) => s.status === 'past_due').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Pending Approval</p>
                  <p className="h3 mb-0">
                    {subscriptions.filter((s) => s.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title mb-0">All Subscriptions</h5>
            </div>
            <div className="card-body">
              <DataTable
                columns={columns}
                data={subscriptions}
                searchable
                searchableFields={['customer', 'method', 'id']}
                filters={[
                  {
                    key: 'status',
                    label: 'All statuses',
                    options: [
                      { value: 'active', label: 'Active' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'past_due', label: 'Past Due' },
                      { value: 'paused', label: 'Paused' },
                      { value: 'cancelled', label: 'Cancelled' },
                    ],
                  },
                ]}
                rowActions={(row) => (
                  <div className="d-flex gap-1 justify-content-end">
                    {row.status === 'active' && (
                      <button className="btn btn-sm btn-outline-warning">Pause</button>
                    )}
                    {row.status === 'paused' && (
                      <button className="btn btn-sm btn-outline-success">Resume</button>
                    )}
                    {(row.status === 'active' || row.status === 'past_due' || row.status === 'paused') && (
                      <button className="btn btn-sm btn-outline-danger">Cancel</button>
                    )}
                    {row.status === 'pending' && (
                      <button className="btn btn-sm btn-outline-primary">Resend approval</button>
                    )}
                  </div>
                )}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">How Auto-Deduct Works</h5>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="d-flex gap-3">
                    <span className="badge bg-primary rounded-circle p-2" style={{ width: '32px', height: '32px' }}>1</span>
                    <div>
                      <h6 className="mb-1">Customer authorizes once</h6>
                      <p className="small text-muted mb-0">
                        A mandate is created via <code>POST /v1/subscriptions</code>. The customer approves it once
                        — EcoCash PIN prompt, InnBucks approval, or card 3DS.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex gap-3">
                    <span className="badge bg-primary rounded-circle p-2" style={{ width: '32px', height: '32px' }}>2</span>
                    <div>
                      <h6 className="mb-1">ZeePay debits automatically</h6>
                      <p className="small text-muted mb-0">
                        On each billing date the billing engine calls the provider's mandate debit —
                        no customer action needed. Works on wallets without native recurring support.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex gap-3">
                    <span className="badge bg-primary rounded-circle p-2" style={{ width: '32px', height: '32px' }}>3</span>
                    <div>
                      <h6 className="mb-1">Smart retries on failure</h6>
                      <p className="small text-muted mb-0">
                        Failed debits retry automatically (subscription goes <em>past due</em>). You get
                        <code>subscription.charge_failed</code> webhooks for each attempt.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
