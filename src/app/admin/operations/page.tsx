'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import { Modal, ToastProvider, toast } from '@/components/ui';

interface Task { task: string; priority: string; assigned: string; due: string }
interface Alert { id: string; type: string; severity: string; message: string; time: string; status: string }

export default function PaymentOperationsCentre() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [feedPaused, setFeedPaused] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [viewingAlert, setViewingAlert] = useState<Alert | null>(null);

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

  const operationalMetrics = [
    {
      title: 'Failed Payments (Last 24h)',
      value: '47',
      change: '+12',
      trend: 'up',
      color: 'text-danger',
      bgColor: 'border-danger',
      link: '/admin/transactions?status=failed',
    },
    {
      title: 'Pending Approvals',
      value: '23',
      change: '-5',
      trend: 'down',
      color: 'text-warning',
      bgColor: 'border-warning',
      link: '/admin/merchants/applications',
    },
    {
      title: 'Provider Incidents',
      value: '2',
      change: '+1',
      trend: 'up',
      color: 'text-danger',
      bgColor: 'border-danger',
      link: '/admin/providers/health',
    },
    {
      title: 'Settlement Exceptions',
      value: '8',
      change: '0',
      trend: 'neutral',
      color: 'text-warning',
      bgColor: 'border-warning',
      link: '/admin/finance/reconciliation',
    },
    {
      title: 'Merchant Onboarding Queue',
      value: '15',
      change: '+3',
      trend: 'up',
      color: 'text-info',
      bgColor: 'border-info',
      link: '/admin/merchants/verification',
    },
    {
      title: 'Refund Requests',
      value: '34',
      change: '+8',
      trend: 'up',
      color: 'text-info',
      bgColor: 'border-info',
      link: '/admin/payments/refunds',
    },
    {
      title: 'Dispute Cases',
      value: '5',
      change: '-2',
      trend: 'down',
      color: 'text-warning',
      bgColor: 'border-warning',
      link: '/admin/payments/disputes',
    },
    {
      title: 'System Health',
      value: '98.5%',
      change: '-0.3%',
      trend: 'down',
      color: 'text-success',
      bgColor: 'border-success',
      link: '/super-admin/health',
    },
  ];

  const recentAlerts = [
    {
      id: 'ALT-001',
      type: 'Provider Outage',
      severity: 'High',
      message: 'Omari provider experiencing intermittent delays',
      time: '2 hours ago',
      status: 'Investigating',
    },
    {
      id: 'ALT-002',
      type: 'Fraud Alert',
      severity: 'Critical',
      message: 'Unusual transaction pattern detected - Merchant ID 45',
      time: '5 hours ago',
      status: 'Investigating',
    },
    {
      id: 'ALT-003',
      type: 'Settlement Exception',
      severity: 'Medium',
      message: 'Settlement batch #4521 has unmatched transactions',
      time: '1 day ago',
      status: 'Pending',
    },
    {
      id: 'ALT-004',
      type: 'Compliance',
      severity: 'Low',
      message: 'RBA quarterly report due in 30 days',
      time: '1 day ago',
      status: 'Scheduled',
    },
  ];

  const quickActions = [
    { name: 'Investigate Payment', icon: 'bi-search', link: '/admin/transactions' },
    { name: 'View Merchant', icon: 'bi-shop', link: '/admin/merchants' },
    { name: 'Check Provider', icon: 'bi-bank', link: '/admin/providers/health' },
    { name: 'Review Refund', icon: 'bi-arrow-counterclockwise', link: '/admin/payments/refunds' },
    { name: 'Approve Merchant', icon: 'bi-check-circle', link: '/admin/merchants/verification' },
    { name: 'View Incident', icon: 'bi-exclamation-triangle', link: '/admin/providers/health' },
  ];

  return (
    <ToastProvider>
      <div className="mb-4">
        <h2 className="h4">Payment Operations Centre</h2>
        <p className="text-muted">Real-time operational overview and actionable insights</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Operational Metrics */}
          <div className="row g-3 mb-4">
            {operationalMetrics.map((metric) => (
              <div className="col-md-6 col-lg-3" key={metric.title}>
                <Link href={metric.link} className="card text-decoration-none text-dark h-100 border-top-3 border-3">
                  <div className={`card-body ${metric.bgColor}`}>
                    <p className="text-muted small mb-1">{metric.title}</p>
                    <h3 className="h4 mb-1">{metric.value}</h3>
                    <p className={`small ${metric.color} mb-0`}>
                      {metric.trend === 'up' && '↑'}
                      {metric.trend === 'down' && '↓'}
                      {metric.change} vs yesterday
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          <div className="row g-4 mb-4">
            {/* Recent Alerts */}
            <div className="col-lg-8">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Recent Alerts</h5>
                  <Link href="/admin/compliance/alerts" className="btn btn-sm btn-link">
                    View all →
                  </Link>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>ID</th>
                          <th>Type</th>
                          <th>Message</th>
                          <th>Severity</th>
                          <th>Time</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentAlerts.map((alert) => (
                          <tr
                            key={alert.id}
                            role="button"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setViewingAlert(alert)}
                          >
                            <td className="font-monospace small">{alert.id}</td>
                            <td>{alert.type}</td>
                            <td className="small">{alert.message}</td>
                            <td>
                              <StatusBadge
                                status={alert.severity}
                                type="default"
                                size="sm"
                              />
                            </td>
                            <td className="text-muted small">{alert.time}</td>
                            <td>
                              <StatusBadge
                                status={alert.status}
                                type="default"
                                size="sm"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="col-lg-4">
              <div className="card h-100">
                <div className="card-header">
                  <h5 className="card-title mb-0">Quick Actions</h5>
                </div>
                <div className="card-body">
                  <div className="row g-2">
                    {quickActions.map((action) => (
                      <div className="col-6" key={action.name}>
                        <Link
                          href={action.link}
                          className="btn btn-outline-primary w-100 d-flex flex-column align-items-center justify-content-center gap-2"
                          style={{ minHeight: '80px' }}
                        >
                          <i className={`bi ${action.icon} fs-4`}></i>
                          <span className="small text-center">{action.name}</span>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Activity Feed */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Live Activity Feed</h5>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => {
                    setFeedPaused(!feedPaused);
                    toast(feedPaused ? 'Live feed resumed' : 'Live feed paused', 'info');
                  }}
                >
                  <i className={`bi ${feedPaused ? 'bi-play' : 'bi-pause'} me-1`}></i>
                  {feedPaused ? 'Resume' : 'Pause'}
                </button>
                <Link href="/admin/activity" className="btn btn-sm btn-link">
                  View all →
                </Link>
              </div>
            </div>
            <div className="card-body">
              {feedPaused && (
                <div className="alert alert-warning small py-2 mb-3">
                  <i className="bi bi-pause-circle me-2"></i>Feed paused — new events are not being displayed
                </div>
              )}
              <div className="list-group list-group-flush">
                {[
                  { event: 'Payment succeeded', details: 'pay_8x2k91 - $10.00 - EcoCash', time: 'Just now', type: 'success' },
                  { event: 'New merchant application', details: 'TechStart Solutions Ltd', time: '2 min ago', type: 'info' },
                  { event: 'Payment failed', details: 'pay_9q0678 - $15.00 - Visa', time: '5 min ago', type: 'danger' },
                  { event: 'Refund requested', details: 'pay_7m4422 - $50.00 - InnBucks', time: '8 min ago', type: 'warning' },
                  { event: 'Provider health check', details: 'EcoCash - 99.8% uptime', time: '10 min ago', type: 'success' },
                  { event: 'Settlement batch completed', details: 'Batch #4520 - $12,450.00', time: '15 min ago', type: 'success' },
                  { event: 'Webhook delivery failed', details: 'Merchant ID 23 - 3 attempts', time: '20 min ago', type: 'danger' },
                  { event: 'Merchant verified', details: 'Acme Solutions - Verified tier', time: '25 min ago', type: 'success' },
                ].map((activity, index) => (
                  <div key={index} className="list-group-item d-flex align-items-start gap-3">
                    <div className={`bg-light rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${
                      activity.type === 'success' ? 'text-success' :
                      activity.type === 'danger' ? 'text-danger' :
                      activity.type === 'warning' ? 'text-warning' : 'text-info'
                    }`} style={{ width: '32px', height: '32px' }}>
                      <i className={`bi ${
                        activity.type === 'success' ? 'bi-check-circle' :
                        activity.type === 'danger' ? 'bi-x-circle' :
                        activity.type === 'warning' ? 'bi-exclamation-circle' : 'bi-info-circle'
                      }`}></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1 small fw-medium">{activity.event}</h6>
                      <p className="mb-1 small text-muted">{activity.details}</p>
                      <small className="text-muted">{activity.time}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Pending Tasks</h5>
              <span className="badge bg-primary">12 pending</span>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Task</th>
                      <th>Priority</th>
                      <th>Assigned To</th>
                      <th>Due</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { task: 'Review merchant application #45', priority: 'High', assigned: 'John D.', due: '2 hours' },
                      { task: 'Investigate failed payment batch', priority: 'Critical', assigned: 'Sarah M.', due: '1 hour' },
                      { task: 'Approve refund request #892', priority: 'Medium', assigned: 'Mike T.', due: '4 hours' },
                      { task: 'Resolve settlement exception', priority: 'High', assigned: 'Lisa K.', due: '6 hours' },
                    ].map((task, index) => (
                      <tr key={index}>
                        <td className="small">{task.task}</td>
                        <td>
                          <StatusBadge
                            status={task.priority}
                            type="default"
                            size="sm"
                          />
                        </td>
                        <td className="small">{task.assigned}</td>
                        <td className="text-muted small">{task.due}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setViewingTask(task)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Task detail modal */}
      {viewingTask && (
        <Modal title={viewingTask.task} onClose={() => setViewingTask(null)}>
          <ul className="list-group list-group-flush">
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Priority</span>
              <StatusBadge status={viewingTask.priority} type="default" size="sm" />
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Assigned to</span>
              <span className="small">{viewingTask.assigned}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Due in</span>
              <span className="small">{viewingTask.due}</span>
            </li>
          </ul>
          <button
            className="btn btn-success btn-sm w-100 mt-3"
            onClick={() => { setViewingTask(null); toast('Task marked complete'); }}
          >
            Mark complete
          </button>
        </Modal>
      )}

      {/* Alert detail modal */}
      {viewingAlert && (
        <Modal title={`${viewingAlert.id} — ${viewingAlert.type}`} onClose={() => setViewingAlert(null)}>
          <ul className="list-group list-group-flush">
            <li className="list-group-item px-0">
              <p className="small text-muted mb-1">Message</p>
              <p className="small">{viewingAlert.message}</p>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Severity</span>
              <StatusBadge status={viewingAlert.severity} type="default" size="sm" />
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Status</span>
              <StatusBadge status={viewingAlert.status} type="default" size="sm" />
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Raised</span>
              <span className="small">{viewingAlert.time}</span>
            </li>
          </ul>
          <button
            className="btn btn-outline-primary btn-sm w-100 mt-3"
            onClick={() => { setViewingAlert(null); toast(`${viewingAlert.id} acknowledged`, 'info'); }}
          >
            Acknowledge alert
          </button>
        </Modal>
      )}
    </ToastProvider>
  );
}
