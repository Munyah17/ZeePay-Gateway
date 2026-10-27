'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import { Modal, useToast, useConfirm } from '@/components/ui';
import { usePersistentState } from '@/components/ui';

interface Card {
  id: string;
  type: string;
  last4: string;
  expiry: string | null;
  holder: string;
  balance: number;
  currency: string;
  status: string;
  isDefault: boolean;
  color: string;
  icon: string;
}

export default function Cards() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [managing, setManaging] = useState<Card | null>(null);
  const [removing, setRemoving] = useState<Card | null>(null);
  const [lockConfirm, setLockConfirm] = useState<Card | null>(null);
  const [form, setForm] = useState({ type: 'Visa', number: '', expiry: '', cvv: '', holder: '', setDefault: false });

  const persist = (next: Card[]) => {
    setCards(next);
    try { localStorage.setItem('zeepay_user_cards', JSON.stringify(next)); } catch { /* noop */ }
  };

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

  const addCard = () => {
    const digits = form.number.replace(/\D/g, '');
    if (digits.length < 12 || !form.expiry.trim() || !form.holder.trim()) {
      toast('Enter a valid card number, expiry and holder name', 'warning');
      return;
    }
    const card: Card = {
      id: `card_${Math.random().toString(36).slice(2, 6)}`,
      type: form.type,
      last4: digits.slice(-4),
      expiry: form.expiry.trim(),
      holder: form.holder.trim(),
      balance: 0,
      currency: 'USD',
      status: 'Active',
      isDefault: form.setDefault,
      color: form.type === 'Visa' ? 'bg-primary' : form.type === 'Mastercard' ? 'bg-danger' : 'bg-dark',
      icon: '💳',
    };
    const next = form.setDefault ? cards.map((c) => ({ ...c, isDefault: false })) : [...cards];
    persist([card, ...next]);
    setShowAddModal(false);
    setForm({ type: 'Visa', number: '', expiry: '', cvv: '', holder: '', setDefault: false });
    toast(`${card.type} •••• ${card.last4} added`);
  };

  const toggleLock = (card: Card) => {
    const next = card.status === 'Blocked' ? 'Active' : 'Blocked';
    persist(cards.map((c) => (c.id === card.id ? { ...c, status: next } : c)));
    setLockConfirm(null);
    toast(`${card.type} •••• ${card.last4} ${next === 'Blocked' ? 'locked' : 'unlocked'}`, next === 'Blocked' ? 'warning' : 'success');
  };

  const confirmRemove = () => {
    if (!removing) return;
    persist(cards.filter((c) => c.id !== removing.id));
    setRemoving(null);
    toast('Card removed', { tone: 'info' });
  };

  const seedCards: Card[] = [
    {
      id: 'card_001',
      type: 'Visa',
      last4: '4242',
      expiry: '12/25',
      holder: 'John Doe',
      balance: 5000.00,
      currency: 'USD',
      status: 'Active',
      isDefault: true,
      color: 'bg-primary',
      icon: '💳',
    },
    {
      id: 'card_002',
      type: 'Mastercard',
      last4: '5555',
      expiry: '08/24',
      holder: 'John Doe',
      balance: 2500.00,
      currency: 'USD',
      status: 'Active',
      isDefault: false,
      color: 'bg-danger',
      icon: '💳',
    },
    {
      id: 'card_003',
      type: 'EcoCash',
      last4: '7890',
      expiry: null,
      holder: 'John Doe',
      balance: 1250.00,
      currency: 'USD',
      status: 'Active',
      isDefault: false,
      color: 'bg-success',
      icon: '📱',
    },
  ];

  const recentTransactions = [
    { id: 'tx_001', description: 'Netflix Subscription', amount: -15.99, date: '2024-01-15', card: 'Visa •••• 4242' },
    { id: 'tx_002', description: 'Grocery Store', amount: -125.50, date: '2024-01-14', card: 'Mastercard •••• 5555' },
    { id: 'tx_003', description: 'Salary Deposit', amount: 3500.00, date: '2024-01-10', card: 'Visa •••• 4242' },
    { id: 'tx_004', description: 'Airtime Purchase', amount: -20.00, date: '2024-01-13', card: 'EcoCash •••• 7890' },
    { id: 'tx_005', description: 'Restaurant', amount: -45.00, date: '2024-01-12', card: 'Visa •••• 4242' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-success';
      case 'Blocked': return 'bg-danger';
      case 'Expired': return 'bg-secondary';
      case 'Pending': return 'bg-warning text-dark';
      default: return 'bg-secondary';
    }
  };

  return (
    <>
    <div className="mb-4">
        <h2 className="h4">My Cards</h2>
        <p className="text-muted">Manage your payment cards and wallets</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Total Balance</p>
                  <h3 className="h3 mb-0 text-success">
                    ${cards.reduce((sum, c) => sum + c.balance, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </h3>
                  <p className="text-muted small mb-0">Across all cards</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Active Cards</p>
                  <h3 className="h3 mb-0 text-primary">{cards.filter(c => c.status === 'Active').length}</h3>
                  <p className="text-muted small mb-0">{cards.length} total cards</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">This Month's Spending</p>
                  <h3 className="h3 mb-0 text-danger">
                    ${recentTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0).toFixed(2)}
                  </h3>
                  <p className="text-muted small mb-0">{recentTransactions.filter(t => t.amount < 0).length} transactions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="row g-4 mb-4">
            {cards.map((card) => (
              <div className="col-md-4" key={card.id}>
                <div className="card h-100">
                  <div className={`card-body ${card.color} text-white`}>
                    <div className="d-flex justify-content-between align-items-start mb-4">
                      <span className="fs-3">{card.icon}</span>
                      <div className="d-flex gap-1">
                        {card.isDefault && (
                          <span className="badge bg-light text-dark">Default</span>
                        )}
                        {card.status === 'Blocked' && (
                          <span className="badge bg-dark">Locked</span>
                        )}
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-white-50 small mb-1">Balance</p>
                      <h3 className="h3 mb-0">${card.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    </div>
                    <div className="d-flex justify-content-between align-items-end">
                      <div>
                        <p className="text-white-50 small mb-1">Card Number</p>
                        <p className="mb-0">•••• •••• •••• {card.last4}</p>
                      </div>
                      <div className="text-end">
                        <p className="text-white-50 small mb-1">Expires</p>
                        <p className="mb-0">{card.expiry || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="card-footer bg-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-0 small fw-medium">{card.type}</h6>
                        <small className="text-muted">{card.holder}</small>
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        <StatusBadge status={card.status} type="default" size="sm" />
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-secondary"
                            title={card.status === 'Blocked' ? 'Unlock' : 'Lock'}
                            onClick={() => setLockConfirm(card)}
                          >
                            <i className={`bi ${card.status === 'Blocked' ? 'bi-unlock' : 'bi-lock'}`}></i>
                          </button>
                          <button className="btn btn-outline-secondary" title="Details" onClick={() => setManaging(card)}>
                            <i className="bi bi-eye"></i>
                          </button>
                          <button className="btn btn-outline-danger" title="Remove" onClick={() => setRemoving(card)}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="col-md-4">
              <div className="card h-100 border-dashed" style={{ borderStyle: 'dashed' }}>
                <div className="card-body d-flex flex-column align-items-center justify-content-center h-100">
                  <div className="text-muted mb-3">
                    <i className="bi bi-plus-circle fs-1"></i>
                  </div>
                  <button className="btn btn-outline-primary" onClick={() => setShowAddModal(true)}>
                    Add New Card
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Recent Card Transactions</h5>
              <Link href="/user/history" className="btn btn-sm btn-link">
                View all →
              </Link>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Description</th>
                      <th>Card</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td>
                          <h6 className="mb-0 small fw-medium">{tx.description}</h6>
                        </td>
                        <td className="small">{tx.card}</td>
                        <td className={tx.amount > 0 ? 'text-success' : 'text-danger'}>
                          {tx.amount > 0 ? '+' : ''}${tx.amount.toFixed(2)}
                        </td>
                        <td className="text-muted small">{new Date(tx.date).toLocaleDateString()}</td>
                        <td>
                          <span className="badge bg-success">Completed</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Add Card Modal */}
          {showAddModal && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Add New Card</h5>
                    <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Card Type</label>
                      <select
                        className="form-select"
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                      >
                        <option>Visa</option>
                        <option>Mastercard</option>
                        <option>American Express</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Card Number *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="1234 5678 9012 3456"
                        value={form.number}
                        onChange={(e) => setForm({ ...form, number: e.target.value })}
                      />
                    </div>
                    <div className="row g-3 mb-3">
                      <div className="col-6">
                        <label className="form-label">Expiry Date *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="MM/YY"
                          value={form.expiry}
                          onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label">CVV *</label>
                        <input
                          type="password"
                          className="form-control"
                          placeholder="123"
                          maxLength={4}
                          value={form.cvv}
                          onChange={(e) => setForm({ ...form, cvv: e.target.value.replace(/\D/g, '') })}
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Cardholder Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Name on card"
                        value={form.holder}
                        onChange={(e) => setForm({ ...form, holder: e.target.value })}
                      />
                    </div>
                    <div className="form-check mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="setDefault"
                        checked={form.setDefault}
                        onChange={(e) => setForm({ ...form, setDefault: e.target.checked })}
                      />
                      <label className="form-check-label" htmlFor="setDefault">
                        Set as default payment method
                      </label>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={addCard}>
                      Add Card
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <button
                    className="btn btn-outline-primary w-100"
                    onClick={() => {
                      const def = cards.find((c) => c.isDefault) || cards[0];
                      if (def) setLockConfirm(def);
                      else toast('No cards to lock', { tone: 'info' });
                    }}
                  >
                    <i className="bi bi-lock me-2"></i>
                    Lock Card
                  </button>
                </div>
                <div className="col-md-4">
                  <button
                    className="btn btn-outline-primary w-100"
                    onClick={() => {
                      const def = cards.find((c) => c.isDefault) || cards[0];
                      if (def) setManaging(def);
                      else toast('No cards to manage', { tone: 'info' });
                    }}
                  >
                    <i className="bi bi-gear me-2"></i>
                    Card Settings
                  </button>
                </div>
                <div className="col-md-4">
                  <Link href="/user/history" className="btn btn-outline-primary w-100">
                    <i className="bi bi-file-earmark-text me-2"></i>
                    View Statements
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Card details modal */}
      {managing && (
        <Modal open title={`${managing.type} •••• ${managing.last4}`} onClose={() => setManaging(null)}>
          <ul className="list-group list-group-flush">
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Holder</span>
              <span className="small fw-medium">{managing.holder}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Balance</span>
              <span className="small fw-medium">{managing.currency} {managing.balance.toFixed(2)}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Expiry</span>
              <span className="small">{managing.expiry || 'N/A'}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Status</span>
              <StatusBadge status={managing.status} type="default" size="sm" />
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Default</span>
              <span className="small">{managing.isDefault ? 'Yes' : 'No'}</span>
            </li>
          </ul>
          {!managing.isDefault && (
            <button
              className="btn btn-outline-primary btn-sm mt-3 w-100"
              onClick={() => {
                persist(cards.map((c) => ({ ...c, isDefault: c.id === managing.id })));
                setManaging(null);
                toast('Default payment method updated');
              }}
            >
              Set as default
            </button>
          )}
        </Modal>
      )}

      {/* Lock confirm */}
      {lockConfirm && (
        <Modal open title={lockConfirm.status === 'Blocked' ? 'Unlock card' : 'Lock card'} onClose={() => setLockConfirm(null)} size="sm" footer={<><button className="btn btn-light btn-sm" onClick={() => setLockConfirm(null)}>Cancel</button><button className="btn btn-warning btn-sm" onClick={() => toggleLock(lockConfirm)}>{lockConfirm.status === 'Blocked' ? 'Unlock' : 'Lock'}</button></>}><p className="small mb-0">{`${lockConfirm.status === 'Blocked' ? 'Unlock' : 'Lock'} ${lockConfirm.type} •••• ${lockConfirm.last4}? ${lockConfirm.status === 'Blocked' ? '' : 'It cannot be used for payments while locked.'}`}</p></Modal>
      )}

      {/* Remove confirm */}
      {removing && (
        <Modal open title={"Remove card"} onClose={() => setRemoving(null)} size="sm" footer={<><button className="btn btn-light btn-sm" onClick={() => setRemoving(null)}>Cancel</button><button className="btn btn-danger btn-sm" onClick={confirmRemove}>Remove</button></>}><p className="small mb-0">{`Remove ${removing.type} •••• ${removing.last4} from your account?`}</p></Modal>
      )}
    </>
  );
}
