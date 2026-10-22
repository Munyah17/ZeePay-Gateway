'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';

export default function Invoices() {
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

  const invoices = [
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
                    {invoices.filter(i => i.status === 'Pending' || i.status === 'Overdue').reduce((sum, i) => sum + i.amount, 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Paid This Month</p>
                  <p className="h3 mb-0 text-success">
                    {invoices.filter(i => i.status === 'Paid' && i.paidDate && new Date(i.paidDate).getMonth() === new Date().getMonth()).reduce((sum, i) => sum + i.amount, 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Overdue</p>
                  <p className="h3 mb-0 text-danger">{invoices.filter(i => i.status === 'Overdue').length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Draft</p>
                  <p className="h3 mb-0 text-secondary">{invoices.filter(i => i.status === 'Draft').length}</p>
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
                    <option>Paid</option>
                    <option>Pending</option>
                    <option>Overdue</option>
                    <option>Draft</option>
                  </select>
                  <input type="text" className="form-control form-select-sm" placeholder="Search invoices..." style={{ width: '250px' }} />
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
                    {invoices.map((invoice) => (
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
                            <button className="btn btn-outline-primary" title="View">
                              <i className="bi bi-eye"></i>
                            </button>
                            <button className="btn btn-outline-primary" title="Send">
                              <i className="bi bi-send"></i>
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
                        <input type="text" className="form-control" placeholder="Enter customer name" />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Customer Email *</label>
                        <input type="email" className="form-control" placeholder="customer@example.com" />
                      </div>
                    </div>
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Invoice Number</label>
                        <input type="text" className="form-control" value="INV-1046" readOnly />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Due Date *</label>
                        <input type="date" className="form-control" />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Currency</label>
                      <select className="form-select">
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
                            <tr>
                              <td><input type="text" className="form-control form-control-sm" placeholder="Item description" /></td>
                              <td><input type="number" className="form-control form-control-sm" placeholder="1" min="1" /></td>
                              <td><input type="number" className="form-control form-control-sm" placeholder="0.00" step="0.01" /></td>
                              <td className="text-muted">$0.00</td>
                              <td><button className="btn btn-sm btn-outline-danger"><i className="bi bi-trash"></i></button></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <button className="btn btn-sm btn-outline-primary mt-2">
                        <i className="bi bi-plus me-1"></i>
                        Add Item
                      </button>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Notes (Optional)</label>
                      <textarea className="form-control" rows={2} placeholder="Payment terms, thank you message, etc."></textarea>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-outline-primary me-2" onClick={() => setShowCreateModal(false)}>
                      Save as Draft
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(false)}>
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
              <button className="btn btn-sm btn-outline-primary">
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
                      <button className="btn btn-sm btn-outline-primary w-100">Use Template</button>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card h-100">
                    <div className="card-body">
                      <h6 className="mb-2">Recurring Invoice</h6>
                      <p className="text-muted small mb-2">For subscription-based billing</p>
                      <button className="btn btn-sm btn-outline-primary w-100">Use Template</button>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card h-100">
                    <div className="card-body">
                      <h6 className="mb-2">Project Invoice</h6>
                      <p className="text-muted small mb-2">For milestone-based projects</p>
                      <button className="btn btn-sm btn-outline-primary w-100">Use Template</button>
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
