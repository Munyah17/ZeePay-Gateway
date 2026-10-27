'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import { Modal, useToast, useConfirm } from '@/components/ui';
import { usePersistentState } from '@/components/ui';
import { copyToClipboard as copyText } from '@/lib/export';

interface PayLink {
  id: string;
  title: string;
  description: string;
  amount: number | null;
  currency: string;
  status: string;
  created: string;
  expires: string | null;
  visits: number;
  conversions: number;
  conversionRate: number;
  totalCollected: number;
  linkUrl: string;
}

export default function PaymentLinks() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [links, setLinks] = useState<PayLink[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState<PayLink | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<PayLink | null>(null);
  const [form, setForm] = useState({ title: '', description: '', amount: '', currency: 'USD', expires: '', email: '' });

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

  const persist = (next: PayLink[]) => {
    setLinks(next);
    try { localStorage.setItem('zeepay_payment_links', JSON.stringify(next)); } catch { /* noop */ }
  };

  const filtered = links.filter(
    (l) =>
      (!statusFilter || l.status === statusFilter) &&
      (!search || l.title.toLowerCase().includes(search.toLowerCase()) || l.description.toLowerCase().includes(search.toLowerCase())),
  );

  const createLink = () => {
    if (!form.title.trim()) {
      toast('Title is required', { tone: 'warning' });
      return;
    }
    const id = `link_${Date.now().toString(36)}`;
    const link: PayLink = {
      id,
      title: form.title.trim(),
      description: form.description.trim(),
      amount: form.amount ? parseFloat(form.amount) : null,
      currency: form.currency,
      status: 'Active',
      created: new Date().toISOString(),
      expires: form.expires ? new Date(form.expires).toISOString() : null,
      visits: 0,
      conversions: 0,
      conversionRate: 0,
      totalCollected: 0,
      linkUrl: `https://pay.zeepay.co.zw/link/${id.slice(-6)}`,
    };
    persist([link, ...links]);
    setShowCreateModal(false);
    setForm({ title: '', description: '', amount: '', currency: 'USD', expires: '', email: '' });
    toast('Payment link created');
  };

  const toggleStatus = (link: PayLink) => {
    const next = link.status === 'Active' ? 'Paused' : 'Active';
    persist(links.map((l) => (l.id === link.id ? { ...l, status: next } : l)));
    setMenuFor(null);
    toast(`Link ${next === 'Paused' ? 'paused' : 'resumed'}`);
  };

  const archiveLink = (link: PayLink) => {
    persist(links.map((l) => (l.id === link.id ? { ...l, status: 'Archived' } : l)));
    setMenuFor(null);
    toast('Link archived', { tone: 'info' });
  };

  const confirmDelete = () => {
    if (!deleting) return;
    persist(links.filter((l) => l.id !== deleting.id));
    setDeleting(null);
    toast('Link deleted', { tone: 'info' });
  };

  const seedLinks: PayLink[] = [
    {
      id: 'link_001',
      title: 'Invoice #1042 - Acme Corp',
      description: 'Payment for consulting services - Q4 2023',
      amount: 1250.00,
      currency: 'USD',
      status: 'Active',
      created: '2024-01-15T10:30:00Z',
      expires: '2024-02-15T10:30:00Z',
      visits: 45,
      conversions: 12,
      conversionRate: 26.7,
      totalCollected: 15000.00,
      linkUrl: 'https://pay.zeepay.co.zw/link/abc123',
    },
    {
      id: 'link_002',
      title: 'Monthly Subscription - Premium',
      description: 'Recurring payment for premium subscription plan',
      amount: 49.99,
      currency: 'USD',
      status: 'Active',
      created: '2024-01-10T14:20:00Z',
      expires: null,
      visits: 234,
      conversions: 89,
      conversionRate: 38.0,
      totalCollected: 4449.11,
      linkUrl: 'https://pay.zeepay.co.zw/link/def456',
    },
    {
      id: 'link_003',
      title: 'Event Registration - Tech Summit 2024',
      description: 'Early bird registration for annual tech conference',
      amount: 299.00,
      currency: 'USD',
      status: 'Expired',
      created: '2024-01-05T09:00:00Z',
      expires: '2024-01-15T23:59:59Z',
      visits: 567,
      conversions: 145,
      conversionRate: 25.6,
      totalCollected: 43355.00,
      linkUrl: 'https://pay.zeepay.co.zw/link/ghi789',
    },
    {
      id: 'link_004',
      title: 'Product Purchase - Software License',
      description: 'One-time license purchase for enterprise software',
      amount: 999.00,
      currency: 'USD',
      status: 'Active',
      created: '2024-01-12T16:45:00Z',
      expires: '2024-03-12T16:45:00Z',
      visits: 23,
      conversions: 5,
      conversionRate: 21.7,
      totalCollected: 4995.00,
      linkUrl: 'https://pay.zeepay.co.zw/link/jkl012',
    },
    {
      id: 'link_005',
      title: 'Donation - Community Project',
      description: 'Voluntary donation for local community initiative',
      amount: null,
      currency: 'USD',
      status: 'Active',
      created: '2024-01-08T11:30:00Z',
      expires: null,
      visits: 156,
      conversions: 78,
      conversionRate: 50.0,
      totalCollected: 2340.00,
      linkUrl: 'https://pay.zeepay.co.zw/link/mno345',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-success';
      case 'Expired': return 'bg-secondary';
      case 'Paused': return 'bg-warning text-dark';
      case 'Archived': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };

  const copyToClipboard = (text: string) => {
    copyText(text).then((ok) => toast(ok ? 'Link copied to clipboard' : 'Copy failed', ok ? 'success' : 'danger'));
  };

  return (
    <>
    <div className="mb-4">
        <h2 className="h4">Payment Links</h2>
        <p className="text-muted">Create and manage payment links for quick collections</p>
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
                  <p className="text-muted small mb-1">Total Links</p>
                  <p className="h3 mb-0">{links.length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Active</p>
                  <p className="h3 mb-0 text-success">{links.filter(l => l.status === 'Active').length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Total Collected</p>
                  <p className="h3 mb-0 text-primary">${links.reduce((sum, l) => sum + l.totalCollected, 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Avg Conversion</p>
                  <p className="h3 mb-0 text-info">{links.length ? (links.reduce((sum, l) => sum + l.conversionRate, 0) / links.length).toFixed(1) : '0.0'}%</p>
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
                    <option value="Expired">Expired</option>
                    <option value="Paused">Paused</option>
                    <option value="Archived">Archived</option>
                  </select>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search links..."
                    style={{ width: '250px' }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                  <i className="bi bi-plus-circle me-2"></i>
                  Create Payment Link
                </button>
              </div>
            </div>
          </div>

          {/* Payment Links Table */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Title</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Visits</th>
                      <th>Conversions</th>
                      <th>Rate</th>
                      <th>Collected</th>
                      <th>Expires</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((link) => (
                      <tr key={link.id}>
                        <td>
                          <div>
                            <h6 className="mb-1 small fw-medium">{link.title}</h6>
                            <p className="text-muted small mb-0 text-truncate" style={{ maxWidth: '200px' }}>
                              {link.description}
                            </p>
                          </div>
                        </td>
                        <td>
                          {link.amount ? (
                            <span className="fw-medium">{link.currency} {link.amount.toFixed(2)}</span>
                          ) : (
                            <span className="text-muted">Open amount</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${getStatusColor(link.status)}`}>{link.status}</span>
                        </td>
                        <td className="small">{link.visits}</td>
                        <td className="small">{link.conversions}</td>
                        <td className="small">{link.conversionRate.toFixed(1)}%</td>
                        <td className="small fw-medium">{link.currency} {link.totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="text-muted small">
                          {link.expires ? new Date(link.expires).toLocaleDateString() : 'Never'}
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-primary" onClick={() => copyToClipboard(link.linkUrl)} title="Copy Link">
                              <i className="bi bi-link-45deg"></i>
                            </button>
                            <button className="btn btn-outline-primary" title="View Details" onClick={() => setViewing(link)}>
                              <i className="bi bi-eye"></i>
                            </button>
                            <div className="position-relative">
                              <button
                                className="btn btn-outline-secondary"
                                title="More Options"
                                onClick={() => setMenuFor(menuFor === link.id ? null : link.id)}
                              >
                                <i className="bi bi-three-dots"></i>
                              </button>
                              {menuFor === link.id && (
                                <ul className="dropdown-menu show" style={{ position: 'absolute', right: 0, zIndex: 1050 }}>
                                  <li>
                                    <button className="dropdown-item small" onClick={() => toggleStatus(link)}>
                                      <i className={`bi ${link.status === 'Active' ? 'bi-pause' : 'bi-play'} me-2`}></i>
                                      {link.status === 'Active' ? 'Pause' : 'Resume'}
                                    </button>
                                  </li>
                                  <li>
                                    <button className="dropdown-item small" onClick={() => archiveLink(link)}>
                                      <i className="bi bi-archive me-2"></i>Archive
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      className="dropdown-item small text-danger"
                                      onClick={() => { setDeleting(link); setMenuFor(null); }}
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

          {/* Create Modal */}
          {showCreateModal && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Create Payment Link</h5>
                    <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Invoice #1234"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="What is this payment for?"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                      ></textarea>
                    </div>
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Amount</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="0.00"
                          step="0.01"
                          value={form.amount}
                          onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
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
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Expires (Optional)</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={form.expires}
                        onChange={(e) => setForm({ ...form, expires: e.target.value })}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Payment Methods</label>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="pm1" defaultChecked />
                        <label className="form-check-label" htmlFor="pm1">All available methods</label>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Customer Email (Optional)</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="customer@example.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={createLink}>
                      Create Link
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tips Section */}
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Tips for Effective Payment Links</h5>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="d-flex gap-3">
                    <div className="text-primary fs-4">
                      <i className="bi bi-lightbulb"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">Clear Descriptions</h6>
                      <p className="text-muted small mb-0">Use descriptive titles and descriptions so customers know exactly what they're paying for.</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex gap-3">
                    <div className="text-primary fs-4">
                      <i className="bi bi-calendar-check"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">Set Expiration Dates</h6>
                      <p className="text-muted small mb-0">For time-sensitive payments, set expiration dates to create urgency.</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex gap-3">
                    <div className="text-primary fs-4">
                      <i className="bi bi-share"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">Share Everywhere</h6>
                      <p className="text-muted small mb-0">Share links via email, SMS, social media, or embed them on your website.</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex gap-3">
                    <div className="text-primary fs-4">
                      <i className="bi bi-graph-up"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">Track Performance</h6>
                      <p className="text-muted small mb-0">Monitor conversion rates to optimize your payment link strategy.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* View modal */}
          {viewing && (
            <Modal open title={viewing.title} onClose={() => setViewing(null)}>
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between px-0">
                  <span className="small text-muted">Status</span>
                  <span className={`badge ${getStatusColor(viewing.status)}`}>{viewing.status}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between px-0">
                  <span className="small text-muted">Amount</span>
                  <span className="small fw-medium">
                    {viewing.amount ? `${viewing.currency} ${viewing.amount.toFixed(2)}` : 'Open amount'}
                  </span>
                </li>
                <li className="list-group-item d-flex justify-content-between px-0">
                  <span className="small text-muted">Link</span>
                  <button
                    className="btn btn-link btn-sm p-0 small"
                    onClick={() => copyToClipboard(viewing.linkUrl)}
                  >
                    {viewing.linkUrl}
                  </button>
                </li>
                <li className="list-group-item d-flex justify-content-between px-0">
                  <span className="small text-muted">Visits / Conversions</span>
                  <span className="small fw-medium">{viewing.visits} / {viewing.conversions}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between px-0">
                  <span className="small text-muted">Total collected</span>
                  <span className="small fw-medium">{viewing.currency} {viewing.totalCollected.toFixed(2)}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between px-0">
                  <span className="small text-muted">Created</span>
                  <span className="small fw-medium">{new Date(viewing.created).toLocaleDateString()}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between px-0">
                  <span className="small text-muted">Expires</span>
                  <span className="small fw-medium">{viewing.expires ? new Date(viewing.expires).toLocaleDateString() : 'Never'}</span>
                </li>
              </ul>
              <p className="text-muted small mt-3 mb-0">{viewing.description}</p>
            </Modal>
          )}

          {/* Delete confirm */}
          {deleting && (
            <Modal open title={"Delete payment link"} onClose={() => setDeleting(null)} size="sm" footer={<><button className="btn btn-light btn-sm" onClick={() => setDeleting(null)}>Cancel</button><button className="btn btn-danger btn-sm" onClick={confirmDelete}>Delete</button></>}><p className="small mb-0">{`Delete "${deleting.title}"? Customers with the link will no longer be able to pay.`}</p></Modal>
          )}
        </>
      )}
    </>
  );
}
