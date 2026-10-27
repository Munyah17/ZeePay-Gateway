'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import { Modal, useToast, useConfirm } from '@/components/ui';
import { usePersistentState } from '@/components/ui';
import { exportJSON } from '@/lib/export';

interface InvoiceItem { description: string; quantity: number; unitPrice: number }
interface Invoice {
  id: string;
  customer: { name: string; email: string };
  amount: number;
  currency: string;
  status: string;
  dueDate: string;
  paidDate: string | null;
  items: InvoiceItem[];
  paymentMethod: string | null;
  paymentId: string | null;
  created: string;
}

export default function Invoices() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState<Invoice | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Invoice | null>(null);
  const [form, setForm] = useState({ name: '', email: '', dueDate: '', currency: 'USD', notes: '' });
  const [formItems, setFormItems] = useState<InvoiceItem[]>([{ description: '', quantity: 1, unitPrice: 0 }]);

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

  const persist = (next: Invoice[]) => {
    setInvoices(next);
    try { localStorage.setItem('zeepay_invoices', JSON.stringify(next)); } catch { /* noop */ }
  };

  const filtered = invoices.filter(
    (i) =>
      (!statusFilter || i.status === statusFilter) &&
      (!search || i.id.toLowerCase().includes(search.toLowerCase()) || i.customer.name.toLowerCase().includes(search.toLowerCase())),
  );

  const createInvoice = (asDraft: boolean) => {
    if (!form.name.trim() || !form.email.trim()) {
      toast('Customer name and email are required', { tone: 'warning' });
      return;
    }
    const items = formItems.filter((i) => i.description.trim());
    const amount = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const nextNum = invoices.reduce((m, i) => {
      const n = parseInt(i.id.replace('INV-', ''), 10);
      return Number.isFinite(n) ? Math.max(m, n) : m;
    }, 1040) + 1;
    const inv: Invoice = {
      id: `INV-${nextNum}`,
      customer: { name: form.name.trim(), email: form.email.trim() },
      amount,
      currency: form.currency,
      status: asDraft ? 'Draft' : 'Pending',
      dueDate: form.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      paidDate: null,
      items,
      paymentMethod: null,
      paymentId: null,
      created: new Date().toISOString().slice(0, 10),
    };
    persist([inv, ...invoices]);
    setShowCreateModal(false);
    setForm({ name: '', email: '', dueDate: '', currency: 'USD', notes: '' });
    setFormItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    toast(asDraft ? `Invoice ${inv.id} saved as draft` : `Invoice ${inv.id} created & sent`);
  };

  const sendInvoice = (inv: Invoice) => {
    persist(invoices.map((i) => (i.id === inv.id ? { ...i, status: 'Pending' } : i)));
    toast(`Invoice ${inv.id} sent to ${inv.customer.email}`);
  };

  const markPaid = (inv: Invoice) => {
    persist(invoices.map((i) => (i.id === inv.id ? { ...i, status: 'Paid', paidDate: new Date().toISOString().slice(0, 10) } : i)));
    setMenuFor(null);
    toast(`${inv.id} marked as paid`);
  };

  const cancelInvoice = (inv: Invoice) => {
    persist(invoices.map((i) => (i.id === inv.id ? { ...i, status: 'Cancelled' } : i)));
    setMenuFor(null);
    toast(`${inv.id} cancelled`, { tone: 'info' });
  };

  const confirmDelete = () => {
    if (!deleting) return;
    persist(invoices.filter((i) => i.id !== deleting.id));
    setDeleting(null);
    toast('Invoice deleted', { tone: 'info' });
  };

  const seedInvoices: Invoice[] = [
    {
      id: 'INV-1045',
      customer: {
        name: 'Acme Corporation',
        email: 'billing@acme.com',
      },
      amount: 2500.00,
      currency: 'USD',
      status: 'Paid',
      dueDate: '2024-01-20',
      paidDate: '2024-01-18',
      items: [
        { description: 'Consulting Services - Q4', quantity: 1, unitPrice: 2000.00 },
        { description: 'Additional Support Hours', quantity: 10, unitPrice: 50.00 },
      ],
      paymentMethod: 'EcoCash',
      paymentId: 'pay_8x2k91',
      created: '2024-01-15',
    },
    {
      id: 'INV-1044',
      customer: {
        name: 'TechStart Solutions',
        email: 'finance@techstart.io',
      },
      amount: 1250.00,
      currency: 'USD',
      status: 'Pending',
      dueDate: '2024-01-25',
      paidDate: null,
      items: [
        { description: 'Software License - Annual', quantity: 1, unitPrice: 1250.00 },
      ],
      paymentMethod: null,
      paymentId: null,
      created: '2024-01-18',
    },
    {
      id: 'INV-1043',
      customer: {
        name: 'Global Industries',
        email: 'accounts@global.com',
      },
      amount: 5750.00,
      currency: 'USD',
      status: 'Overdue',
      dueDate: '2024-01-10',
      paidDate: null,
      items: [
        { description: 'Enterprise Package - Q1', quantity: 1, unitPrice: 5000.00 },
        { description: 'Custom Integration', quantity: 1, unitPrice: 750.00 },
      ],
      paymentMethod: null,
      paymentId: null,
      created: '2024-01-05',
    },
    {
      id: 'INV-1042',
      customer: {
        name: 'Local Business Ltd',
        email: 'admin@localbusiness.co.zw',
      },
      amount: 450.00,
      currency: 'USD',
      status: 'Paid',
      dueDate: '2024-01-15',
      paidDate: '2024-01-12',
      items: [
        { description: 'Monthly Subscription', quantity: 1, unitPrice: 450.00 },
      ],
      paymentMethod: 'InnBucks',
      paymentId: 'pay_7m4422',
      created: '2024-01-10',
    },
    {
      id: 'INV-1041',
      customer: {
        name: 'Startup Ventures',
        email: 'finance@startup.ventures',
      },
      amount: 899.00,
      currency: 'USD',
      status: 'Draft',
      dueDate: '2024-02-01',
      paidDate: null,
      items: [
        { description: 'Starter Package', quantity: 1, unitPrice: 899.00 },
      ],
      paymentMethod: null,
      paymentId: null,
      created: '2024-01-20',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-success';
      case 'Pending': return 'bg-warning text-dark';
      case 'Overdue': return 'bg-danger';
      case 'Draft': return 'bg-secondary';
      case 'Cancelled': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };

  const getDaysOverdue = (dueDate: string, status: string) => {
    if (status !== 'Overdue') return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <>
    <div className="mb-4">
        <h2 className="h4">Invoices</h2>
        <p className="text-muted">Create and manage invoices for your customers</p>
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
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Total Outstanding</p>
                  <p className="h3 mb-0 text-warning">
                    {filtered.filter(i => i.status === 'Pending' || i.status === 'Overdue').reduce((sum, i) => sum + i.amount, 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Paid This Month</p>
                  <p className="h3 mb-0 text-success">
                    {invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Overdue</p>
                  <p className="h3 mb-0 text-danger">{filtered.filter(i => i.status === 'Overdue').length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Draft</p>
                  <p className="h3 mb-0 text-secondary">{filtered.filter(i => i.status === 'Draft').length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex gap-2">
                  <select
                    className="form-select form-select-sm"
                    style={{ width: '150px' }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Draft">Draft</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <input
                    type="text"
                    className="form-control form-select-sm"
                    placeholder="Search invoices..."
                    style={{ width: '250px' }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                  <i className="bi bi-plus-circle me-2"></i>
                  Create Invoice
                </button>
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Invoice #</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Due Date</th>
                      <th>Paid Date</th>
                      <th>Payment Method</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>
                          <div>
                            <h6 className="mb-0 small fw-medium">{invoice.id}</h6>
                            <small className="text-muted">{new Date(invoice.created).toLocaleDateString()}</small>
                          </div>
                        </td>
                        <td>
                          <div>
                            <h6 className="mb-0 small fw-medium">{invoice.customer.name}</h6>
                            <small className="text-muted">{invoice.customer.email}</small>
                          </div>
                        </td>
                        <td className="fw-medium">{invoice.currency} {invoice.amount.toFixed(2)}</td>
                        <td>
                          <span className={`badge ${getStatusColor(invoice.status)}`}>{invoice.status}</span>
                          {invoice.status === 'Overdue' && (
                            <div className="small text-danger mt-1">
                              {getDaysOverdue(invoice.dueDate, invoice.status)} days overdue
                            </div>
                          )}
                        </td>
                        <td className="small">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                        <td className="text-muted small">{invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString() : '-'}</td>
                        <td className="small">{invoice.paymentMethod || '-'}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-primary" title="View" onClick={() => setViewing(invoice)}>
                              <i className="bi bi-eye"></i>
                            </button>
                            <button className="btn btn-outline-primary" title="Send" onClick={() => sendInvoice(invoice)}>
                              <i className="bi bi-send"></i>
                            </button>
                            <div className="position-relative">
                              <button
                                className="btn btn-outline-secondary"
                                title="More"
                                onClick={() => setMenuFor(menuFor === invoice.id ? null : invoice.id)}
                              >
                                <i className="bi bi-three-dots"></i>
                              </button>
                              {menuFor === invoice.id && (
                                <ul className="dropdown-menu show" style={{ position: 'absolute', right: 0, zIndex: 1050 }}>
                                  <li>
                                    <button className="dropdown-item small" onClick={() => { markPaid(invoice); }}>
                                      <i className="bi bi-check2-circle me-2"></i>Mark paid
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      className="dropdown-item small"
                                      onClick={() => { exportJSON(`invoice-${invoice.id}`, invoice); setMenuFor(null); toast('Invoice downloaded'); }}
                                    >
                                      <i className="bi bi-download me-2"></i>Download
                                    </button>
                                  </li>
                                  <li>
                                    <button className="dropdown-item small" onClick={() => cancelInvoice(invoice)}>
                                      <i className="bi bi-x-circle me-2"></i>Cancel invoice
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      className="dropdown-item small text-danger"
                                      onClick={() => { setDeleting(invoice); setMenuFor(null); }}
                                    >
                                      <i className="bi bi-trash me-2"></i>Delete
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

          {/* Create Invoice Modal */}
          {showCreateModal && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-lg">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Create Invoice</h5>
                    <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Customer Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter customer name"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Customer Email *</label>
                        <input
                          type="email"
                          className="form-control"
                          placeholder="customer@example.com"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Invoice Number</label>
                        <input type="text" className="form-control" value="Auto-assigned" readOnly />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Due Date *</label>
                        <input
                          type="date"
                          className="form-control"
                          value={form.dueDate}
                          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Currency</label>
                      <select
                        className="form-select"
                        value={form.currency}
                        onChange={(e) => setForm({ ...form, currency: e.target.value })}
                      >
                        <option>USD</option>
                        <option>ZWL</option>
                        <option>EUR</option>
                        <option>GBP</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Invoice Items</label>
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Description</th>
                              <th>Qty</th>
                              <th>Unit Price</th>
                              <th>Total</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {formItems.map((item, idx) => (
                              <tr key={idx}>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Item description"
                                    value={item.description}
                                    onChange={(e) => setFormItems(formItems.map((it, i) => (i === idx ? { ...it, description: e.target.value } : it)))}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    placeholder="1"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => setFormItems(formItems.map((it, i) => (i === idx ? { ...it, quantity: parseInt(e.target.value) || 1 } : it)))}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    placeholder="0.00"
                                    step="0.01"
                                    value={item.unitPrice}
                                    onChange={(e) => setFormItems(formItems.map((it, i) => (i === idx ? { ...it, unitPrice: parseFloat(e.target.value) || 0 } : it)))}
                                  />
                                </td>
                                <td className="text-muted">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                                <td>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => setFormItems(formItems.filter((_, i) => i !== idx))}
                                    disabled={formItems.length === 1}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <button
                        className="btn btn-sm btn-outline-primary mt-2"
                        onClick={() => setFormItems([...formItems, { description: '', quantity: 1, unitPrice: 0 }])}
                      >
                        <i className="bi bi-plus me-1"></i>
                        Add Item
                      </button>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Notes (Optional)</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Payment terms, thank you message, etc."
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      ></textarea>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-outline-primary me-2" onClick={() => createInvoice(true)}>
                      Save as Draft
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => createInvoice(false)}>
                      Create & Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Templates */}
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Invoice Templates</h5>
              <button className="btn btn-sm btn-outline-primary" onClick={() => toast('Template builder coming soon — create an invoice and reuse it', { tone: 'info' })}>
                <i className="bi bi-plus-circle me-1"></i>
                Create Template
              </button>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="card h-100">
                    <div className="card-body">
                      <h6 className="mb-2">Standard Invoice</h6>
                      <p className="text-muted small mb-2">Basic invoice template with line items</p>
                      <button className="btn btn-sm btn-outline-primary w-100" onClick={() => setShowCreateModal(true)}>Use Template</button>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card h-100">
                    <div className="card-body">
                      <h6 className="mb-2">Recurring Invoice</h6>
                      <p className="text-muted small mb-2">For subscription-based billing</p>
                      <button className="btn btn-sm btn-outline-primary w-100" onClick={() => setShowCreateModal(true)}>Use Template</button>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card h-100">
                    <div className="card-body">
                      <h6 className="mb-2">Project Invoice</h6>
                      <p className="text-muted small mb-2">For milestone-based projects</p>
                      <button className="btn btn-sm btn-outline-primary w-100" onClick={() => setShowCreateModal(true)}>Use Template</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* View invoice modal */}
          {viewing && (
            <Modal open title={`Invoice ${viewing.id}`} onClose={() => setViewing(null)} size="lg">
              <div className="d-flex justify-content-between mb-3">
                <div>
                  <p className="small text-muted mb-0">Bill to</p>
                  <p className="small fw-medium mb-0">{viewing.customer.name}</p>
                  <p className="small text-muted">{viewing.customer.email}</p>
                </div>
                <span className={`badge ${getStatusColor(viewing.status)} align-self-start`}>{viewing.status}</span>
              </div>
              <table className="table table-sm">
                <thead>
                  <tr><th>Item</th><th className="text-end">Qty</th><th className="text-end">Unit</th><th className="text-end">Total</th></tr>
                </thead>
                <tbody>
                  {viewing.items.map((it, i) => (
                    <tr key={i}>
                      <td className="small">{it.description}</td>
                      <td className="small text-end">{it.quantity}</td>
                      <td className="small text-end">{it.unitPrice.toFixed(2)}</td>
                      <td className="small text-end">{(it.quantity * it.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="fw-medium">
                    <td colSpan={3} className="text-end">Total</td>
                    <td className="text-end">{viewing.currency} {viewing.amount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              <p className="small text-muted mb-0">
                Due {new Date(viewing.dueDate).toLocaleDateString()}
                {viewing.paidDate && ` · Paid ${new Date(viewing.paidDate).toLocaleDateString()}`}
                {viewing.paymentMethod && ` · via ${viewing.paymentMethod}`}
              </p>
            </Modal>
          )}

          {/* Delete confirm */}
          {deleting && (
            <Modal open title={"Delete invoice"} onClose={() => setDeleting(null)} size="sm" footer={<><button className="btn btn-light btn-sm" onClick={() => setDeleting(null)}>Cancel</button><button className="btn btn-danger btn-sm" onClick={confirmDelete}>Delete</button></>}><p className="small mb-0">{`Delete invoice ${deleting.id} for ${deleting.customer.name}? This cannot be undone.`}</p></Modal>
          )}
        </>
      )}
    </>
  );
}
