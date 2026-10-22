'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';

export default function IntegrationManager() {
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

  const integrations = [
    {
      id: 'int_ecocash',
      provider: 'EcoCash',
      type: 'Direct API',
      environment: 'Production',
      status: 'Connected',
      credentialsStatus: 'Valid',
      lastTest: '2024-01-15T10:00:00Z',
      testResult: 'Passed',
      apiVersion: 'v2.1',
      webhookUrl: 'https://api.zeepay.co.zw/webhooks/ecocash',
      capabilities: ['Payments', 'Refunds', 'Status Checks'],
      rateLimit: '100 req/min',
    },
    {
      id: 'int_innbucks',
      provider: 'InnBucks',
      type: 'Direct API',
      environment: 'Production',
      status: 'Connected',
      credentialsStatus: 'Valid',
      lastTest: '2024-01-15T09:30:00Z',
      testResult: 'Passed',
      apiVersion: 'v1.5',
      webhookUrl: 'https://api.zeepay.co.zw/webhooks/innbucks',
      capabilities: ['Payments', 'Refunds'],
      rateLimit: '50 req/min',
    },
    {
      id: 'int_omari',
      provider: 'Omari',
      type: 'Direct API',
      environment: 'Production',
      status: 'Degraded',
      credentialsStatus: 'Valid',
      lastTest: '2024-01-15T08:45:00Z',
      testResult: 'Failed',
      apiVersion: 'v1.2',
      webhookUrl: 'https://api.zeepay.co.zw/webhooks/omari',
      capabilities: ['Payments', 'Refunds'],
      rateLimit: '75 req/min',
    },
    {
      id: 'int_onemoney',
      provider: 'OneMoney',
      type: 'Direct API',
      environment: 'Sandbox',
      status: 'Connected',
      credentialsStatus: 'Valid',
      lastTest: '2024-01-14T16:20:00Z',
      testResult: 'Passed',
      apiVersion: 'v1.0',
      webhookUrl: 'https://api-sandbox.zeepay.co.zw/webhooks/onemoney',
      capabilities: ['Payments'],
      rateLimit: '25 req/min',
    },
    {
      id: 'int_visa',
      provider: 'Visa Direct',
      type: 'Card Processing',
      environment: 'Sandbox',
      status: 'Connected',
      credentialsStatus: 'Valid',
      lastTest: '2024-01-10T14:00:00Z',
      testResult: 'Passed',
      apiVersion: 'v3.0',
      webhookUrl: 'https://api-sandbox.zeepay.co.zw/webhooks/visa',
      capabilities: ['Payments', 'Refunds', 'Recurring'],
      rateLimit: '200 req/min',
    },
    {
      id: 'int_mastercard',
      provider: 'Mastercard Direct',
      type: 'Card Processing',
      environment: 'Sandbox',
      status: 'Connected',
      credentialsStatus: 'Valid',
      lastTest: '2024-01-10T14:05:00Z',
      testResult: 'Passed',
      apiVersion: 'v2.5',
      webhookUrl: 'https://api-sandbox.zeepay.co.zw/webhooks/mastercard',
      capabilities: ['Payments', 'Refunds', 'Recurring'],
      rateLimit: '200 req/min',
    },
    {
      id: 'int_stripe',
      provider: 'Stripe',
      type: 'Card Processing',
      environment: 'Sandbox',
      status: 'Connected',
      credentialsStatus: 'Valid',
      lastTest: '2024-01-10T14:10:00Z',
      testResult: 'Passed',
      apiVersion: '2023-10-16',
      webhookUrl: 'https://api-sandbox.zeepay.co.zw/webhooks/stripe',
      capabilities: ['Payments', 'Refunds', 'Recurring'],
      rateLimit: '500 req/min',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Connected': return 'bg-success';
      case 'Degraded': return 'bg-warning text-dark';
      case 'Disconnected': return 'bg-danger';
      case 'Pending': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };

  const getTestResultColor = (result: string) => {
    switch (result) {
      case 'Passed': return 'text-success';
      case 'Failed': return 'text-danger';
      case 'Pending': return 'text-muted';
      default: return 'text-muted';
    }
  };

  return (
    <>
      <div className="mb-4">
        <h2 className="h4">Integration Manager</h2>
        <p className="text-muted">Configure and manage provider integrations, credentials, and test environments</p>
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
                  <p className="text-muted small mb-1">Total Integrations</p>
                  <p className="h3 mb-0">{integrations.length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Production</p>
                  <p className="h3 mb-0 text-success">{integrations.filter(i => i.environment === 'Production').length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Sandbox</p>
                  <p className="h3 mb-0 text-info">{integrations.filter(i => i.environment === 'Sandbox').length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Degraded</p>
                  <p className="h3 mb-0 text-warning">{integrations.filter(i => i.status === 'Degraded').length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Integrations Table */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Provider Integrations</h5>
              <button className="btn btn-sm btn-primary">
                <i className="bi bi-plus-circle me-1"></i>
                Add Integration
              </button>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Provider</th>
                      <th>Type</th>
                      <th>Environment</th>
                      <th>Status</th>
                      <th>Credentials</th>
                      <th>Last Test</th>
                      <th>API Version</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {integrations.map((integration) => (
                      <tr key={integration.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                              <span className="fw-bold text-muted small">{integration.provider.substring(0, 2).toUpperCase()}</span>
                            </div>
                            <div>
                              <h6 className="mb-0 small fw-medium">{integration.provider}</h6>
                              <small className="text-muted">{integration.id}</small>
                            </div>
                          </div>
                        </td>
                        <td className="small">{integration.type}</td>
                        <td>
                          <span className={`badge ${integration.environment === 'Production' ? 'bg-success' : 'bg-info text-dark'}`}>
                            {integration.environment}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusColor(integration.status)}`}>{integration.status}</span>
                        </td>
                        <td>
                          <span className={`badge ${integration.credentialsStatus === 'Valid' ? 'bg-success' : 'bg-warning text-dark'}`}>
                            {integration.credentialsStatus}
                          </span>
                        </td>
                        <td>
                          <div>
                            <small className={getTestResultColor(integration.testResult)}>{integration.testResult}</small>
                            <br />
                            <small className="text-muted">{new Date(integration.lastTest).toLocaleDateString()}</small>
                          </div>
                        </td>
                        <td className="small font-monospace">{integration.apiVersion}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-primary">
                              <i className="bi bi-gear"></i>
                            </button>
                            <button className="btn btn-outline-success">
                              <i className="bi bi-play-circle"></i>
                            </button>
                            <button className="btn btn-outline-secondary">
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

          {/* Integration Details */}
          <div className="row g-4 mb-4">
            <div className="col-lg-6">
              <div className="card h-100">
                <div className="card-header">
                  <h5 className="card-title mb-0">Test Credentials</h5>
                </div>
                <div className="card-body">
                  <div className="alert alert-info" role="alert">
                    <i className="bi bi-info-circle me-2"></i>
                    Test credentials are used for sandbox testing and integration validation
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">Select Provider</label>
                    <select className="form-select form-select-sm">
                      <option>EcoCash (Sandbox)</option>
                      <option>Visa Direct (Sandbox)</option>
                      <option>Mastercard Direct (Sandbox)</option>
                      <option>Stripe (Sandbox)</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">API Key</label>
                    <div className="input-group input-group-sm">
                      <input type="password" className="form-control" value="sk_test_xxxxxxxxxxxx" readOnly />
                      <button className="btn btn-outline-secondary">
                        <i className="bi bi-eye"></i>
                      </button>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">API Secret</label>
                    <div className="input-group input-group-sm">
                      <input type="password" className="form-control" value="••••••••••••••••" readOnly />
                      <button className="btn btn-outline-secondary">
                        <i className="bi bi-eye"></i>
                      </button>
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-primary">
                      <i className="bi bi-arrow-repeat me-1"></i>
                      Rotate Keys
                    </button>
                    <button className="btn btn-sm btn-outline-success">
                      <i className="bi bi-play-circle me-1"></i>
                      Test Connection
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card h-100">
                <div className="card-header">
                  <h5 className="card-title mb-0">Webhook Configuration</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label small">Webhook URL</label>
                    <input type="text" className="form-control form-control-sm" value="https://api.zeepay.co.zw/webhooks/ecocash" readOnly />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">Webhook Secret</label>
                    <div className="input-group input-group-sm">
                      <input type="password" className="form-control" value="whsec_xxxxxxxxxxxx" readOnly />
                      <button className="btn btn-outline-secondary">
                        <i className="bi bi-eye"></i>
                      </button>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">Events</label>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="evt1" defaultChecked />
                      <label className="form-check-label small" htmlFor="evt1">payment.succeeded</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="evt2" defaultChecked />
                      <label className="form-check-label small" htmlFor="evt2">payment.failed</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="evt3" defaultChecked />
                      <label className="form-check-label small" htmlFor="evt3">refund.succeeded</label>
                    </div>
                  </div>
                  <button className="btn btn-sm btn-outline-primary w-100">
                    <i className="bi bi-gear me-1"></i>
                    Configure Webhook
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Certification & Testing */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title mb-0">Certification & Testing</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Provider</th>
                      <th>Test Scenarios</th>
                      <th>Passed</th>
                      <th>Failed</th>
                      <th>Last Run</th>
                      <th>Certification Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>EcoCash</td>
                      <td>15</td>
                      <td className="text-success">15</td>
                      <td className="text-danger">0</td>
                      <td className="text-muted small">2024-01-15</td>
                      <td><span className="badge bg-success">Certified</span></td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary">View Report</button>
                      </td>
                    </tr>
                    <tr>
                      <td>InnBucks</td>
                      <td>12</td>
                      <td className="text-success">12</td>
                      <td className="text-danger">0</td>
                      <td className="text-muted small">2024-01-14</td>
                      <td><span className="badge bg-success">Certified</span></td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary">View Report</button>
                      </td>
                    </tr>
                    <tr>
                      <td>Visa Direct</td>
                      <td>20</td>
                      <td className="text-success">18</td>
                      <td className="text-danger">2</td>
                      <td className="text-muted small">2024-01-10</td>
                      <td><span className="badge bg-warning text-dark">In Progress</span></td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary">View Report</button>
                      </td>
                    </tr>
                    <tr>
                      <td>Mastercard Direct</td>
                      <td>20</td>
                      <td className="text-success">19</td>
                      <td className="text-danger">1</td>
                      <td className="text-muted small">2024-01-10</td>
                      <td><span className="badge bg-warning text-dark">In Progress</span></td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary">View Report</button>
                      </td>
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
                <div className="col-md-4">
                  <button className="btn btn-outline-primary w-100">
                    <i className="bi bi-play-circle me-2"></i>
                    Run All Tests
                  </button>
                </div>
                <div className="col-md-4">
                  <button className="btn btn-outline-primary w-100">
                    <i className="bi bi-file-earmark-text me-2"></i>
                    Export Test Report
                  </button>
                </div>
                <div className="col-md-4">
                  <button className="btn btn-outline-primary w-100">
                    <i className="bi bi-check-circle me-2"></i>
                    Request Certification
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
