'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import { ToastProvider, toast } from '@/components/ui';

interface Approval {
  id: string;
  type: string;
  queue: string;
  title: string;
  description: string;
  submittedBy: string;
  submittedDate: string;
  priority: string;
  status: string;
  assignedTo: string | null;
  estimatedReviewTime: string;
  data: Record<string, string | number>;
}

export default function ApprovalQueues() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedQueue, setSelectedQueue] = useState('all');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [autoApproving, setAutoApproving] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authed = localStorage.getItem('zeepay_authed');
      if (!authed) {
        router.push('/auth/login');
        return;
      }
    }
    setApprovals(seedApprovals);
    setLoading(false);
  }, [router]);

  const setStatus = (id: string, status: string, msg: string) => {
    setApprovals((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    toast(msg, status === 'Rejected' ? 'warning' : 'success');
  };

  const approvalQueues = [
    {
      id: 'queue_merchants',
      name: 'Merchant Applications',
      icon: 'bi-shop',
      count: 5,
      priority: 'High',
    },
    {
      id: 'queue_providers',
      name: 'Provider Onboarding',
      icon: 'bi-building',
      count: 2,
      priority: 'Medium',
    },
    {
      id: 'queue_settlements',
      name: 'Settlement Adjustments',
      icon: 'bi-cash-stack',
      count: 3,
      priority: 'High',
    },
    {
      id: 'queue_refunds',
      name: 'High-Value Refunds',
      icon: 'bi-arrow-counterclockwise',
      count: 8,
      priority: 'Medium',
    },
    {
      id: 'queue_compliance',
      name: 'Compliance Reviews',
      icon: 'bi-shield-check',
      count: 1,
      priority: 'Critical',
    },
  ];

  const seedApprovals: Approval[] = [
    {
      id: 'app_001',
      type: 'Merchant Application',
      queue: 'queue_merchants',
      title: 'Startup Ventures',
      description: 'New merchant application for technology business',
      submittedBy: 'Emily Brown',
      submittedDate: '2024-01-10T10:00:00Z',
      priority: 'Medium',
      status: 'Pending',
      assignedTo: null,
      estimatedReviewTime: '2 hours',
      data: {
        businessType: 'Technology',
        monthlyVolume: 0,
        riskLevel: 'Unknown',
      },
    },
    {
      id: 'app_002',
      type: 'Merchant Application',
      queue: 'queue_merchants',
      title: 'Digital Solutions Ltd',
      description: 'New merchant application for digital services',
      submittedBy: 'James Wilson',
      submittedDate: '2024-01-15T14:30:00Z',
      priority: 'High',
      status: 'In Review',
      assignedTo: 'Sarah Johnson',
      estimatedReviewTime: '4 hours',
      data: {
        businessType: 'Digital Services',
        monthlyVolume: 50000,
        riskLevel: 'Low',
      },
    },
    {
      id: 'app_003',
      type: 'Settlement Adjustment',
      queue: 'queue_settlements',
      title: 'EcoCash Batch Discrepancy',
      description: 'Request to adjust settlement batch SETT-2024-0114 due to $5.00 discrepancy',
      submittedBy: 'Finance Team',
      submittedDate: '2024-01-14T09:00:00Z',
      priority: 'High',
      status: 'Pending',
      assignedTo: null,
      estimatedReviewTime: '1 hour',
      data: {
        batchNumber: 'SETT-2024-0114',
        amount: 5.00,
        reason: 'Provider-side calculation error',
      },
    },
    {
      id: 'app_004',
      type: 'High-Value Refund',
      queue: 'queue_refunds',
      title: 'Refund Request - $5,000',
      description: 'Customer refund request for disputed transaction',
      submittedBy: 'Support Team',
      submittedDate: '2024-01-15T11:00:00Z',
      priority: 'High',
      status: 'Pending',
      assignedTo: null,
      estimatedReviewTime: '3 hours',
      data: {
        transactionId: 'pay_9q0678',
        amount: 5000.00,
        reason: 'Service not delivered',
      },
    },
    {
      id: 'app_005',
      type: 'Compliance Review',
      queue: 'queue_compliance',
      title: 'Omari Provider Compliance',
      description: 'Quarterly compliance review required for Omari provider',
      submittedBy: 'Compliance System',
      submittedDate: '2024-01-15T08:00:00Z',
      priority: 'Critical',
      status: 'In Review',
      assignedTo: 'Mike Davis',
      estimatedReviewTime: '8 hours',
      data: {
        provider: 'Omari',
        lastAudit: '2024-01-15',
        complianceScore: 72,
      },
    },
  ];

  const filteredApprovals = approvals.filter(
    (app) =>
      (selectedQueue === 'all' || app.queue === selectedQueue) &&
      (priorityFilter === 'All Priorities' || app.priority === priorityFilter) &&
      (statusFilter === 'All Status' || app.status === statusFilter),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-warning text-dark';
      case 'In Review': return 'bg-info text-dark';
      case 'Approved': return 'bg-success';
      case 'Rejected': return 'bg-danger';
      case 'On Hold': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-danger';
      case 'High': return 'bg-warning text-dark';
      case 'Medium': return 'bg-info text-dark';
      case 'Low': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };

  return (
    <ToastProvider>
      <div className="mb-4">
        <h2 className="h4">Approval Queues</h2>
        <p className="text-muted">Review and approve pending requests across all platform areas</p>
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
                  <p className="text-muted small mb-1">Total Pending</p>
                  <p className="h3 mb-0 text-warning">{approvals.filter(a => a.status === 'Pending').length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">In Review</p>
                  <p className="h3 mb-0 text-info">{approvals.filter(a => a.status === 'In Review').length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Critical Priority</p>
                  <p className="h3 mb-0 text-danger">{approvals.filter(a => a.priority === 'Critical').length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Avg Review Time</p>
                  <p className="h3 mb-0 text-primary">3.5h</p>
                </div>
              </div>
            </div>
          </div>

          {/* Queue Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-2">
              <button
                className={`card w-100 ${selectedQueue === 'all' ? 'border-primary' : ''}`}
                onClick={() => setSelectedQueue('all')}
              >
                <div className="card-body text-center">
                  <i className="bi bi-inbox fs-3 mb-2"></i>
                  <h6 className="mb-0">All Queues</h6>
                  <p className="text-muted small mb-0">{approvals.length} items</p>
                </div>
              </button>
            </div>
            {approvalQueues.map((queue) => (
              <div className="col-md-2" key={queue.id}>
                <button
                  className={`card w-100 ${selectedQueue === queue.id ? 'border-primary' : ''}`}
                  onClick={() => setSelectedQueue(queue.id)}
                >
                  <div className="card-body text-center">
                    <i className={`bi ${queue.icon} fs-3 mb-2`}></i>
                    <h6 className="mb-0 small">{queue.name}</h6>
                    <p className="text-muted small mb-0">{queue.count} items</p>
                    <span className={`badge ${getPriorityColor(queue.priority)} mt-2`}>{queue.priority}</span>
                  </div>
                </button>
              </div>
            ))}
          </div>

          {/* Approvals Table */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">
                {selectedQueue === 'all' ? 'All Approvals' : approvalQueues.find(q => q.id === selectedQueue)?.name}
              </h5>
              <div className="d-flex gap-2">
                <select
                  className="form-select form-select-sm"
                  style={{ width: '120px' }}
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option>All Priorities</option>
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
                <select
                  className="form-select form-select-sm"
                  style={{ width: '120px' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option>All Status</option>
                  <option>Pending</option>
                  <option>In Review</option>
                  <option>Approved</option>
                  <option>Rejected</option>
                  <option>On Hold</option>
                </select>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Type</th>
                      <th>Title</th>
                      <th>Submitted By</th>
                      <th>Date</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Assigned To</th>
                      <th>Est. Time</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApprovals.map((approval) => (
                      <tr key={approval.id}>
                        <td>
                          <span className="badge bg-light text-dark">{approval.type}</span>
                        </td>
                        <td>
                          <div>
                            <h6 className="mb-0 small fw-medium">{approval.title}</h6>
                            <small className="text-muted">{approval.description}</small>
                          </div>
                        </td>
                        <td className="small">{approval.submittedBy}</td>
                        <td className="text-muted small">{new Date(approval.submittedDate).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${getPriorityColor(approval.priority)}`}>{approval.priority}</span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusColor(approval.status)}`}>{approval.status}</span>
                        </td>
                        <td className="small">{approval.assignedTo || 'Unassigned'}</td>
                        <td className="small">{approval.estimatedReviewTime}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-primary" onClick={() => setSelectedItem(approval.id)}>
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              className="btn btn-outline-success"
                              title="Approve"
                              onClick={() => setStatus(approval.id, 'Approved', `${approval.title} approved`)}
                            >
                              <i className="bi bi-check-circle"></i>
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              title="Reject"
                              onClick={() => setStatus(approval.id, 'Rejected', `${approval.title} rejected`)}
                            >
                              <i className="bi bi-x-circle"></i>
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

          {/* Approval Details Panel */}
          {selectedItem && (
            <div className="card mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Approval Details</h5>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedItem(null)}>
                  Close
                </button>
              </div>
              <div className="card-body">
                {(() => {
                  const approval = approvals.find(a => a.id === selectedItem);
                  if (!approval) return null;
                  return (
                    <div className="row g-4">
                      <div className="col-md-6">
                        <h6 className="mb-3">Request Information</h6>
                        <div className="list-group">
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Type</span>
                            <strong>{approval.type}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Title</span>
                            <strong>{approval.title}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Description</span>
                            <strong>{approval.description}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Submitted By</span>
                            <strong>{approval.submittedBy}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Submitted Date</span>
                            <strong>{new Date(approval.submittedDate).toLocaleString()}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Priority</span>
                            <span className={`badge ${getPriorityColor(approval.priority)}`}>{approval.priority}</span>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Status</span>
                            <span className={`badge ${getStatusColor(approval.status)}`}>{approval.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <h6 className="mb-3">Request Data</h6>
                        <div className="list-group">
                          {Object.entries(approval.data).map(([key, value]) => (
                            <div key={key} className="list-group-item d-flex justify-content-between">
                              <span className="text-capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                              <strong>{value as string}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <h6 className="mb-3">Assignment</h6>
                        <div className="list-group">
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Assigned To</span>
                            <strong>{approval.assignedTo || 'Unassigned'}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Estimated Review Time</span>
                            <strong>{approval.estimatedReviewTime}</strong>
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="form-label small">Assign To</label>
                          <select
                            className="form-select form-select-sm"
                            value={approval.assignedTo || ''}
                            onChange={(e) => {
                              const assignedTo = e.target.value || null;
                              setApprovals((prev) => prev.map((a) => (a.id === approval.id ? { ...a, assignedTo } : a)));
                              if (assignedTo) toast(`Assigned to ${assignedTo}`, 'info');
                            }}
                          >
                            <option value="">Select reviewer...</option>
                            <option>Sarah Johnson</option>
                            <option>Mike Davis</option>
                            <option>John Smith</option>
                            <option>Emily Brown</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <h6 className="mb-3">Review Actions</h6>
                        <div className="d-grid gap-2">
                          <button className="btn btn-success" onClick={() => setStatus(approval.id, 'Approved', `${approval.title} approved`)}>
                            <i className="bi bi-check-circle me-2"></i>
                            Approve
                          </button>
                          <button className="btn btn-danger" onClick={() => setStatus(approval.id, 'Rejected', `${approval.title} rejected`)}>
                            <i className="bi bi-x-circle me-2"></i>
                            Reject
                          </button>
                          <button className="btn btn-warning" onClick={() => setStatus(approval.id, 'On Hold', `${approval.title} put on hold`)}>
                            <i className="bi bi-pause-circle me-2"></i>
                            Put on Hold
                          </button>
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => toast(`Info request sent to ${approval.submittedBy}`, 'info')}
                          >
                            <i className="bi bi-chat-text me-2"></i>
                            Request More Info
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <button
                    className="btn btn-outline-primary w-100"
                    onClick={() => {
                      setApprovals((prev) => prev.map((a) => (a.status === 'Pending' && !a.assignedTo ? { ...a, assignedTo: 'Sarah Johnson' } : a)));
                      toast('Unassigned items assigned to Sarah Johnson', 'info');
                    }}
                  >
                    <i className="bi bi-people me-2"></i>
                    Assign Reviewers
                  </button>
                </div>
                <div className="col-md-3">
                  <button
                    className="btn btn-outline-primary w-100"
                    disabled={autoApproving}
                    onClick={() => {
                      setAutoApproving(true);
                      setTimeout(() => {
                        setApprovals((prev) => prev.map((a) => (a.status === 'Pending' && a.priority === 'Low' ? { ...a, status: 'Approved' } : a)));
                        setAutoApproving(false);
                        toast('Low-risk pending items auto-approved');
                      }, 1000);
                    }}
                  >
                    <i className="bi bi-lightning me-2"></i>
                    {autoApproving ? 'Approving…' : 'Auto-Approve Low Risk'}
                  </button>
                </div>
                <div className="col-md-3">
                  <button className="btn btn-outline-primary w-100" onClick={() => toast('Escalation rules are managed in governance settings', 'info')}>
                    <i className="bi bi-bell me-2"></i>
                    Set Escalation Rules
                  </button>
                </div>
                <div className="col-md-3">
                  <button className="btn btn-outline-primary w-100" onClick={() => toast('Approval analytics coming soon', 'info')}>
                    <i className="bi bi-file-earmark-bar-graph me-2"></i>
                    Approval Analytics
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </ToastProvider>
  );
}
