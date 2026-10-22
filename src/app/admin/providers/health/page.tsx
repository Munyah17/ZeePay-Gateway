'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';

export default function ProviderHealth() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

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

  const providers = [
    {
      id: 'prov_ecocash',
      name: 'EcoCash',
      type: 'Mobile Money',
      status: 'Operational',
      uptime: '99.8%',
      responseTime: '245ms',
      successRate: '98.6%',
      lastIncident: 'None in last 30 days',
      incidents: 0,
      connectedSince: '2023-01-15',
    },
    {
      id: 'prov_innbucks',
      name: 'InnBucks',
      type: 'Mobile Money',
      status: 'Operational',
      uptime: '99.5%',
      responseTime: '312ms',
      successRate: '97.8%',
      lastIncident: '2 days ago - 15min outage',
      incidents: 1,
      connectedSince: '2023-03-20',
    },
    {
      id: 'prov_omari',
      name: 'Omari',
      type: 'Mobile Money',
      status: 'Degraded',
      uptime: '97.2%',
      responseTime: '890ms',
      successRate: '94.1%',
      lastIncident: '2 hours ago - Intermittent delays',
      incidents: 3,
      connectedSince: '2023-06-10',
    },
    {
      id: 'prov_onemoney',
      name: 'OneMoney',
      type: 'Mobile Money',
      status: 'Sandbox',
      uptime: '100%',
      responseTime: '180ms',
      successRate: '99.9%',
      lastIncident: 'None',
      incidents: 0,
      connectedSince: '2023-11-01',
    },
    {
      id: 'prov_zipit',
      name: 'ZIPIT Network',
      type: 'Bank Transfer',
      status: 'Operational',
      uptime: '99.9%',
      responseTime: '1.2s',
      successRate: '99.2%',
      lastIncident: '7 days ago - Scheduled maintenance',
      incidents: 1,
      connectedSince: '2023-02-28',
    },
    {
      id: 'prov_visa',
      name: 'Visa Direct',
      type: 'Card Processing',
      status: 'Sandbox',
      uptime: '100%',
      responseTime: '150ms',
      successRate: '99.1%',
      lastIncident: 'None',
      incidents: 0,
      connectedSince: '2024-01-10',
    },
    {
      id: 'prov_mastercard',
      name: 'Mastercard Direct',
      type: 'Card Processing',
      status: 'Sandbox',
      uptime: '100%',
      responseTime: '165ms',
      successRate: '98.8%',
      lastIncident: 'None',
      incidents: 0,
      connectedSince: '2024-01-10',
    },
    {
      id: 'prov_stripe',
      name: 'Stripe',
      type: 'Card Processing',
      status: 'Sandbox',
      uptime: '100%',
      responseTime: '140ms',
      successRate: '99.5%',
      lastIncident: 'None',
      incidents: 0,
      connectedSince: '2024-01-10',
    },
  ];

  const recentIncidents = [
    {
      id: 'INC-001',
      provider: 'Omari',
      severity: 'Medium',
      type: 'Intermittent Delays',
      startTime: '2024-01-15T08:00:00Z',
      endTime: null,
      status: 'Ongoing',
      affectedTransactions: 234,
    },
    {
      id: 'INC-002',
      provider: 'InnBucks',
      severity: 'Low',
      type: 'Scheduled Maintenance',
      startTime: '2024-01-13T02:00:00Z',
      endTime: '2024-01-13T02:15:00Z',
      status: 'Resolved',
      affectedTransactions: 45,
    },
    {
      id: 'INC-003',
      provider: 'ZIPIT Network',
      severity: 'Low',
      type: 'Scheduled Maintenance',
      startTime: '2024-01-08T03:00:00Z',
      endTime: '2024-01-08T04:30:00Z',
      status: 'Resolved',
      affectedTransactions: 89,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Operational': return 'bg-success';
      case 'Degraded': return 'bg-warning text-dark';
      case 'Sandbox': return 'bg-info text-dark';
      case 'Unavailable': return 'bg-danger';
      case 'Suspended': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-danger';
      case 'High': return 'bg-danger';
      case 'Medium': return 'bg-warning text-dark';
      case 'Low': return 'bg-info text-dark';
      default: return 'bg-secondary';
    }
  };

  return (
    <>
      <div className="mb-4">
        <h2 className="h4">Provider Health</h2>
        <p className="text-muted">Monitor provider uptime, response times, and incidents</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Total Providers</p>
                  <p className="h3 mb-0">{providers.length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Operational</p>
                  <p className="h3 mb-0 text-success">{providers.filter(p => p.status === 'Operational').length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Degraded</p>
                  <p className="h3 mb-0 text-warning">{providers.filter(p => p.status === 'Degraded').length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Active Incidents</p>
                  <p className="h3 mb-0 text-danger">{recentIncidents.filter(i => i.status === 'Ongoing').length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Incidents Alert */}
          {recentIncidents.filter(i => i.status === 'Ongoing').length > 0 && (
            <div className="alert alert-danger mb-4" role="alert">
              <div className="d-flex align-items-center gap-3">
                <i className="bi bi-exclamation-triangle-fill fs-4"></i>
                <div>
                  <strong>Active Incident:</strong> {recentIncidents.find(i => i.status === 'Ongoing')?.provider} is experiencing {recentIncidents.find(i => i.status === 'Ongoing')?.type}
                </div>
                <Link href="/admin/providers/incidents" className="btn btn-sm btn-outline-danger ms-auto">
                  View Details
                </Link>
              </div>
            </div>
          )}

          <div className="row g-4 mb-4">
            {/* Provider Health Table */}
            <div className="col-lg-8">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Provider Status</h5>
                  <button className="btn btn-sm btn-outline-secondary">
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Refresh
                  </button>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Provider</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th>Uptime</th>
                          <th>Response Time</th>
                          <th>Success Rate</th>
                          <th>Incidents</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {providers.map((provider) => (
                          <tr key={provider.id}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                  <span className="fw-bold text-muted small">{provider.name.substring(0, 2).toUpperCase()}</span>
                                </div>
                                <div>
                                  <h6 className="mb-0 small fw-medium">{provider.name}</h6>
                                  <small className="text-muted">Since {provider.connectedSince}</small>
                                </div>
                              </div>
                            </td>
                            <td className="small">{provider.type}</td>
                            <td>
                              <span className={`badge ${getStatusColor(provider.status)}`}>{provider.status}</span>
                            </td>
                            <td className="small">{provider.uptime}</td>
                            <td className="small">{provider.responseTime}</td>
                            <td className="small">{provider.successRate}</td>
                            <td className="small">{provider.incidents}</td>
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
            </div>

            {/* Recent Incidents */}
            <div className="col-lg-4">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Recent Incidents</h5>
                  <Link href="/admin/providers/incidents" className="btn btn-sm btn-link">
                    View all →
                  </Link>
                </div>
                <div className="card-body">
                  <div className="list-group list-group-flush">
                    {recentIncidents.map((incident) => (
                      <div key={incident.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-1 small fw-medium">{incident.provider}</h6>
                            <p className="small text-muted mb-0">{incident.type}</p>
                          </div>
                          <span className={`badge ${getSeverityColor(incident.severity)}`}>{incident.severity}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            {new Date(incident.startTime).toLocaleString()}
                          </small>
                          <StatusBadge status={incident.status} type="default" size="sm" />
                        </div>
                        {incident.affectedTransactions > 0 && (
                          <small className="text-muted d-block mt-1">
                            {incident.affectedTransactions} transactions affected
                          </small>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Charts */}
          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Response Time Trend (24h)</h5>
                </div>
                <div className="card-body">
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-graph-up fs-1 d-block mb-2"></i>
                    <small>Chart visualization would display here</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Success Rate Trend (24h)</h5>
                </div>
                <div className="card-body">
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-graph-up-arrow fs-1 d-block mb-2"></i>
                    <small>Chart visualization would display here</small>
                  </div>
                </div>
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
                  <button className="btn btn-outline-primary w-100">
                    <i className="bi bi-plus-circle me-2"></i>
                    Add Provider
                  </button>
                </div>
                <div className="col-md-3">
                  <button className="btn btn-outline-primary w-100">
                    <i className="bi bi-activity me-2"></i>
                    Run Health Check
                  </button>
                </div>
                <div className="col-md-3">
                  <button className="btn btn-outline-primary w-100">
                    <i className="bi bi-file-earmark-text me-2"></i>
                    View Incident Report
                  </button>
                </div>
                <div className="col-md-3">
                  <button className="btn btn-outline-primary w-100">
                    <i className="bi bi-gear me-2"></i>
                    Configure Alerts
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
