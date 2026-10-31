'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import DataTable from '@/components/DataTable';
import { Modal, useToast, usePersistentState } from '@/components/ui';

interface Plan {
  id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  interval: string;
  intervalCount: number;
  isActive: boolean;
  subscribers: number;
  createdAt: string;
}

const seedPlans: Plan[] = [
  {
    id: 'plan_basic',
    name: 'Basic Monthly',
    description: 'Entry tier, billed monthly',
    amount: 10,
    currency: 'USD',
    interval: 'monthly',
    intervalCount: 1,
    isActive: true,
    subscribers: 42,
    createdAt: '2024-01-05',
  },
  {
    id: 'plan_pro',
    name: 'Pro Monthly',
    description: 'Pro tier with priority support',
    amount: 25,
    currency: 'USD',
    interval: 'monthly',
    intervalCount: 1,
    isActive: true,
    subscribers: 18,
    createdAt: '2024-01-05',
  },
  {
    id: 'plan_annual',
    name: 'Pro Annual',
    description: 'Pro tier, yearly billing — two months free',
    amount: 250,
    currency: 'USD',
    interval: 'yearly',
    intervalCount: 1,
    isActive: true,
    subscribers: 6,
    createdAt: '2024-01-12',
  },
];

export default function PlansPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [plans, persist] = usePersistentState<Plan[]>('subscription-plans', seedPlans);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', amount: '', interval: 'monthly', intervalCount: '1' });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authed = localStorage.getItem('zeepay_authed');
      if (!authed) {
        router.push('/auth/login');
        return;
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(false);
  }, [router]);

  const createPlan = () => {
    const amount = parseFloat(form.amount);
    const intervalCount = parseInt(form.intervalCount, 10) || 1;
    if (!form.name.trim() || isNaN(amount) || amount <= 0) {
      toast('Enter a plan name and a valid amount', { tone: 'warning' });
      return;
    }
    const plan: Plan = {
      id: `plan_${Date.now().toString(36)}`,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      amount,
      currency: 'USD',
      interval: form.interval,
      intervalCount,
      isActive: true,
      subscribers: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    persist([plan, ...plans]);
    setShowCreateModal(false);
    setForm({ name: '', description: '', amount: '', interval: 'monthly', intervalCount: '1' });
    toast(`Plan "${plan.name}" created — subscribe customers via POST /v1/subscriptions with planId`);
  };

  const toggleActive = (plan: Plan) => {
    persist(plans.map((p) => (p.id === plan.id ? { ...p, isActive: !p.isActive } : p)));
    toast(plan.isActive ? `${plan.name} deactivated` : `${plan.name} reactivated`);
  };

  const mrr = plans
    .filter((p) => p.isActive)
    .reduce((sum, p) => {
      const monthly = p.interval === 'weekly' ? p.amount * 4.33 : p.interval === 'yearly' ? p.amount / 12 : p.interval === 'daily' ? p.amount * 30 : p.amount;
      return sum + (monthly * p.subscribers) / p.intervalCount;
    }, 0);

  const columns = [
    { key: 'name', label: 'Plan', sortable: true },
    {
      key: 'amount',
      label: 'Price',
      sortable: true,
      render: (value: number, row: Plan) =>
        `${row.currency} ${value.toFixed(2)} / ${row.intervalCount > 1 ? `${row.intervalCount} ` : ''}${row.interval.replace('ly', '')}${row.intervalCount > 1 ? 's' : ''}`,
    },
    { key: 'subscribers', label: 'Subscribers', sortable: true },
    { key: 'createdAt', label: 'Created', sortable: true },
    {
      key: 'isActive',
      label: 'Status',
      render: (value: boolean) => <StatusBadge status={value ? 'active' : 'cancelled'} type="default" size="sm" />,
    },
  ];

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">Subscription Plans</h2>
          <p className="text-muted mb-0">
            Reusable billing templates — subscribe customers by planId, upgrade/downgrade anytime
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
          <i className="bi bi-plus-circle me-2"></i>
          New Plan
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
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Active Plans</p>
                  <p className="h3 mb-0">{plans.filter((p) => p.isActive).length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Total Subscribers</p>
                  <p className="h3 mb-0">{plans.reduce((s, p) => s + p.subscribers, 0)}</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Projected MRR</p>
                  <p className="h3 mb-0 text-success">${mrr.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title mb-0">All Plans</h5>
            </div>
            <div className="card-body">
              <DataTable
                columns={columns}
                data={plans}
                searchable
                searchableFields={['name', 'description', 'id']}
                exportable
                exportName="subscription-plans"
                rowActions={(row: Plan) => (
                  <div className="d-flex gap-1 justify-content-end">
                    <button
                      className={`btn btn-sm ${row.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                      onClick={() => toggleActive(row)}
                    >
                      {row.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </div>
                )}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Using Plans via API</h5>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-4">
                  <h6 className="mb-1">Create</h6>
                  <p className="small text-muted mb-0">
                    <code>POST /v1/plans</code> with amount, currency and interval — returns a
                    <code>planId</code>.
                  </p>
                </div>
                <div className="col-md-4">
                  <h6 className="mb-1">Subscribe</h6>
                  <p className="small text-muted mb-0">
                    <code>POST /v1/subscriptions</code> with <code>planId</code> — or a
                    <code>savedPaymentMethodId</code> to bill a tokenised card with no new approval.
                  </p>
                </div>
                <div className="col-md-4">
                  <h6 className="mb-1">Upgrade / downgrade</h6>
                  <p className="small text-muted mb-0">
                    <code>PATCH /v1/subscriptions/:id</code> with <code>{`{ "action": "change_plan", "planId": "..." }`}</code> —
                    new terms apply from the next billing date.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {showCreateModal && (
        <Modal open
          title="New Plan"
          onClose={() => setShowCreateModal(false)}
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={createPlan}>Create plan</button>
            </>
          }
        >
          <div className="mb-3">
            <label className="form-label small">Plan name *</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label small">Description</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="row g-3">
            <div className="col-md-4">
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
            <div className="col-md-4">
              <label className="form-label small">Interval</label>
              <select
                className="form-select form-select-sm"
                value={form.interval}
                onChange={(e) => setForm({ ...form, interval: e.target.value })}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small">Every N intervals</label>
              <input
                type="number"
                className="form-control form-control-sm"
                min="1"
                value={form.intervalCount}
                onChange={(e) => setForm({ ...form, intervalCount: e.target.value })}
              />
            </div>
          </div>
          <p className="text-muted small mt-3 mb-0">
            Customers subscribe to plans with a single authorisation — ZeePay auto-deducts on each
            billing date.
          </p>
        </Modal>
      )}
    </>
  );
}
