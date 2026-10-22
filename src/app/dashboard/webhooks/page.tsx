'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';

export default function Webhooks() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const webhooks = [
    {
      id: 'wh_001',
      url: 'https://acme.com/api/webhooks/payments',
      description: 'Payment status updates',
      events: ['payment.succeeded', 'payment.failed', 'payment.pending'],
      status: 'Active',
      secret: 'whsec_xxxxxxxxxxxx',
      createdAt: '2023-01-15',
      lastTriggered: '2024-01-15T10:30:00Z',
      successRate: 98.5,
    },
    {
      id: 'wh_002',
      url: 'https://acme.com/api/webhooks/refunds',
      description: 'Refund notifications',
      events: ['refund.succeeded', 'refund.failed'],
      status: 'Active',
      secret: 'whsec_yyyyyyyyyyyy',
      createdAt: '2023-03-20',
      lastTriggered: '2024-01-14T14:20:00Z',
      successRate: 99.2,
    },
    {
      id: 'wh_003',
      url: 'https://acme.com/api/webhooks/disputes',
      description: 'Dispute alerts',
      events: ['dispute.created', 'dispute.updated'],
      status: 'Paused',
      secret: 'whsec_zzzzzzzzzzzz',
      createdAt: '2023-06-10',
      lastTriggered: '2024-01-10T09:00:00Z',
      successRate: 95.0,
    },
  ];

  const recentDeliveries = [
    {
      id: 'del_001',
      webhookId: 'wh_001',
      event: 'payment.succeeded',
      status: 'Delivered',
      statusCode: 200,
      timestamp: '2024-01-15T10:30:00Z',
      attempts: 1,
    },
    {
      id: 'del_002',
      webhookId: 'wh_001',
      event: 'payment.failed',
      status: 'Failed',
      statusCode: 500,
      timestamp: '2024-01-15T09:45:00Z',
      attempts: 3,
    },
    {
      id: 'del_003',
      webhookId: 'wh_002',
      event: 'refund.succeeded',
      status: 'Delivered',
      statusCode: 200,
      timestamp: '2024-01-14T14:20:00Z',
      attempts: 1,
    },
  ];

  const availableEvents = [
    'payment.succeeded',
    'payment.failed',
    'payment.pending',
    'payment.created',
    'refund.succeeded',
    'refund.failed',
    'refund.created',
    'dispute.created',
    'dispute.updated',
    'chargeback.created',
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-success';
      case 'Paused': return 'bg-warning text-dark';
      case 'Disabled': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-success';
      case 'Failed': return 'bg-danger';
      case 'Pending': return 'bg-warning text-dark';
      case 'Retrying': return 'bg-info text-dark';
      default: return 'bg-secondary';
    }
  };

  return (
    <>
      <div className="mb-4">
        <h2 className="h4">Webhooks</h2>
        <p className="text-muted">Configure webhooks to receive real-time payment notifications</p>
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
                  <p className="text-muted small mb-1">Total Webhooks</p>
                  <p className="h3 mb-0">{webhooks.length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Active</p>
                  <p className="h3 mb-0 text-success">{webhooks.filter(w => w.status === 'Active').length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Avg Success Rate</p>
                  <p className="h3 mb-0 text-primary">
                    {(webhooks.reduce((sum, w) => sum + w.successRate, 0) / webhooks.length).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Recent Deliveries</p>
                  <p className="h3 mb-0 text-info">{recentDeliveries.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex gap-2">
                  <select className="form-select form-select-sm" style={{ width: '150px' }}>
                    <option>All Status</option>
                    <option>Active</option>
                    <option>Paused</option>
                    <option>Disabled</option>
                  </select>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                  <i className="bi bi-plus-circle me-2"></i>
                  Create Webhook
                </button>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            {/* Webhooks List */}
            <div className="col-lg-8">
              <div className="card h-100">
                <div className="card-header">
                  <h5 className="card-title mb-0">Your Webhooks</h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>URL</th>
                          <th>Description</th>
                          <th>Events</th>
                          <th>Status</th>
                          <th>Success Rate</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {webhooks.map((webhook) => (
                          <tr key={webhook.id}>
                            <td>
                              <div className="text-truncate" style={{ maxWidth: '200px' }}>
                                <code className="small">{webhook.url}</code>
                              </div>
                            </td>
                            <td className="small">{webhook.description}</td>
                            <td>
                              <div className="d-flex flex-wrap gap-1">
                                {webhook.events.slice(0, 2).map((event) => (
                                  <span key={event} className="badge bg-light text-dark small">{event}</span>
                                ))}
                                {webhook.events.length > 2 && (
                                  <span className="badge bg-light text-dark small">+{webhook.events.length - 2}</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${getStatusColor(webhook.status)}`}>{webhook.status}</span>
                            </td>
                            <td className="small">{webhook.successRate.toFixed(1)}%</td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-outline-primary" title="View">
                                  <i className="bi bi-eye"></i>
                                </button>
                                <button className="btn btn-outline-primary" title="Test">
                                  <i className="bi bi-play-circle"></i>
                                </button>
                                <button className="btn btn-outline-secondary" title="More">
                                  <i className="bi bi-three-dots"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Deliveries */}
            <div className="col-lg-4">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Recent Deliveries</h5>
                  <Link href="/dashboard/webhooks/deliveries" className="btn btn-sm btn-link">
                    View all →
                  </Link>
                </div>
                <div className="card-body">
                  <div className="list-group list-group-flush">
                    {recentDeliveries.map((delivery) => (
                      <div key={delivery.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-1 small fw-medium">{delivery.event}</h6>
                            <p className="text-muted small mb-0">{webhooks.find(w => w.id === delivery.webhookId)?.url}</p>
                          </div>
                          <span className={`badge ${getDeliveryStatusColor(delivery.status)}`}>
                            {delivery.status}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            {new Date(delivery.timestamp).toLocaleString()}
                          </small>
                          <small className="text-muted">
                            {delivery.attempts} attempt{delivery.attempts > 1 ? 's' : ''}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Create Webhook Modal */}
          {showCreateModal && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-lg">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Create Webhook</h5>
                    <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Endpoint URL *</label>
                      <input type="url" className="form-control" placeholder="https://yourdomain.com/api/webhooks" />
                      <small className="text-muted">Must be publicly accessible HTTPS endpoint</small>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <input type="text" className="form-control" placeholder="What is this webhook for?" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Events to Send *</label>
                      <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {availableEvents.map((event) => (
                          <div className="form-check" key={event}>
                            <input className="form-check-input" type="checkbox" id={`evt-${event}`} />
                            <label className="form-check-label" htmlFor={`evt-${event}`}>
                              {event}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Webhook Secret</label>
                      <div className="input-group">
                        <input type="text" className="form-control" value="whsec_xxxxxxxxxxxx" readOnly />
                        <button className="btn btn-outline-secondary">
                          <i className="bi bi-arrow-repeat"></i>
                        </button>
                      </div>
                      <small className="text-muted">Used to verify webhook signatures</small>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Retry Policy</label>
                      <select className="form-select">
                        <option>Automatic retry (up to 3 times)</option>
                        <option>Automatic retry (up to 5 times)</option>
                        <option>Automatic retry (up to 10 times)</option>
                        <option>No retry</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(false)}>
                      Create Webhook
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Webhook Guide */}
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Webhook Implementation Guide</h5>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="d-flex gap-3">
                    <div className="text-primary fs-4">
                      <i className="bi bi-shield-check"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">Verify Signatures</h6>
                      <p className="text-muted small mb-0">Always verify webhook signatures to ensure requests are from ZeePay.</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex gap-3">
                    <div className="text-primary fs-4">
                      <i className="bi bi-check-circle"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">Return 200 OK</h6>
                      <p className="text-muted small mb-0">Return a 200 status code to acknowledge receipt of the webhook.</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex gap-3">
                    <div className="text-primary fs-4">
                      <i className="bi bi-clock-history"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">Handle Retries</h6>
                      <p className="text-muted small mb-0">Implement idempotency to handle duplicate webhook deliveries.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
