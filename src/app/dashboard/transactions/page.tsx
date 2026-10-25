'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Modal, ToastProvider, toast } from '@/components/ui';
import { downloadCSV, downloadJSON } from '@/utils/actions';

interface Transaction {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<Transaction | null>(null);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    try {
      const mockTransactions: Transaction[] = [
        { id: '1', reference: 'INV-1042', amount: 10, currency: 'USD', status: 'succeeded', createdAt: '2026-10-19T10:00:00Z' },
        { id: '2', reference: 'INV-1041', amount: 25, currency: 'USD', status: 'pending', createdAt: '2026-10-19T09:30:00Z' },
        { id: '3', reference: 'INV-1040', amount: 15, currency: 'USD', status: 'succeeded', createdAt: '2026-10-18T16:45:00Z' },
        { id: '4', reference: 'INV-1039', amount: 50, currency: 'USD', status: 'failed', createdAt: '2026-10-18T14:20:00Z' },
        { id: '5', reference: 'INV-1038', amount: 30, currency: 'USD', status: 'succeeded', createdAt: '2026-10-18T11:10:00Z' },
      ];

      const filtered = filter === 'all' 
        ? mockTransactions 
        : mockTransactions.filter(t => t.status === filter);

      setTransactions(filtered);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const visible = transactions.filter(
    (t) =>
      !search ||
      t.reference.toLowerCase().includes(search.toLowerCase()) ||
      t.id.includes(search),
  );
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const pageRows = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCsv = () => {
    downloadCSV(
      'transactions',
      visible.map((t) => ({
        reference: t.reference,
        amount: `${t.currency} ${t.amount.toFixed(2)}`,
        status: t.status,
        date: new Date(t.createdAt).toLocaleString(),
      })),
    );
    toast(`Exported ${visible.length} transaction(s)`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-success';
      case 'pending':
        return 'bg-warning text-dark';
      case 'failed':
        return 'bg-danger';
      case 'cancelled':
        return 'bg-secondary';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <ToastProvider>
      <div className="mb-4">
        <h2 className="h4">Transactions</h2>
        <p className="text-muted">View and manage your payment transactions</p>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-3">
              <label className="form-label small">Filter by status:</label>
              <select
                value={filter}
                onChange={(e) => { setFilter(e.target.value); setPage(1); }}
                className="form-select form-select-sm"
              >
                <option value="all">All</option>
                <option value="succeeded">Succeeded</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small">Search:</label>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Reference or ID..."
                className="form-control form-control-sm"
              />
            </div>
            <div className="col-md-5 text-md-end mt-3 mt-md-0">
              <button className="btn btn-primary btn-sm" onClick={exportCsv}>
                <i className="bi bi-download me-1"></i> Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Reference</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <span className="fw-medium">{tx.reference}</span>
                      </td>
                      <td>${tx.amount.toFixed(2)} {tx.currency}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(tx.status)}`}>
                          {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                        </span>
                      </td>
                      <td className="text-muted">{new Date(tx.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            title="View details"
                            onClick={() => setViewing(tx)}
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button
                            className="btn btn-outline-secondary"
                            title="Download receipt"
                            onClick={() => {
                              downloadJSON(`receipt-${tx.reference}`, tx);
                              toast(`Receipt ${tx.reference} downloaded`);
                            }}
                          >
                            <i className="bi bi-download"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visible.length === 0 && (
                <div className="text-center py-4 text-muted">
                  No transactions found
                </div>
              )}
            </div>
          )}
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

      {viewing && (
        <Modal title={`Transaction ${viewing.reference}`} onClose={() => setViewing(null)}>
          <ul className="list-group list-group-flush">
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Reference</span>
              <span className="small fw-medium">{viewing.reference}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Amount</span>
              <span className="small fw-medium">{viewing.currency} {viewing.amount.toFixed(2)}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Status</span>
              <span className={`badge ${getStatusBadge(viewing.status)}`}>{viewing.status}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Date</span>
              <span className="small fw-medium">{new Date(viewing.createdAt).toLocaleString()}</span>
            </li>
          </ul>
        </Modal>
      )}
    </ToastProvider>
  );
}
