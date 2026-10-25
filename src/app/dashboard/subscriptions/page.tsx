'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import DataTable from '@/components/DataTable';
import { Modal, ConfirmDialog, ToastProvider, toast } from '@/components/ui';

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cancelling, setCancelling] = useState<Subscription | null>(null);
  const [form, setForm] = useState({ customer: '', method: 'EcoCash', amount: '', interval: 'monthly' });

  const persist = (next: Subscription[]) => {
    setSubscriptions(next);
    try { localStorage.setItem('zeepay_subscriptions', JSON.stringify(next)); } catch { /* noop */ }
  };

  const updateStatus = (sub: Subscription, status: string, msg: string) => {
    persist(subscriptions.map((s) => (s.id === sub.id ? { ...s, status } : s)));
    toast(msg);
  };

  const createSubscription = () => {
    const amount = parseFloat(form.amount);
    if (!form.customer.trim() || !amount || amount <= 0) {
      toast('Customer and a valid amount are required', 'warning');
      return;
    }
    const sub: Subscription = {
      id: `sub_${Math.random().toString(36).slice(2, 6)}`,
      customer: form.customer.trim(),
      method: form.method,
      amount,
      currency: 'USD',
      interval: form.interval,
      status: 'pending',
      nextBilling: '—',
      lastBilled: '—',
      failedAttempts: 0,
    };
    persist([sub, ...subscriptions]);
    setShowCreateModal(false);
    setForm({ customer: '', method: 'EcoCash', amount: '', interval: 'monthly' });
    toast(`Mandate sent to ${sub.customer} for approval`);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authed = localStorage.getItem('zeepay_authed');
      if (!authed) {
        router.push('/auth/login');
        return;
      }
    }

    const seed: Subscription[] = [
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
    ];
    try {
      const saved = localStorage.getItem('zeepay_subscriptions');
      setSubscriptions(saved ? JSON.parse(saved) : seed);
    } catch {
      setSubscriptions(seed);
    }
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
    <ToastProvider>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">Subscriptions</h2>
          <p className="text-muted mb-0">Recurring billing with auto-deduct on EcoCash, InnBucks, Omari and cards</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
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
                exportable
                exportName="subscriptions"
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
                rowActions={(row: Subscription) => (
                  <div className="d-flex gap-1 justify-content-end">
                    {row.status === 'active' && (
                      <button
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => updateStatus(row, 'paused', `${row.id} paused`)}
                      >
                        Pause
                      </button>
                    )}
                    {row.status === 'paused' && (
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => updateStatus(row, 'active', `${row.id} resumed`)}
                      >
                        Resume
                      </button>
                    )}
                    {(row.status === 'active' || row.status === 'past_due' || row.status === 'paused') && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => setCancelling(row)}
                      >
                        Cancel
                      </button>
                    )}
                    {row.status === 'pending' && (
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => toast(`Approval request resent to ${row.customer}`)}
                      >
                        Resend approval
                      </button>
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

      {/* Create subscription modal */}
      {showCreateModal && (
        <Modal
          title="New Subscription"
          onClose={() => setShowCreateModal(false)}
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={createSubscription}>Create & send mandate</button>
            </>
          }
        >
          <div className="mb-3">
            <label className="form-label small">Customer name *</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={form.customer}
              onChange={(e) => setForm({ ...form, customer: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label small">Auto-deduct via</label>
            <select
              className="form-select form-select-sm"
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}
            >
              <option>EcoCash</option>
              <option>InnBucks</option>
              <option>Omari</option>
              <option>Visa</option>
              <option>Mastercard</option>
            </select>
          </div>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small">Amount (USD) *</label>
              <input
                type="number"
                className="form-control form-control-sm"
                step="0.01"
                min="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small">Interval</label>
              <select
                className="form-select form-select-sm"
                value={form.interval}
                onChange={(e) => setForm({ ...form, interval: e.target.value })}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <p className="text-muted small mt-3 mb-0">
            The customer will receive a mandate approval request. Billing starts once approved.
          </p>
        </Modal>
      )}

      {/* Cancel confirm */}
      {cancelling && (
        <ConfirmDialog
          title="Cancel subscription"
          message={`Cancel ${cancelling.id} for ${cancelling.customer}? The mandate will be revoked and no further debits will occur.`}
          confirmLabel="Cancel subscription"
          tone="danger"
          onConfirm={() => {
            updateStatus(cancelling, 'cancelled', `${cancelling.id} cancelled`);
            setCancelling(null);
          }}
          onCancel={() => setCancelling(null)}
        />
      )}
    </ToastProvider>
  );
}
