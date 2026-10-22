'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';

export default function PaymentLinks() {
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

  const paymentLinks = [
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
    navigator.clipboard.writeText(text);
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
                  <p className="h3 mb-0">{paymentLinks.length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Active</p>
                  <p className="h3 mb-0 text-success">{paymentLinks.filter(l => l.status === 'Active').length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Total Collected</p>
                  <p className="h3 mb-0 text-primary">${paymentLinks.reduce((sum, l) => sum + l.totalCollected, 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Avg Conversion</p>
                  <p className="h3 mb-0 text-info">{(paymentLinks.reduce((sum, l) => sum + l.conversionRate, 0) / paymentLinks.length).toFixed(1)}%</p>
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
                    <option>Expired</option>
                    <option>Paused</option>
                  </select>
                  <input type="text" className="form-control form-control-sm" placeholder="Search links..." style={{ width: '250px' }} />
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
                    {paymentLinks.map((link) => (
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
                            <button className="btn btn-outline-primary" title="View Details">
                              <i className="bi bi-eye"></i>
                            </button>
                            <button className="btn btn-outline-secondary" title="More Options">
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
                      <input type="text" className="form-control" placeholder="e.g., Invoice #1234" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea className="form-control" rows={2} placeholder="What is this payment for?"></textarea>
                    </div>
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Amount</label>
                        <input type="number" className="form-control" placeholder="0.00" step="0.01" />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Currency</label>
                        <select className="form-select">
                          <option>USD</option>
                          <option>ZWL</option>
                          <option>EUR</option>
                          <option>GBP</option>
                        </select>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Expires (Optional)</label>
                      <input type="datetime-local" className="form-control" />
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
                      <input type="email" className="form-control" placeholder="customer@example.com" />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(false)}>
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
        </>
      )}
    </>
  );
}
