'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';

function TransactionInvestigationContent() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

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

  const transaction = {
    id: 'pay_8x2k91',
    merchantRef: 'INV-1042',
    amount: 10.00,
    currency: 'USD',
    fee: 0.45,
    netAmount: 9.55,
    merchant: 'Acme Solutions',
    merchantId: 'MCH-001',
    customerEmail: 'customer@example.com',
    paymentMethod: 'EcoCash',
    provider: 'EcoCash Direct',
    status: 'Succeeded',
    createdAt: '2024-01-15T10:30:00Z',
    completedAt: '2024-01-15T10:30:15Z',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  };

  const paymentAttempts = [
    {
      id: 'att_001',
      provider: 'EcoCash Direct',
      status: 'Succeeded',
      amount: 10.00,
      currency: 'USD',
      responseCode: '200',
      responseMessage: 'Payment successful',
      timestamp: '2024-01-15T10:30:15Z',
      duration: '1.2s',
    },
  ];

  const statusTimeline = [
    { status: 'Created', timestamp: '2024-01-15T10:30:00Z', actor: 'System' },
    { status: 'Processing', timestamp: '2024-01-15T10:30:05Z', actor: 'System' },
    { status: 'Succeeded', timestamp: '2024-01-15T10:30:15Z', actor: 'Provider' },
  ];

  const webhookEvents = [
    {
      id: 'evt_001',
      eventType: 'payment.succeeded',
      endpoint: 'https://acme.com/webhook',
      status: 'Delivered',
      attempts: 1,
      deliveredAt: '2024-01-15T10:30:20Z',
      responseCode: '200',
    },
  ];

  const relatedRefunds = [
    {
      id: 'ref_001',
      amount: 5.00,
      status: 'Succeeded',
      reason: 'Customer request',
      createdAt: '2024-01-16T14:20:00Z',
    },
  ];

  const internalNotes = [
    {
      id: 'note_001',
      author: 'John D.',
      content: 'Customer contacted about duplicate charge - investigated and confirmed single payment',
      createdAt: '2024-01-16T09:15:00Z',
    },
  ];

  return (
    <>
      <div className="mb-4">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-2">
            <li className="breadcrumb-item"><Link href="/admin/transactions">Transactions</Link></li>
            <li className="breadcrumb-item active" aria-current="page">{transaction.id}</li>
          </ol>
        </nav>
        <h2 className="h4">Transaction Investigation</h2>
        <p className="text-muted">Comprehensive transaction details and investigation tools</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Transaction Summary Card */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="card-title mb-0">{transaction.id}</h5>
                <small className="text-muted">Merchant Reference: {transaction.merchantRef}</small>
              </div>
              <div className="d-flex gap-2">
                <StatusBadge status={transaction.status} type="payment" size="md" />
                <button className="btn btn-sm btn-outline-secondary">
                  <i className="bi bi-download me-1"></i>
                  Export
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-6 col-lg-3">
                  <p className="text-muted small mb-1">Amount</p>
                  <p className="h4 mb-0">{transaction.currency} {transaction.amount.toFixed(2)}</p>
                </div>
                <div className="col-md-6 col-lg-3">
                  <p className="text-muted small mb-1">Fee</p>
                  <p className="h5 mb-0">{transaction.currency} {transaction.fee.toFixed(2)}</p>
                </div>
                <div className="col-md-6 col-lg-3">
                  <p className="text-muted small mb-1">Net Amount</p>
                  <p className="h5 mb-0 text-success">{transaction.currency} {transaction.netAmount.toFixed(2)}</p>
                </div>
                <div className="col-md-6 col-lg-3">
                  <p className="text-muted small mb-1">Payment Method</p>
                  <p className="h5 mb-0">{transaction.paymentMethod}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <ul className="nav nav-tabs mb-4" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'attempts' ? 'active' : ''}`}
                onClick={() => setActiveTab('attempts')}
              >
                Payment Attempts
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'timeline' ? 'active' : ''}`}
                onClick={() => setActiveTab('timeline')}
              >
                Status Timeline
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'webhooks' ? 'active' : ''}`}
                onClick={() => setActiveTab('webhooks')}
              >
                Webhooks
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'notes' ? 'active' : ''}`}
                onClick={() => setActiveTab('notes')}
              >
                Notes
              </button>
            </li>
          </ul>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="row g-4">
                <div className="col-lg-8">
                  <div className="card mb-4">
                    <div className="card-header">
                      <h5 className="card-title mb-0">Transaction Details</h5>
                    </div>
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <p className="text-muted small mb-1">Transaction ID</p>
                          <p className="font-monospace small">{transaction.id}</p>
                        </div>
                        <div className="col-md-6">
                          <p className="text-muted small mb-1">Merchant Reference</p>
                          <p className="small">{transaction.merchantRef}</p>
                        </div>
                        <div className="col-md-6">
                          <p className="text-muted small mb-1">Merchant</p>
                          <Link href="/admin/merchants" className="small text-decoration-none">
                            {transaction.merchant}
                          </Link>
                        </div>
                        <div className="col-md-6">
                          <p className="text-muted small mb-1">Merchant ID</p>
                          <p className="font-monospace small">{transaction.merchantId}</p>
                        </div>
                        <div className="col-md-6">
                          <p className="text-muted small mb-1">Customer Email</p>
                          <p className="small">{transaction.customerEmail}</p>
                        </div>
                        <div className="col-md-6">
                          <p className="text-muted small mb-1">Payment Method</p>
                          <p className="small">{transaction.paymentMethod}</p>
                        </div>
                        <div className="col-md-6">
                          <p className="text-muted small mb-1">Provider</p>
                          <p className="small">{transaction.provider}</p>
                        </div>
                        <div className="col-md-6">
                          <p className="text-muted small mb-1">Status</p>
                          <StatusBadge status={transaction.status} type="payment" size="sm" />
                        </div>
                        <div className="col-md-6">
                          <p className="text-muted small mb-1">Created At</p>
                          <p className="small">{new Date(transaction.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="col-md-6">
                          <p className="text-muted small mb-1">Completed At</p>
                          <p className="small">{new Date(transaction.completedAt).toLocaleString()}</p>
                        </div>
                        <div className="col-md-6">
                          <p className="text-muted small mb-1">IP Address</p>
                          <p className="font-monospace small">{transaction.ipAddress}</p>
                        </div>
                        <div className="col-md-6">
                          <p className="text-muted small mb-1">User Agent</p>
                          <p className="small text-truncate" style={{ maxWidth: '200px' }}>
                            {transaction.userAgent}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Related Refunds */}
                  {relatedRefunds.length > 0 && (
                    <div className="card">
                      <div className="card-header">
                        <h5 className="card-title mb-0">Related Refunds</h5>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Refund ID</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Reason</th>
                                <th>Date</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {relatedRefunds.map((refund) => (
                                <tr key={refund.id}>
                                  <td className="font-monospace small">{refund.id}</td>
                                  <td>{transaction.currency} {refund.amount.toFixed(2)}</td>
                                  <td><StatusBadge status={refund.status} type="refund" size="sm" /></td>
                                  <td className="small">{refund.reason}</td>
                                  <td className="text-muted small">{new Date(refund.createdAt).toLocaleDateString()}</td>
                                  <td>
                                    <button className="btn btn-sm btn-outline-primary">View</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="col-lg-4">
                  {/* Quick Actions */}
                  <div className="card mb-4">
                    <div className="card-header">
                      <h5 className="card-title mb-0">Quick Actions</h5>
                    </div>
                    <div className="card-body">
                      <div className="d-grid gap-2">
                        <button className="btn btn-outline-primary text-start">
                          <i className="bi bi-arrow-repeat me-2"></i>
                          Retry Investigation
                        </button>
                        <button className="btn btn-outline-primary text-start">
                          <i className="bi bi-bank me-2"></i>
                          View Provider
                        </button>
                        <Link href="/admin/merchants" className="btn btn-outline-primary text-start text-decoration-none">
                          <i className="bi bi-shop me-2"></i>
                          Open Merchant
                        </Link>
                        <button className="btn btn-outline-primary text-start">
                          <i className="bi bi-arrow-counterclockwise me-2"></i>
                          Review Refund
                        </button>
                        <button className="btn btn-outline-primary text-start">
                          <i className="bi bi-broadcast me-2"></i>
                          Inspect Webhooks
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Fee Breakdown */}
                  <div className="card">
                    <div className="card-header">
                      <h5 className="card-title mb-0">Fee Breakdown</h5>
                    </div>
                    <div className="card-body">
                      <div className="list-group list-group-flush">
                        <div className="list-group-item d-flex justify-content-between">
                          <span>Processing Fee</span>
                          <span>{transaction.currency} 0.35</span>
                        </div>
                        <div className="list-group-item d-flex justify-content-between">
                          <span>Provider Fee</span>
                          <span>{transaction.currency} 0.10</span>
                        </div>
                        <div className="list-group-item d-flex justify-content-between fw-bold">
                          <span>Total Fee</span>
                          <span>{transaction.currency} {transaction.fee.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Attempts Tab */}
            {activeTab === 'attempts' && (
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Payment Attempts</h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Attempt ID</th>
                          <th>Provider</th>
                          <th>Status</th>
                          <th>Amount</th>
                          <th>Response Code</th>
                          <th>Response Message</th>
                          <th>Duration</th>
                          <th>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentAttempts.map((attempt) => (
                          <tr key={attempt.id}>
                            <td className="font-monospace small">{attempt.id}</td>
                            <td>{attempt.provider}</td>
                            <td><StatusBadge status={attempt.status} type="payment" size="sm" /></td>
                            <td>{attempt.currency} {attempt.amount.toFixed(2)}</td>
                            <td className="font-monospace small">{attempt.responseCode}</td>
                            <td className="small">{attempt.responseMessage}</td>
                            <td className="small">{attempt.duration}</td>
                            <td className="text-muted small">{new Date(attempt.timestamp).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Status Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Status Timeline</h5>
                </div>
                <div className="card-body">
                  <div className="timeline">
                    {statusTimeline.map((event, index) => (
                      <div key={index} className="d-flex gap-3 mb-4">
                        <div className="flex-shrink-0">
                          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-grow-1">
                          <div className="card">
                            <div className="card-body">
                              <div className="d-flex justify-content-between mb-2">
                                <h6 className="mb-0">{event.status}</h6>
                                <small className="text-muted">{new Date(event.timestamp).toLocaleString()}</small>
                              </div>
                              <p className="small text-muted mb-0">Actor: {event.actor}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Webhooks Tab */}
            {activeTab === 'webhooks' && (
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Webhook Events</h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Event ID</th>
                          <th>Event Type</th>
                          <th>Endpoint</th>
                          <th>Status</th>
                          <th>Attempts</th>
                          <th>Delivered At</th>
                          <th>Response Code</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {webhookEvents.map((event) => (
                          <tr key={event.id}>
                            <td className="font-monospace small">{event.id}</td>
                            <td className="small">{event.eventType}</td>
                            <td className="small text-truncate" style={{ maxWidth: '150px' }}>{event.endpoint}</td>
                            <td><StatusBadge status={event.status} type="default" size="sm" /></td>
                            <td className="small">{event.attempts}</td>
                            <td className="text-muted small">{new Date(event.deliveredAt).toLocaleString()}</td>
                            <td className="font-monospace small">{event.responseCode}</td>
                            <td>
                              <button className="btn btn-sm btn-outline-primary">View Payload</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="row g-4">
                <div className="col-lg-8">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="card-title mb-0">Internal Notes</h5>
                    </div>
                    <div className="card-body">
                      {internalNotes.length === 0 ? (
                        <p className="text-muted text-center py-4">No notes added yet</p>
                      ) : (
                        <div className="list-group list-group-flush">
                          {internalNotes.map((note) => (
                            <div key={note.id} className="list-group-item">
                              <div className="d-flex justify-content-between mb-2">
                                <strong>{note.author}</strong>
                                <small className="text-muted">{new Date(note.createdAt).toLocaleString()}</small>
                              </div>
                              <p className="mb-0">{note.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-lg-4">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="card-title mb-0">Add Note</h5>
                    </div>
                    <div className="card-body">
                      <textarea
                        className="form-control mb-3"
                        rows={4}
                        placeholder="Enter your note..."
                      ></textarea>
                      <button className="btn btn-primary w-100">Add Note</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

export default function TransactionInvestigation() {
  return (
    <Suspense fallback={<div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>}>
      <TransactionInvestigationContent />
    </Suspense>
  );
}
