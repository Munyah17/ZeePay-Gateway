'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import { Modal, useToast } from '@/components/ui';
import { exportCSV } from '@/lib/export';

interface Batch {
  id: string;
  batchNumber: string;
  provider: string;
  currency: string;
  expectedAmount: number;
  actualAmount: number | null;
  feeAmount: number;
  refundAmount: number;
  netAmount: number;
  transactionCount: number;
  status: string;
  discrepancy: number | null;
  settlementDate: string;
  dueDate: string;
}

interface UnmatchedTx {
  id: string;
  transactionId: string;
  provider: string;
  zeePayAmount: number | null;
  providerAmount: number | null;
  currency: string;
  date: string;
  reason: string;
  status: string;
}

export default function ReconciliationWorkbench() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [unmatched, setUnmatched] = useState<UnmatchedTx[]>([]);
  const [providerFilter, setProviderFilter] = useState('All Providers');
  const [exceptionsOnly, setExceptionsOnly] = useState(false);
  const [investigating, setInvestigating] = useState<UnmatchedTx | null>(null);
  const [reconciling, setReconciling] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authed = localStorage.getItem('zeepay_authed');
      if (!authed) {
        router.push('/auth/login');
        return;
      }
    }
    setBatches(seedBatches);
    setUnmatched(seedUnmatched);
    setLoading(false);
  }, [router]);

  const visibleBatches = batches.filter(
    (b) =>
      (providerFilter === 'All Providers' || b.provider === providerFilter) &&
      (!exceptionsOnly || b.status === 'Exception'),
  );

  const markResolved = (batch: Batch) => {
    setBatches((prev) => prev.map((b) => (b.id === batch.id ? { ...b, status: 'Reconciled', discrepancy: 0 } : b)));
    toast(`${batch.batchNumber} marked resolved`);
  };

  const requestReconciliation = (batch: Batch) => {
    setReconciling(true);
    setTimeout(() => {
      setReconciling(false);
      if (batch.status === 'Pending') {
        setBatches((prev) => prev.map((b) => (b.id === batch.id ? { ...b, status: 'Reconciled', actualAmount: b.expectedAmount, discrepancy: 0 } : b)));
        toast(`${batch.batchNumber} reconciled`);
      } else {
        toast(`Reconciliation re-run for ${batch.batchNumber}`, { tone: 'info' });
      }
    }, 1200);
  };

  const seedBatches: Batch[] = [
    {
      id: 'batch_001',
      batchNumber: 'SETT-2024-0115',
      provider: 'EcoCash',
      currency: 'USD',
      expectedAmount: 12500.00,
      actualAmount: 12500.00,
      feeAmount: 312.50,
      refundAmount: 250.00,
      netAmount: 11937.50,
      transactionCount: 245,
      status: 'Reconciled',
      discrepancy: 0,
      settlementDate: '2024-01-15',
      dueDate: '2024-01-17',
    },
    {
      id: 'batch_002',
      batchNumber: 'SETT-2024-0114',
      provider: 'InnBucks',
      currency: 'USD',
      expectedAmount: 8750.00,
      actualAmount: 8745.00,
      feeAmount: 218.75,
      refundAmount: 175.00,
      netAmount: 8351.25,
      transactionCount: 178,
      status: 'Exception',
      discrepancy: -5.00,
      settlementDate: '2024-01-14',
      dueDate: '2024-01-16',
    },
    {
      id: 'batch_003',
      batchNumber: 'SETT-2024-0113',
      provider: 'Omari',
      currency: 'USD',
      expectedAmount: 5200.00,
      actualAmount: 5200.00,
      feeAmount: 130.00,
      refundAmount: 104.00,
      netAmount: 4966.00,
      transactionCount: 98,
      status: 'Reconciled',
      discrepancy: 0,
      settlementDate: '2024-01-13',
      dueDate: '2024-01-15',
    },
    {
      id: 'batch_004',
      batchNumber: 'SETT-2024-0112',
      provider: 'ZIPIT',
      currency: 'USD',
      expectedAmount: 15000.00,
      actualAmount: null,
      feeAmount: 375.00,
      refundAmount: 300.00,
      netAmount: 14325.00,
      transactionCount: 312,
      status: 'Pending',
      discrepancy: null,
      settlementDate: '2024-01-12',
      dueDate: '2024-01-14',
    },
    {
      id: 'batch_005',
      batchNumber: 'SETT-2024-0111',
      provider: 'Visa',
      currency: 'USD',
      expectedAmount: 25000.00,
      actualAmount: 24995.00,
      feeAmount: 625.00,
      refundAmount: 500.00,
      netAmount: 23870.00,
      transactionCount: 456,
      status: 'Exception',
      discrepancy: -5.00,
      settlementDate: '2024-01-11',
      dueDate: '2024-01-13',
    },
  ];

  const seedUnmatched: UnmatchedTx[] = [
    {
      id: 'tx_001',
      transactionId: 'pay_8x2k91',
      provider: 'InnBucks',
      zeePayAmount: 50.00,
      providerAmount: null,
      currency: 'USD',
      date: '2024-01-14',
      reason: 'Missing from provider statement',
      status: 'Unmatched',
    },
    {
      id: 'tx_002',
      transactionId: 'pay_7m4422',
      provider: 'Visa',
      zeePayAmount: 100.00,
      providerAmount: 95.00,
      currency: 'USD',
      date: '2024-01-11',
      reason: 'Amount mismatch',
      status: 'Discrepancy',
    },
    {
      id: 'tx_003',
      transactionId: 'pay_9q0678',
      provider: 'InnBucks',
      zeePayAmount: null,
      providerAmount: 25.00,
      currency: 'USD',
      date: '2024-01-14',
      reason: 'Extra in provider statement',
      status: 'Unmatched',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Reconciled': return 'bg-success';
      case 'Pending': return 'bg-warning text-dark';
      case 'Exception': return 'bg-danger';
      case 'Failed': return 'bg-danger';
      case 'Paid': return 'bg-success';
      default: return 'bg-secondary';
    }
  };

  return (
    <>
    <div className="mb-4">
        <h2 className="h4">Reconciliation Workbench</h2>
        <p className="text-muted">Compare provider settlements with ZeePay records and resolve discrepancies</p>
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
                  <p className="text-muted small mb-1">Total Batches</p>
                  <p className="h3 mb-0">{batches.length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Reconciled</p>
                  <p className="h3 mb-0 text-success">{batches.filter(b => b.status === 'Reconciled').length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Exceptions</p>
                  <p className="h3 mb-0 text-danger">{batches.filter(b => b.status === 'Exception').length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Total Discrepancy</p>
                  <p className="h3 mb-0 text-warning">${batches.reduce((sum, b) => sum + (b.discrepancy || 0), 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Exception Alert */}
          {batches.filter(b => b.status === 'Exception').length > 0 && (
            <div className="alert alert-warning mb-4" role="alert">
              <div className="d-flex align-items-center gap-3">
                <i className="bi bi-exclamation-triangle-fill fs-4"></i>
                <div>
                  <strong>{batches.filter(b => b.status === 'Exception').length} settlement batches</strong> have discrepancies requiring attention
                </div>
                <button className="btn btn-sm btn-warning ms-auto" onClick={() => setExceptionsOnly(true)}>
                  Review All
                </button>
              </div>
            </div>
          )}

          <div className="row g-4 mb-4">
            {/* Settlement Batches */}
            <div className="col-lg-8">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Settlement Batches</h5>
                  <div className="d-flex gap-2">
                    <select
                      className="form-select form-select-sm"
                      style={{ width: '150px' }}
                      value={providerFilter}
                      onChange={(e) => setProviderFilter(e.target.value)}
                    >
                      <option>All Providers</option>
                      <option>EcoCash</option>
                      <option>InnBucks</option>
                      <option>Omari</option>
                      <option>Visa</option>
                    </select>
                    <button
                      className={`btn btn-sm ${exceptionsOnly ? 'btn-warning' : 'btn-outline-secondary'}`}
                      title="Show exceptions only"
                      onClick={() => setExceptionsOnly(!exceptionsOnly)}
                    >
                      <i className="bi bi-filter"></i>
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Batch</th>
                          <th>Provider</th>
                          <th>Expected</th>
                          <th>Actual</th>
                          <th>Discrepancy</th>
                          <th>Status</th>
                          <th>Due Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleBatches.map((batch) => (
                          <tr key={batch.id} className={batch.status === 'Exception' ? 'table-warning' : ''}>
                            <td>
                              <div>
                                <h6 className="mb-0 small fw-medium">{batch.batchNumber}</h6>
                                <small className="text-muted">{batch.transactionCount} transactions</small>
                              </div>
                            </td>
                            <td>{batch.provider}</td>
                            <td className="small">{batch.currency} {batch.expectedAmount.toFixed(2)}</td>
                            <td className="small">{batch.actualAmount ? `${batch.currency} ${batch.actualAmount.toFixed(2)}` : '-'}</td>
                            <td className={`small ${batch.discrepancy !== 0 ? 'text-danger fw-bold' : 'text-success'}`}>
                              {batch.discrepancy !== null ? `${batch.currency} ${batch.discrepancy.toFixed(2)}` : '-'}
                            </td>
                            <td>
                              <span className={`badge ${getStatusColor(batch.status)}`}>{batch.status}</span>
                            </td>
                            <td className="text-muted small">{new Date(batch.dueDate).toLocaleDateString()}</td>
                            <td>
                              <button className="btn btn-sm btn-outline-primary" onClick={() => setSelectedBatch(batch.id)}>
                                Review
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Unmatched Transactions */}
            <div className="col-lg-4">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Unmatched Transactions</h5>
                  <span className="badge bg-danger">{unmatched.length}</span>
                </div>
                <div className="card-body">
                  <div className="list-group list-group-flush">
                    {unmatched.map((tx) => (
                      <div key={tx.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-1 small fw-medium">{tx.transactionId}</h6>
                            <p className="small text-muted mb-0">{tx.provider}</p>
                          </div>
                          <span className="badge bg-danger">{tx.status}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <small className="text-muted">ZeePay: {tx.zeePayAmount ? `${tx.currency} ${tx.zeePayAmount.toFixed(2)}` : '-'}</small>
                          <small className="text-muted">Provider: {tx.providerAmount ? `${tx.currency} ${tx.providerAmount.toFixed(2)}` : '-'}</small>
                        </div>
                        <p className="small text-muted mb-2">{tx.reason}</p>
                        <button className="btn btn-sm btn-outline-primary w-100" onClick={() => setInvestigating(tx)}>
                          Investigate
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Batch Details Panel */}
          {selectedBatch && (
            <div className="card mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Batch Details</h5>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedBatch(null)}>
                  Close
                </button>
              </div>
              <div className="card-body">
                {(() => {
                  const batch = batches.find(b => b.id === selectedBatch);
                  if (!batch) return null;
                  return (
                    <div className="row g-4">
                      <div className="col-md-6">
                        <h6 className="mb-3">Financial Summary</h6>
                        <div className="list-group">
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Gross Amount</span>
                            <strong>{batch.currency} {batch.expectedAmount.toFixed(2)}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Fees</span>
                            <strong>-{batch.currency} {batch.feeAmount.toFixed(2)}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Refunds</span>
                            <strong>-{batch.currency} {batch.refundAmount.toFixed(2)}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Net Settlement</span>
                            <strong className="text-success">{batch.currency} {batch.netAmount.toFixed(2)}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Actual Received</span>
                            <strong>{batch.actualAmount ? `${batch.currency} ${batch.actualAmount.toFixed(2)}` : 'Pending'}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Discrepancy</span>
                            <strong className={batch.discrepancy !== 0 ? 'text-danger' : 'text-success'}>
                              {batch.discrepancy !== null ? `${batch.currency} ${batch.discrepancy.toFixed(2)}` : '0.00'}
                            </strong>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <h6 className="mb-3">Resolution Actions</h6>
                        {batch.status === 'Exception' && (
                          <div className="alert alert-warning" role="alert">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            This batch has a discrepancy of {batch.currency} {Math.abs(batch.discrepancy || 0).toFixed(2)}
                          </div>
                        )}
                        <div className="d-grid gap-2">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => {
                              exportCSV(`statement-${batch.batchNumber}`, [
                                { field: 'Gross', amount: batch.expectedAmount },
                                { field: 'Fees', amount: -batch.feeAmount },
                                { field: 'Refunds', amount: -batch.refundAmount },
                                { field: 'Net', amount: batch.netAmount },
                              ]);
                              toast('Provider statement exported');
                            }}
                          >
                            <i className="bi bi-file-earmark-text me-2"></i>
                            View Provider Statement
                          </button>
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => {
                              const matches = unmatched.filter((t) => t.provider === batch.provider);
                              toast(`${matches.length ? `${matches.length} unmatched transaction(s) for ${batch.provider}` : 'All transactions matched'}`, 'info');
                            }}
                          >
                            <i className="bi bi-list-check me-2"></i>
                            View Transaction List
                          </button>
                          <button className="btn btn-outline-primary" onClick={() => requestReconciliation(batch)} disabled={reconciling}>
                            <i className="bi bi-arrow-repeat me-2"></i>
                            {reconciling ? 'Running…' : 'Request Reconciliation'}
                          </button>
                          {batch.status === 'Exception' && (
                            <button
                              className="btn btn-outline-warning"
                              onClick={() => {
                                setBatches((prev) => prev.map((b) => (b.id === batch.id ? { ...b, status: 'Reconciled', actualAmount: b.expectedAmount, discrepancy: 0 } : b)));
                                toast('Adjustment created — discrepancy written off (demo)', 'info');
                              }}
                            >
                              <i className="bi bi-pencil me-2"></i>
                              Create Adjustment
                            </button>
                          )}
                          <button className="btn btn-outline-success" onClick={() => markResolved(batch)}>
                            <i className="bi bi-check-circle me-2"></i>
                            Mark as Resolved
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Reconciliation History */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Recent Resolutions</h5>
              <Link href="/admin/finance/reconciliation/history" className="btn btn-sm btn-link">
                View all →
              </Link>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Batch</th>
                      <th>Issue</th>
                      <th>Resolution</th>
                      <th>Resolved By</th>
                      <th>Resolved At</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="small">SETT-2024-0108</td>
                      <td className="small">Amount mismatch ($12.50)</td>
                      <td className="small">Provider fee adjustment</td>
                      <td className="small">John D.</td>
                      <td className="text-muted small">2024-01-10</td>
                      <td><span className="badge bg-success">Resolved</span></td>
                    </tr>
                    <tr>
                      <td className="small">SETT-2024-0105</td>
                      <td className="small">Missing transaction</td>
                      <td className="small">Transaction found in delayed batch</td>
                      <td className="small">Sarah M.</td>
                      <td className="text-muted small">2024-01-07</td>
                      <td><span className="badge bg-success">Resolved</span></td>
                    </tr>
                    <tr>
                      <td className="small">SETT-2024-0102</td>
                      <td className="small">Duplicate charge</td>
                      <td className="small">Refund processed</td>
                      <td className="small">Mike T.</td>
                      <td className="text-muted small">2024-01-04</td>
                      <td><span className="badge bg-success">Resolved</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <button className="btn btn-outline-primary w-100" onClick={() => setShowImport(true)}>
                    <i className="bi bi-download me-2"></i>
                    Import Statement
                  </button>
                </div>
                <div className="col-md-3">
                  <button
                    className="btn btn-outline-primary w-100"
                    disabled={reconciling}
                    onClick={() => {
                      setReconciling(true);
                      setTimeout(() => {
                        setBatches((prev) => prev.map((b) => (b.status === 'Pending' ? { ...b, status: 'Reconciled', actualAmount: b.expectedAmount, discrepancy: 0 } : b)));
                        setReconciling(false);
                        toast('Auto-reconciliation complete — pending batches matched');
                      }, 1500);
                    }}
                  >
                    <i className="bi bi-arrow-repeat me-2"></i>
                    {reconciling ? 'Running…' : 'Run Auto-Reconciliation'}
                  </button>
                </div>
                <div className="col-md-3">
                  <button
                    className="btn btn-outline-primary w-100"
                    onClick={() => {
                      exportCSV('reconciliation-report', batches.map((b) => ({
                        batch: b.batchNumber, provider: b.provider, expected: b.expectedAmount,
                        actual: b.actualAmount ?? '', discrepancy: b.discrepancy ?? '', status: b.status,
                      })));
                      toast('Reconciliation report exported');
                    }}
                  >
                    <i className="bi bi-file-earmark-bar-graph me-2"></i>
                    Export Report
                  </button>
                </div>
                <div className="col-md-3">
                  <button className="btn btn-outline-primary w-100" onClick={() => setShowAlerts(true)}>
                    <i className="bi bi-bell me-2"></i>
                    Configure Alerts
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Investigate modal */}
      {investigating && (
        <Modal open title={`Investigate ${investigating.transactionId}`} onClose={() => setInvestigating(null)}>
          <ul className="list-group list-group-flush">
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Provider</span>
              <span className="small">{investigating.provider}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">ZeePay amount</span>
              <span className="small">{investigating.zeePayAmount ? `${investigating.currency} ${investigating.zeePayAmount.toFixed(2)}` : '—'}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Provider amount</span>
              <span className="small">{investigating.providerAmount ? `${investigating.currency} ${investigating.providerAmount.toFixed(2)}` : '—'}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Issue</span>
              <span className="small">{investigating.reason}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Date</span>
              <span className="small">{investigating.date}</span>
            </li>
          </ul>
          <div className="d-flex gap-2 mt-3">
            <button
              className="btn btn-success btn-sm flex-grow-1"
              onClick={() => {
                setUnmatched((prev) => prev.filter((t) => t.id !== investigating.id));
                setInvestigating(null);
                toast('Transaction marked resolved');
              }}
            >
              Resolve
            </button>
            <button
              className="btn btn-outline-secondary btn-sm flex-grow-1"
              onClick={() => { setInvestigating(null); toast('Flagged for follow-up', { tone: 'info' }); }}
            >
              Flag for follow-up
            </button>
          </div>
        </Modal>
      )}

      {/* Import statement modal */}
      {showImport && (
        <Modal open 
          title="Import Provider Statement"
          onClose={() => setShowImport(false)}
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowImport(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={() => { setShowImport(false); toast('Statement imported — reconciliation queued (demo)', 'info'); }}>Import</button>
            </>
          }
        >
          <div className="mb-3">
            <label className="form-label small">Provider</label>
            <select className="form-select form-select-sm">
              <option>EcoCash</option>
              <option>InnBucks</option>
              <option>Omari</option>
              <option>Visa</option>
            </select>
          </div>
          <div>
            <label className="form-label small">Statement file (CSV)</label>
            <input type="file" className="form-control form-control-sm" accept=".csv" />
            <small className="text-muted">Statement imports are simulated in this demo.</small>
          </div>
        </Modal>
      )}

      {/* Alerts modal */}
      {showAlerts && (
        <Modal open 
          title="Reconciliation Alerts"
          onClose={() => setShowAlerts(false)}
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAlerts(false)}>Close</button>
              <button className="btn btn-primary btn-sm" onClick={() => { setShowAlerts(false); toast('Alert preferences saved'); }}>Save</button>
            </>
          }
        >
          {['New discrepancy detected', 'Batch pending >48h', 'Unmatched transactions found'].map((label, i) => (
            <div key={i} className="form-check mb-2">
              <input className="form-check-input" type="checkbox" id={`rec_alert_${i}`} defaultChecked={i < 2} />
              <label className="form-check-label small" htmlFor={`rec_alert_${i}`}>{label}</label>
            </div>
          ))}
        </Modal>
      )}
    </>
  );
}
