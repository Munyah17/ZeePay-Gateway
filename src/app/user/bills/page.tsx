'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import { Modal, useToast, useConfirm } from '@/components/ui';
import { usePersistentState } from '@/components/ui';

interface Bill {
  id: string;
  category: string;
  provider: string;
  accountNumber: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: string;
  lastPaid: string;
  autopay: boolean;
}

export default function Bills() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [billList, setBillList] = useState<Bill[]>([]);
  const [viewing, setViewing] = useState<Bill | null>(null);
  const [paying, setPaying] = useState<Bill | null>(null);
  const [removing, setRemoving] = useState<Bill | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [payAll, setPayAll] = useState(false);
  const [addForm, setAddForm] = useState({ provider: '', accountNumber: '', amount: '', category: 'utilities' });

  const persist = (next: Bill[]) => {
    setBillList(next);
    try { localStorage.setItem('zeepay_bills', JSON.stringify(next)); } catch { /* noop */ }
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

  const payBill = (bill: Bill) => {
    persist(billList.map((b) => (b.id === bill.id ? { ...b, status: 'Paid', lastPaid: new Date().toISOString().slice(0, 10) } : b)));
    setPaying(null);
    toast(`Paid ${bill.provider} ${bill.currency} ${bill.amount.toFixed(2)}`);
  };

  const payAllBills = () => {
    persist(billList.map((b) => ((b.status === 'Pending' || b.status === 'Overdue') ? { ...b, status: 'Paid', lastPaid: new Date().toISOString().slice(0, 10) } : b)));
    setPayAll(false);
    toast(`Paid ${billList.filter((b) => b.status !== 'Paid').length} bills`);
  };

  const toggleAutopay = (bill: Bill) => {
    persist(billList.map((b) => (b.id === bill.id ? { ...b, autopay: !b.autopay } : b)));
    setMenuFor(null);
    toast(`Autopay ${bill.autopay ? 'disabled' : 'enabled'} for ${bill.provider}`, { tone: 'info' });
  };

  const addBill = () => {
    const amount = parseFloat(addForm.amount);
    if (!addForm.provider.trim() || !addForm.accountNumber.trim() || !amount || amount <= 0) {
      toast('Provider, account number and a valid amount are required', 'warning');
      return;
    }
    const bill: Bill = {
      id: `bill_${Math.random().toString(36).slice(2, 6)}`,
      category: addForm.category,
      provider: addForm.provider.trim(),
      accountNumber: addForm.accountNumber.trim(),
      amount,
      currency: 'USD',
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      status: 'Pending',
      lastPaid: '—',
      autopay: false,
    };
    persist([bill, ...billList]);
    setShowAdd(false);
    setAddForm({ provider: '', accountNumber: '', amount: '', category: 'utilities' });
    toast('Bill added');
  };

  const billCategories = [
    { id: 'utilities', name: 'Utilities', icon: '⚡', color: 'bg-warning' },
    { id: 'telecom', name: 'Telecom', icon: '📱', color: 'bg-primary' },
    { id: 'electricity', name: 'Electricity', icon: '💡', color: 'bg-success' },
    { id: 'water', name: 'Water', icon: '💧', color: 'bg-info' },
    { id: 'internet', name: 'Internet', icon: '🌐', color: 'bg-secondary' },
    { id: 'tv', name: 'TV', icon: '📺', color: 'bg-danger' },
  ];

  const seedBills: Bill[] = [
    {
      id: 'bill_001',
      category: 'electricity',
      provider: 'ZESA',
      accountNumber: '1234567890',
      amount: 125.50,
      currency: 'USD',
      dueDate: '2024-01-25',
      status: 'Pending',
      lastPaid: '2023-12-25',
      autopay: true,
    },
    {
      id: 'bill_002',
      category: 'telecom',
      provider: 'Econet',
      accountNumber: '+263 71 234 5678',
      amount: 45.00,
      currency: 'USD',
      dueDate: '2024-01-20',
      status: 'Overdue',
      lastPaid: '2022-12-20',
      autopay: false,
    },
    {
      id: 'bill_003',
      category: 'utilities',
      provider: 'City of Harare',
      accountNumber: 'WTR-987654',
      amount: 35.00,
      currency: 'USD',
      dueDate: '2024-01-28',
      status: 'Pending',
      lastPaid: '2023-12-28',
      autopay: true,
    },
    {
      id: 'bill_004',
      category: 'internet',
      provider: 'Liquid Telkom',
      accountNumber: 'NET-456789',
      amount: 89.99,
      currency: 'USD',
      dueDate: '2024-01-30',
      status: 'Pending',
      lastPaid: '2023-12-30',
      autopay: true,
    },
    {
      id: 'bill_005',
      category: 'tv',
      provider: 'DStv',
      accountNumber: 'DSTV-789012',
      amount: 55.00,
      currency: 'USD',
      dueDate: '2024-01-15',
      status: 'Paid',
      lastPaid: '2024-01-14',
      autopay: true,
    },
  ];

  const filteredBills = selectedCategory === 'all' 
    ? billList 
    : billList.filter(bill => bill.category === selectedCategory);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-success';
      case 'Pending': return 'bg-warning text-dark';
      case 'Overdue': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const totalDue = filteredBills
    .filter(b => b.status === 'Pending' || b.status === 'Overdue')
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <>
    <div className="mb-4">
        <h2 className="h4">Pay Bills</h2>
        <p className="text-muted">Manage and pay your bills securely</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Total Due</p>
                  <h3 className="h3 mb-0 text-danger">${totalDue.toFixed(2)}</h3>
                  <p className="text-muted small mb-0">{filteredBills.filter(b => b.status === 'Pending' || b.status === 'Overdue').length} bills pending</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Paid This Month</p>
                  <h3 className="h3 mb-0 text-success">
                    ${filteredBills.filter(b => b.status === 'Paid' && new Date(b.lastPaid).getMonth() === new Date().getMonth()).reduce((sum, b) => sum + b.amount, 0).toFixed(2)}
                  </h3>
                  <p className="text-muted small mb-0">{filteredBills.filter(b => b.status === 'Paid').length} bills paid</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Autopay Enabled</p>
                  <h3 className="h3 mb-0 text-primary">{filteredBills.filter(b => b.autopay).length}</h3>
                  <p className="text-muted small mb-0">bills on autopay</p>
                </div>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex gap-2 flex-wrap">
                <button
                  className={`btn ${selectedCategory === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setSelectedCategory('all')}
                >
                  All Bills
                </button>
                {billCategories.map((category) => (
                  <button
                    key={category.id}
                    className={`btn ${selectedCategory === category.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.icon} {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bills List */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Your Bills</h5>
              <button className="btn btn-sm btn-primary" onClick={() => setShowAdd(true)}>
                <i className="bi bi-plus-circle me-1"></i>
                Add Bill
              </button>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Provider</th>
                      <th>Account Number</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Autopay</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBills.map((bill) => (
                      <tr key={bill.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span className="fs-4">{billCategories.find(c => c.id === bill.category)?.icon}</span>
                            <div>
                              <h6 className="mb-0 small fw-medium">{bill.provider}</h6>
                              <small className="text-muted">{billCategories.find(c => c.id === bill.category)?.name}</small>
                            </div>
                          </div>
                        </td>
                        <td className="small font-monospace">{bill.accountNumber}</td>
                        <td className="fw-medium">{bill.currency} {bill.amount.toFixed(2)}</td>
                        <td className="small">{new Date(bill.dueDate).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${getStatusColor(bill.status)}`}>{bill.status}</span>
                        </td>
                        <td>
                          {bill.autopay ? (
                            <span className="badge bg-success">
                              <i className="bi bi-check-circle me-1"></i>
                              Enabled
                            </span>
                          ) : (
                            <span className="badge bg-secondary">Disabled</span>
                          )}
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              title="Pay Now"
                              disabled={bill.status === 'Paid'}
                              onClick={() => setPaying(bill)}
                            >
                              <i className="bi bi-credit-card"></i>
                            </button>
                            <button className="btn btn-outline-primary" title="View Details" onClick={() => setViewing(bill)}>
                              <i className="bi bi-eye"></i>
                            </button>
                            <div className="position-relative">
                              <button
                                className="btn btn-outline-secondary"
                                title="More"
                                onClick={() => setMenuFor(menuFor === bill.id ? null : bill.id)}
                              >
                                <i className="bi bi-three-dots"></i>
                              </button>
                              {menuFor === bill.id && (
                                <ul className="dropdown-menu show" style={{ position: 'absolute', right: 0, zIndex: 1050 }}>
                                  <li>
                                    <button className="dropdown-item small" onClick={() => toggleAutopay(bill)}>
                                      <i className={`bi ${bill.autopay ? 'bi-x-circle' : 'bi-arrow-repeat'} me-2`}></i>
                                      {bill.autopay ? 'Disable autopay' : 'Enable autopay'}
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      className="dropdown-item small text-danger"
                                      onClick={() => { setRemoving(bill); setMenuFor(null); }}
                                    >
                                      <i className="bi bi-trash me-2"></i>Remove bill
                                    </button>
                                  </li>
                                </ul>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pay All Button */}
          {totalDue > 0 && (
            <div className="card mb-4 bg-light">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1">Pay All Pending Bills</h6>
                    <p className="text-muted small mb-0">Total: ${totalDue.toFixed(2)}</p>
                  </div>
                  <button className="btn btn-primary" onClick={() => setPayAll(true)}>
                    <i className="bi bi-credit-card me-2"></i>
                    Pay All
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="row g-4">
            <div className="col-md-6">
              <div className="card h-100">
                <div className="card-body">
                  <h6 className="mb-3">Quick Actions</h6>
                  <div className="d-grid gap-2">
                    <Link href="/user/send" className="btn btn-outline-primary text-start">
                      <i className="bi bi-send me-2"></i>
                      Send Money
                    </Link>
                    <Link href="/user/airtime" className="btn btn-outline-primary text-start">
                      <i className="bi bi-phone me-2"></i>
                      Buy Airtime
                    </Link>
                    <Link href="/user/history" className="btn btn-outline-primary text-start">
                      <i className="bi bi-clock-history me-2"></i>
                      Transaction History
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card h-100">
                <div className="card-body">
                  <h6 className="mb-3">Bill Payment Tips</h6>
                  <ul className="small text-muted mb-0">
                    <li className="mb-2">Enable autopay to never miss a due date</li>
                    <li className="mb-2">Set up payment reminders for important bills</li>
                    <li className="mb-2">Review bills before payment to ensure accuracy</li>
                    <li>Keep your account information updated</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* View bill modal */}
      {viewing && (
        <Modal open title={viewing.provider} onClose={() => setViewing(null)}>
          <ul className="list-group list-group-flush">
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Account</span>
              <code className="small">{viewing.accountNumber}</code>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Amount due</span>
              <span className="small fw-medium">{viewing.currency} {viewing.amount.toFixed(2)}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Due date</span>
              <span className="small">{new Date(viewing.dueDate).toLocaleDateString()}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Status</span>
              <span className={`badge ${getStatusColor(viewing.status)}`}>{viewing.status}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Autopay</span>
              <span className="small">{viewing.autopay ? 'Enabled' : 'Disabled'}</span>
            </li>
          </ul>
        </Modal>
      )}

      {/* Pay confirm */}
      {paying && (
        <Modal open title={"Pay bill"} onClose={() => setPaying(null)} size="sm" footer={<><button className="btn btn-light btn-sm" onClick={() => setPaying(null)}>Cancel</button><button className="btn btn-danger btn-sm" onClick={() => payBill(paying)}>Pay now</button></>}><p className="small mb-0">{`Pay ${paying.currency} ${paying.amount.toFixed(2)} to ${paying.provider} (${paying.accountNumber})?`}</p></Modal>
      )}

      {/* Pay all confirm */}
      {payAll && (
        <Modal open title={"Pay all pending bills"} onClose={() => setPayAll(false)} size="sm" footer={<><button className="btn btn-light btn-sm" onClick={() => setPayAll(false)}>Cancel</button><button className="btn btn-danger btn-sm" onClick={payAllBills}>Pay all</button></>}><p className="small mb-0">{`Pay all ${billList.filter((b) => b.status !== 'Paid').length} outstanding bills totalling $${totalDue.toFixed(2)}?`}</p></Modal>
      )}

      {/* Remove confirm */}
      {removing && (
        <Modal open title={"Remove bill"} onClose={() => setRemoving(null)} size="sm" footer={<><button className="btn btn-light btn-sm" onClick={() => setRemoving(null)}>Cancel</button><button className="btn btn-danger btn-sm" onClick={() => {
            persist(billList.filter((b) => b.id !== removing.id));
            setRemoving(null);
            toast('Bill removed', { tone: 'info' });
          }}>Remove</button></>}><p className="small mb-0">{`Remove ${removing.provider} from your bills?`}</p></Modal>
      )}

      {/* Add bill modal */}
      {showAdd && (
        <Modal open 
          title="Add Bill"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={addBill}>Add bill</button>
            </>
          }
        >
          <div className="mb-3">
            <label className="form-label small">Provider *</label>
            <input
              className="form-control form-control-sm"
              placeholder="e.g., ZESA"
              value={addForm.provider}
              onChange={(e) => setAddForm({ ...addForm, provider: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label small">Category</label>
            <select
              className="form-select form-select-sm"
              value={addForm.category}
              onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
            >
              {billCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label small">Account number *</label>
            <input
              className="form-control form-control-sm"
              value={addForm.accountNumber}
              onChange={(e) => setAddForm({ ...addForm, accountNumber: e.target.value })}
            />
          </div>
          <div className="mb-1">
            <label className="form-label small">Amount (USD) *</label>
            <input
              type="number"
              className="form-control form-control-sm"
              step="0.01"
              min="0.01"
              value={addForm.amount}
              onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
            />
          </div>
        </Modal>
      )}
    </>
  );
}
