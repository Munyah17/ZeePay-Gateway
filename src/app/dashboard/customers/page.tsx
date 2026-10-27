'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Modal, useToast, useConfirm } from '@/components/ui';
import { exportCSV } from '@/lib/export';

interface Customer {
  name: string;
  email: string;
  phone?: string;
  payments: number;
  totalPaid: number;
  lastActivity: string;
}

export default function CustomersPage() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [viewing, setViewing] = useState<Customer | null>(null);
  const [editing, setEditing] = useState<{ customer: Customer; draft: Customer } | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authed = localStorage.getItem('zeepay_authed');
      if (!authed) {
        router.push('/auth/login');
        return;
      }
    }

    fetchCustomers();
  }, [router]);

  const fetchCustomers = async () => {
    try {
      setCustomers([
        { name: 'Sarah Moyo', email: 'sarah@example.com', payments: 6, totalPaid: 95, lastActivity: '2 min ago' },
        { name: 'Tawanda Ncube', email: 'tawanda@example.com', payments: 4, totalPaid: 180, lastActivity: '1 day ago' },
        { name: 'Rudo Dube', email: 'rudo@example.com', payments: 3, totalPaid: 42, lastActivity: '2 days ago' },
        { name: 'Brian Moyo', email: 'brian@example.com', payments: 2, totalPaid: 65, lastActivity: '3 days ago' },
        { name: 'Tariro Ndlovu', email: 'tariro@example.com', payments: 2, totalPaid: 20, lastActivity: '4 days ago' },
      ]);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCustomer = () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast('Name and email are required', { tone: 'warning' });
      return;
    }
    setCustomers((prev) => [
      { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), payments: 0, totalPaid: 0, lastActivity: 'just now' },
      ...prev,
    ]);
    setForm({ name: '', email: '', phone: '' });
    setShowAddModal(false);
    toast('Customer added');
  };

  const saveEdit = () => {
    if (!editing) return;
    setCustomers((prev) => prev.map((c) => (c === editing.customer ? { ...editing.draft } : c)));
    setEditing(null);
    toast('Customer updated');
  };

  const confirmDelete = () => {
    if (!deleting) return;
    setCustomers((prev) => prev.filter((c) => c !== deleting));
    setDeleting(null);
    toast('Customer removed', { tone: 'info' });
  };

  const filtered = customers.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCsv = () => {
    exportCSV(
      'customers',
      filtered.map((c) => ({ name: c.name, email: c.email, payments: c.payments, totalPaid: `$${c.totalPaid.toFixed(2)}`, lastActivity: c.lastActivity })),
    );
    toast(`Exported ${filtered.length} customer(s)`);
  };

  return (
    <>
    <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-0">Customers</h2>
          <p className="text-muted small mb-0">Customers associated with your payment activity</p>
        </div>
        <div className="d-flex gap-2">
          <button onClick={exportCsv} className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-download me-1"></i> Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm"
          >
            <i className="bi bi-plus-lg me-1"></i> Add customer
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="mb-3" style={{ maxWidth: '320px' }}>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search name or email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Payments</th>
                    <th>Total paid</th>
                    <th>Last activity</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((customer, index) => (
                    <tr key={index}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                               style={{ width: '32px', height: '32px' }}>
                            {customer.name.charAt(0)}
                          </div>
                          <span className="fw-medium">{customer.name}</span>
                        </div>
                      </td>
                      <td className="text-muted">{customer.email}</td>
                      <td>{customer.payments}</td>
                      <td>${customer.totalPaid.toFixed(2)}</td>
                      <td className="text-muted small">{customer.lastActivity}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            title="View"
                            onClick={() => setViewing(customer)}
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button
                            className="btn btn-outline-secondary"
                            title="Edit"
                            onClick={() => setEditing({ customer, draft: { ...customer } })}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            title="Delete"
                            onClick={() => setDeleting(customer)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card-footer">
            <nav aria-label="Page navigation">
              <ul className="pagination pagination-sm justify-content-end mb-0">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <li key={n} className={`page-item ${page === n ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(n)}>{n}</button>
                  </li>
                ))}
                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add customer</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label className="form-label small">Full name</label>
                    <input
                      type="text"
                      required
                      className="form-control form-control-sm"
                      placeholder="Customer name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">Email address</label>
                    <input
                      type="email"
                      required
                      className="form-control form-control-sm"
                      placeholder="customer@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">Phone (optional)</label>
                    <input
                      type="tel"
                      className="form-control form-control-sm"
                      placeholder="+263..."
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={addCustomer}
                >
                  Add customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <Modal open title={viewing.name} onClose={() => setViewing(null)}>
          <ul className="list-group list-group-flush">
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Email</span>
              <span className="small fw-medium">{viewing.email}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Phone</span>
              <span className="small fw-medium">{viewing.phone || '—'}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Payments</span>
              <span className="small fw-medium">{viewing.payments}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Total paid</span>
              <span className="small fw-medium">${viewing.totalPaid.toFixed(2)}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Last activity</span>
              <span className="small fw-medium">{viewing.lastActivity}</span>
            </li>
          </ul>
        </Modal>
      )}

      {editing && (
        <Modal open 
          title={`Edit ${editing.customer.name}`}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={saveEdit}>Save changes</button>
            </>
          }
        >
          <div className="mb-3">
            <label className="form-label small">Full name</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={editing.draft.name}
              onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, name: e.target.value } })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label small">Email</label>
            <input
              type="email"
              className="form-control form-control-sm"
              value={editing.draft.email}
              onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, email: e.target.value } })}
            />
          </div>
          <div className="mb-1">
            <label className="form-label small">Phone</label>
            <input
              type="tel"
              className="form-control form-control-sm"
              value={editing.draft.phone || ''}
              onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, phone: e.target.value } })}
            />
          </div>
        </Modal>
      )}

      {deleting && (
        <Modal open title={"Delete customer"} onClose={() => setDeleting(null)} size="sm" footer={<><button className="btn btn-light btn-sm" onClick={() => setDeleting(null)}>Cancel</button><button className="btn btn-danger btn-sm" onClick={confirmDelete}>Delete</button></>}><p className="small mb-0">{`Delete ${deleting.name} (${deleting.email})? This cannot be undone.`}</p></Modal>
      )}
    </>
  );
}
