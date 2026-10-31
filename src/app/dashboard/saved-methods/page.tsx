'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import DataTable from '@/components/DataTable';
import { Modal, useToast, usePersistentState } from '@/components/ui';

interface SavedMethod {
  id: string;
  customer: string;
  customerEmail: string;
  provider: string;
  type: string;
  cardBrand?: string;
  cardLast4?: string;
  cardExpiry?: string;
  status: string;
  isDefault: boolean;
  createdAt: string;
}

const seedMethods: SavedMethod[] = [
  {
    id: 'pm_7a01',
    customer: 'Tendai Mukono',
    customerEmail: 'tendai@example.com',
    provider: 'ZimSwitch',
    type: 'card',
    cardBrand: 'Visa',
    cardLast4: '4242',
    cardExpiry: '12/27',
    status: 'active',
    isDefault: true,
    createdAt: '2024-01-15',
  },
  {
    id: 'pm_7a02',
    customer: 'Tendai Mukono',
    customerEmail: 'tendai@example.com',
    provider: 'ZimSwitch',
    type: 'card',
    cardBrand: 'Mastercard',
    cardLast4: '5454',
    cardExpiry: '08/26',
    status: 'active',
    isDefault: false,
    createdAt: '2024-01-20',
  },
  {
    id: 'pm_7a03',
    customer: 'Rutendo Dube',
    customerEmail: 'rutendo@example.com',
    provider: 'ZimSwitch',
    type: 'card',
    cardBrand: 'ZimSwitch',
    cardLast4: '6033',
    cardExpiry: '03/28',
    status: 'active',
    isDefault: true,
    createdAt: '2024-01-18',
  },
  {
    id: 'pm_7a04',
    customer: 'Simba Chikafu',
    customerEmail: 'simba@example.com',
    provider: 'ZimSwitch',
    type: 'card',
    cardBrand: 'Visa',
    cardLast4: '1111',
    cardExpiry: '11/25',
    status: 'revoked',
    isDefault: false,
    createdAt: '2023-12-02',
  },
];

export default function SavedMethodsPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [methods, persist] = usePersistentState<SavedMethod[]>('saved-methods', seedMethods);
  const [removing, setRemoving] = useState<SavedMethod | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [form, setForm] = useState({ customer: '', email: '', brand: 'Visa', last4: '', expiry: '' });

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

  const setDefault = (method: SavedMethod) => {
    persist(
      methods.map((m) => ({
        ...m,
        isDefault:
          m.customerEmail === method.customerEmail ? m.id === method.id : m.isDefault,
      }))
    );
    toast(`${method.cardBrand} •••• ${method.cardLast4} set as default for ${method.customer}`);
  };

  const registerMethod = () => {
    if (!form.customer.trim() || !form.email.trim() || form.last4.length !== 4) {
      toast('Enter customer name, email and last 4 digits', { tone: 'warning' });
      return;
    }
    const method: SavedMethod = {
      id: `pm_${Date.now().toString(36)}`,
      customer: form.customer.trim(),
      customerEmail: form.email.trim(),
      provider: 'ZimSwitch',
      type: 'card',
      cardBrand: form.brand,
      cardLast4: form.last4,
      cardExpiry: form.expiry || undefined,
      status: 'pending',
      isDefault: false,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    persist([method, ...methods]);
    setShowRegisterModal(false);
    setForm({ customer: '', email: '', brand: 'Visa', last4: '', expiry: '' });
    toast(`Tokenisation request sent — customer completes card entry on the hosted widget`, { tone: 'info' });
  };

  const activeCount = methods.filter((m) => m.status === 'active').length;
  const uniqueCustomers = new Set(methods.filter((m) => m.status === 'active').map((m) => m.customerEmail)).size;

  const columns = [
    { key: 'customer', label: 'Customer', sortable: true },
    { key: 'customerEmail', label: 'Email', sortable: true },
    {
      key: 'cardBrand',
      label: 'Card',
      render: (value: string | undefined, row: SavedMethod) =>
        value ? `${value} •••• ${row.cardLast4}` : row.type,
    },
    { key: 'cardExpiry', label: 'Expires', sortable: true },
    { key: 'provider', label: 'Tokenised via', sortable: true },
    {
      key: 'isDefault',
      label: 'Default',
      render: (value: boolean) =>
        value ? <span className="badge bg-primary-subtle text-primary">Default</span> : '',
    },
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
          <h2 className="h4 mb-1">Saved Payment Methods</h2>
          <p className="text-muted mb-0">
            Tokenised cards for one-click checkout and auto-deduct — card numbers are never stored
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowRegisterModal(true)}>
          <i className="bi bi-plus-circle me-2"></i>
          Tokenise a Card
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
          <div className="alert alert-info d-flex align-items-center gap-3 mb-4" role="alert">
            <i className="bi bi-shield-lock-fill fs-4"></i>
            <div>
              <strong>Tokenisation is live.</strong> Customers authorise their card once on the
              ZimSwitch-hosted widget; ZeePay stores only the token — never the card number or CVV.
              Saved methods power one-click checkout and subscription auto-deduct.
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Active Tokens</p>
                  <p className="h3 mb-0">{activeCount}</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Customers with Saved Cards</p>
                  <p className="h3 mb-0">{uniqueCustomers}</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Pending Tokenisation</p>
                  <p className="h3 mb-0 text-warning">
                    {methods.filter((m) => m.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title mb-0">All Saved Payment Methods</h5>
            </div>
            <div className="card-body">
              <DataTable
                columns={columns}
                data={methods}
                searchable
                searchableFields={['customer', 'customerEmail', 'cardBrand', 'cardLast4']}
                exportable
                exportName="saved-payment-methods"
                filters={[
                  {
                    key: 'status',
                    label: 'All statuses',
                    options: [
                      { value: 'active', label: 'Active' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'revoked', label: 'Revoked' },
                    ],
                  },
                ]}
                rowActions={(row: SavedMethod) => (
                  <div className="d-flex gap-1 justify-content-end">
                    {row.status === 'active' && !row.isDefault && (
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setDefault(row)}
                      >
                        Set default
                      </button>
                    )}
                    {row.status === 'pending' && (
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => {
                          persist(methods.map((m) => (m.id === row.id ? { ...m, status: 'active' } : m)));
                          toast(`${row.cardBrand} •••• ${row.cardLast4} activated`);
                        }}
                      >
                        Activate
                      </button>
                    )}
                    {row.status !== 'revoked' && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => setRemoving(row)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">How Tokenisation Works</h5>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="d-flex gap-3">
                    <span className="badge bg-primary rounded-circle p-2" style={{ width: '32px', height: '32px' }}>1</span>
                    <div>
                      <h6 className="mb-1">Customer saves card once</h6>
                      <p className="small text-muted mb-0">
                        <code>POST /v1/saved-payment-methods</code> returns a hosted tokenisation
                        widget URL. Card data is entered at ZimSwitch — never on your servers.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex gap-3">
                    <span className="badge bg-primary rounded-circle p-2" style={{ width: '32px', height: '32px' }}>2</span>
                    <div>
                      <h6 className="mb-1">Token is stored, not the card</h6>
                      <p className="small text-muted mb-0">
                        ZeePay stores the provider token + brand/last4 for display. You get a
                        <code>payment_method.activated</code> webhook when it is ready.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex gap-3">
                    <span className="badge bg-primary rounded-circle p-2" style={{ width: '32px', height: '32px' }}>3</span>
                    <div>
                      <h6 className="mb-1">Charge in one click</h6>
                      <p className="small text-muted mb-0">
                        Pass <code>savedPaymentMethodId</code> to <code>POST /v1/payments</code> —
                        the card is charged instantly, or to <code>/v1/subscriptions</code> for auto-deduct.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Register card modal */}
      {showRegisterModal && (
        <Modal open
          title="Tokenise a Card"
          onClose={() => setShowRegisterModal(false)}
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowRegisterModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={registerMethod}>Send tokenisation request</button>
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
            <label className="form-label small">Customer email *</label>
            <input
              type="email"
              className="form-control form-control-sm"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label small">Brand</label>
              <select
                className="form-select form-select-sm"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              >
                <option>Visa</option>
                <option>Mastercard</option>
                <option>ZimSwitch</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small">Last 4 digits *</label>
              <input
                type="text"
                className="form-control form-control-sm"
                maxLength={4}
                value={form.last4}
                onChange={(e) => setForm({ ...form, last4: e.target.value.replace(/\D/g, '') })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small">Expiry (MM/YY)</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="12/27"
                maxLength={5}
                value={form.expiry}
                onChange={(e) => setForm({ ...form, expiry: e.target.value })}
              />
            </div>
          </div>
          <p className="text-muted small mt-3 mb-0">
            The customer receives a secure link to confirm card ownership. Only the provider token
            is stored — ZeePay never sees the full card number.
          </p>
        </Modal>
      )}

      {/* Remove confirm */}
      {removing && (
        <Modal open title="Remove payment method" onClose={() => setRemoving(null)} size="sm" footer={<><button className="btn btn-light btn-sm" onClick={() => setRemoving(null)}>Cancel</button><button className="btn btn-danger btn-sm" onClick={() => {
            persist(methods.map((m) => (m.id === removing.id ? { ...m, status: 'revoked', isDefault: false } : m)));
            toast(`${removing.cardBrand} •••• ${removing.cardLast4} removed — token revoked`, { tone: 'info' });
            setRemoving(null);
          }}>Remove method</button></>}><p className="small mb-0">{`Remove ${removing.cardBrand} •••• ${removing.cardLast4} for ${removing.customer}? The provider token will be revoked — active subscriptions using it will fail.`}</p></Modal>
      )}
    </>
  );
}
