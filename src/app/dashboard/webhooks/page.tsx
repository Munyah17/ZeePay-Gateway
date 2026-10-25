'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import { Modal, ConfirmDialog, ToastProvider, toast } from '@/components/ui';
import { copyToClipboard as copyText } from '@/utils/actions';

interface Webhook {
  id: string;
  url: string;
  description: string;
  events: string[];
  status: string;
  secret: string;
  createdAt: string;
  lastTriggered: string;
  successRate: number;
}

export default function Webhooks() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [viewing, setViewing] = useState<Webhook | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Webhook | null>(null);
  const [form, setForm] = useState({ url: '', description: '', events: [] as string[], retry: 'Automatic retry (up to 3 times)' });
  const [formSecret, setFormSecret] = useState(`whsec_${Math.random().toString(36).slice(2, 14)}`);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authed = localStorage.getItem('zeepay_authed');
      if (!authed) {
        router.push('/auth/login');
        return;
      }
    }
    try {
      const saved = localStorage.getItem('zeepay_webhooks');
      setWebhooks(saved ? JSON.parse(saved) : seedWebhooks);
    } catch {
      setWebhooks(seedWebhooks);
    }
    setLoading(false);
  }, [router]);

  const persist = (next: Webhook[]) => {
    setWebhooks(next);
    try { localStorage.setItem('zeepay_webhooks', JSON.stringify(next)); } catch { /* noop */ }
  };

  const filtered = webhooks.filter((w) => !statusFilter || w.status === statusFilter);

  const createWebhook = () => {
    const url = form.url.trim();
    if (!/^https:\/\/.+/.test(url)) {
      toast('Enter a valid HTTPS endpoint URL', 'warning');
      return;
    }
    if (form.events.length === 0) {
      toast('Select at least one event', 'warning');
      return;
    }
    const wh: Webhook = {
      id: `wh_${Math.random().toString(36).slice(2, 6)}`,
      url,
      description: form.description.trim() || 'Webhook endpoint',
      events: form.events,
      status: 'Active',
      secret: formSecret,
      createdAt: new Date().toISOString().slice(0, 10),
      lastTriggered: '—',
      successRate: 100,
    };
    persist([wh, ...webhooks]);
    setShowCreateModal(false);
    setForm({ url: '', description: '', events: [], retry: 'Automatic retry (up to 3 times)' });
    setFormSecret(`whsec_${Math.random().toString(36).slice(2, 14)}`);
    toast(`Webhook ${wh.id} created`);
  };

  const toggleWebhook = (wh: Webhook) => {
    const next = wh.status === 'Active' ? 'Paused' : 'Active';
    persist(webhooks.map((w) => (w.id === wh.id ? { ...w, status: next } : w)));
    setMenuFor(null);
    toast(`${wh.id} ${next === 'Paused' ? 'paused' : 'resumed'}`);
  };

  const testWebhook = (wh: Webhook) => {
    toast(`Test event sent to ${wh.url}`, 'info');
  };

  const confirmDelete = () => {
    if (!deleting) return;
    persist(webhooks.filter((w) => w.id !== deleting.id));
    setDeleting(null);
    toast('Webhook deleted', 'info');
  };

  const seedWebhooks: Webhook[] = [
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
    <ToastProvider>
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
                  <p className="h3 mb-0 text-success">{filtered.filter(w => w.status === 'Active').length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Avg Success Rate</p>
                  <p className="h3 mb-0 text-primary">
                    {webhooks.length ? (webhooks.reduce((sum, w) => sum + w.successRate, 0) / webhooks.length).toFixed(1) : '0.0'}%
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
                  <select
                    className="form-select form-select-sm"
                    style={{ width: '150px' }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                    <option value="Disabled">Disabled</option>
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
                        {filtered.map((webhook) => (
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
                                <button className="btn btn-outline-primary" title="View" onClick={() => setViewing(webhook)}>
                                  <i className="bi bi-eye"></i>
                                </button>
                                <button className="btn btn-outline-primary" title="Send test event" onClick={() => testWebhook(webhook)}>
                                  <i className="bi bi-play-circle"></i>
                                </button>
                                <div className="position-relative">
                                  <button
                                    className="btn btn-outline-secondary"
                                    title="More"
                                    onClick={() => setMenuFor(menuFor === webhook.id ? null : webhook.id)}
                                  >
                                    <i className="bi bi-three-dots"></i>
                                  </button>
                                  {menuFor === webhook.id && (
                                    <ul className="dropdown-menu show" style={{ position: 'absolute', right: 0, zIndex: 1050 }}>
                                      <li>
                                        <button className="dropdown-item small" onClick={() => toggleWebhook(webhook)}>
                                          <i className={`bi ${webhook.status === 'Active' ? 'bi-pause' : 'bi-play'} me-2`}></i>
                                          {webhook.status === 'Active' ? 'Pause' : 'Resume'}
                                        </button>
                                      </li>
                                      <li>
                                        <button
                                          className="dropdown-item small"
                                          onClick={() => { copyText(webhook.secret); setMenuFor(null); toast('Secret copied'); }}
                                        >
                                          <i className="bi bi-clipboard me-2"></i>Copy secret
                                        </button>
                                      </li>
                                      <li>
                                        <button
                                          className="dropdown-item small text-danger"
                                          onClick={() => { setDeleting(webhook); setMenuFor(null); }}
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
                      <input
                        type="url"
                        className="form-control"
                        placeholder="https://yourdomain.com/api/webhooks"
                        value={form.url}
                        onChange={(e) => setForm({ ...form, url: e.target.value })}
                      />
                      <small className="text-muted">Must be publicly accessible HTTPS endpoint</small>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="What is this webhook for?"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Events to Send *</label>
                      <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {availableEvents.map((event) => (
                          <div className="form-check" key={event}>
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`evt-${event}`}
                              checked={form.events.includes(event)}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  events: e.target.checked
                                    ? [...form.events, event]
                                    : form.events.filter((ev) => ev !== event),
                                })
                              }
                            />
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
                        <input type="text" className="form-control" value={formSecret} readOnly />
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => { setFormSecret(`whsec_${Math.random().toString(36).slice(2, 14)}`); toast('New secret generated'); }}
                          title="Regenerate"
                        >
                          <i className="bi bi-arrow-repeat"></i>
                        </button>
                      </div>
                      <small className="text-muted">Used to verify webhook signatures</small>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Retry Policy</label>
                      <select
                        className="form-select"
                        value={form.retry}
                        onChange={(e) => setForm({ ...form, retry: e.target.value })}
                      >
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
                    <button type="button" className="btn btn-primary" onClick={createWebhook}>
                      Create Webhook
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* View webhook modal */}
          {viewing && (
            <Modal title={`Webhook ${viewing.id}`} onClose={() => setViewing(null)}>
              <ul className="list-group list-group-flush">
                <li className="list-group-item px-0">
                  <p className="small text-muted mb-1">Endpoint</p>
                  <code className="small">{viewing.url}</code>
                </li>
                <li className="list-group-item d-flex justify-content-between px-0">
                  <span className="small text-muted">Status</span>
                  <span className={`badge ${getStatusColor(viewing.status)}`}>{viewing.status}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between px-0">
                  <span className="small text-muted">Success rate</span>
                  <span className="small fw-medium">{viewing.successRate.toFixed(1)}%</span>
                </li>
                <li className="list-group-item px-0">
                  <p className="small text-muted mb-1">Events</p>
                  <div className="d-flex flex-wrap gap-1">
                    {viewing.events.map((e) => (
                      <span key={e} className="badge bg-light text-dark small">{e}</span>
                    ))}
                  </div>
                </li>
                <li className="list-group-item d-flex justify-content-between px-0 align-items-center">
                  <span className="small text-muted">Secret</span>
                  <button className="btn btn-link btn-sm p-0 small" onClick={() => { copyText(viewing.secret); toast('Secret copied'); }}>
                    {viewing.secret}
                  </button>
                </li>
              </ul>
            </Modal>
          )}

          {/* Delete confirm */}
          {deleting && (
            <ConfirmDialog
              title="Delete webhook"
              message={`Delete endpoint ${deleting.url}? You will stop receiving its events.`}
              confirmLabel="Delete"
              tone="danger"
              onConfirm={confirmDelete}
              onCancel={() => setDeleting(null)}
            />
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
    </ToastProvider>
  );
}
