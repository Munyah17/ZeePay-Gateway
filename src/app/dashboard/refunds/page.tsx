'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Modal, ConfirmDialog, ToastProvider, toast } from '@/components/ui';
import { downloadCSV } from '@/utils/actions';

interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  status: string;
  date: string;
}

export default function RefundsPage() {
  const router = useRouter();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ paymentId: 'pay_8x2k91', amount: '10', reason: 'Customer request' });
  const [viewing, setViewing] = useState<Refund | null>(null);
  const [deleting, setDeleting] = useState<Refund | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authed = localStorage.getItem('zeepay_authed');
      if (!authed) {
        router.push('/auth/login');
        return;
      }
    }

    fetchRefunds();
  }, [router]);

  const fetchRefunds = async () => {
    try {
      setRefunds([
        { id: 'ref_10021', paymentId: 'pay_1f0992', amount: 12, status: 'Succeeded', date: '16 Oct 2026' },
        { id: 'ref_10020', paymentId: 'pay_8j2201', amount: 10, status: 'Succeeded', date: '15 Oct 2026' },
      ]);
    } catch (error) {
      console.error('Failed to fetch refunds:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRefund = () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      toast('Enter a valid amount', 'warning');
      return;
    }
    const refund: Refund = {
      id: `ref_${Math.floor(10000 + Math.random() * 90000)}`,
      paymentId: form.paymentId,
      amount,
      status: 'Pending',
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    };
    setRefunds((prev) => [refund, ...prev]);
    setShowCreateModal(false);
    toast(`Refund ${refund.id} created`);
  };

  const confirmDelete = () => {
    if (!deleting) return;
    setRefunds((prev) => prev.filter((r) => r.id !== deleting.id));
    setDeleting(null);
    toast('Refund record removed', 'info');
  };

  const exportCsv = () => {
    downloadCSV(
      'refunds',
      refunds.map((r) => ({ id: r.id, paymentId: r.paymentId, amount: `$${r.amount.toFixed(2)}`, status: r.status, date: r.date })),
    );
    toast(`Exported ${refunds.length} refund(s)`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Succeeded':
        return 'bg-success';
      case 'Pending':
        return 'bg-warning text-dark';
      case 'Failed':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <ToastProvider>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-0">Refunds</h2>
          <p className="text-muted small mb-0">Track and initiate refunds for supported payment providers</p>
        </div>
        <div className="d-flex gap-2">
          <button onClick={exportCsv} className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-download me-1"></i> Export
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary btn-sm"
          >
            <i className="bi bi-plus-lg me-1"></i> Create refund
          </button>
        </div>
      </div>

      <div className="alert alert-warning mb-4" role="alert">
        <strong>Demo only.</strong> Refund actions below update mock records only. Actual refund support depends on the underlying payment provider and transaction status.
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">Refund history</h5>
            <span className="badge bg-primary">
              {refunds.length} records
            </span>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Refund ID</th>
                    <th>Payment ID</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map((refund) => (
                    <tr key={refund.id}>
                      <td className="font-monospace small">{refund.id}</td>
                      <td className="font-monospace small">{refund.paymentId}</td>
                      <td>${refund.amount.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(refund.status)}`}>
                          {refund.status}
                        </span>
                      </td>
                      <td className="text-muted">{refund.date}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            title="View"
                            onClick={() => setViewing(refund)}
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            title="Remove"
                            onClick={() => setDeleting(refund)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {refunds.length === 0 && (
                <div className="text-center py-4 text-muted">
                  No refunds found
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create refund</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label className="form-label small">Payment</label>
                    <select
                      className="form-select form-select-sm"
                      value={form.paymentId}
                      onChange={(e) => setForm({ ...form, paymentId: e.target.value })}
                    >
                      <option value="pay_8x2k91">pay_8x2k91 — $10.00 (invoice_1042)</option>
                      <option value="pay_7m4422">pay_7m4422 — $50.00 (invoice_1041)</option>
                      <option value="pay_9q0678">pay_9q0678 — $20.00 (invoice_1040)</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">Refund amount (USD)</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      className="form-control form-control-sm"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">Reason</label>
                    <select
                      className="form-select form-select-sm"
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    >
                      <option>Customer request</option>
                      <option>Duplicate payment</option>
                      <option>Service not delivered</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <p className="text-muted small">This creates a simulated refund record only.</p>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={createRefund}
                >
                  Create demo refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <Modal title={`Refund ${viewing.id}`} onClose={() => setViewing(null)}>
          <ul className="list-group list-group-flush">
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Refund ID</span>
              <span className="small fw-medium font-monospace">{viewing.id}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Payment</span>
              <span className="small fw-medium font-monospace">{viewing.paymentId}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Amount</span>
              <span className="small fw-medium">${viewing.amount.toFixed(2)}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Status</span>
              <span className={`badge ${getStatusBadge(viewing.status)}`}>{viewing.status}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Date</span>
              <span className="small fw-medium">{viewing.date}</span>
            </li>
          </ul>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Remove refund record"
          message={`Remove ${deleting.id} ($${deleting.amount.toFixed(2)}) from history?`}
          confirmLabel="Remove"
          tone="danger"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </ToastProvider>
  );
}
