'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';

export default function RoutingRules() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedRule, setSelectedRule] = useState<string | null>(null);

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

  const routingRules = [
    {
      id: 'rule_001',
      name: 'EcoCash Primary',
      priority: 1,
      status: 'Active',
      conditions: {
        paymentMethod: 'EcoCash',
        currency: ['ZWL', 'USD'],
        country: 'Zimbabwe',
        minAmount: 1,
        maxAmount: 50000,
      },
      providers: [
        { name: 'EcoCash Direct', weight: 100, fallback: false },
      ],
      createdAt: '2023-01-15',
      lastModified: '2024-01-10',
    },
    {
      id: 'rule_002',
      name: 'Card Processing - Visa',
      priority: 2,
      status: 'Active',
      conditions: {
        paymentMethod: 'Visa',
        currency: ['USD', 'EUR', 'GBP'],
        country: 'International',
        minAmount: 1,
        maxAmount: 100000,
      },
      providers: [
        { name: 'Visa Direct', weight: 70, fallback: false },
        { name: 'Stripe', weight: 30, fallback: true },
      ],
      createdAt: '2024-01-10',
      lastModified: '2024-01-10',
    },
    {
      id: 'rule_003',
      name: 'Card Processing - Mastercard',
      priority: 3,
      status: 'Active',
      conditions: {
        paymentMethod: 'Mastercard',
        currency: ['USD', 'EUR', 'GBP'],
        country: 'International',
        minAmount: 1,
        maxAmount: 100000,
      },
      providers: [
        { name: 'Mastercard Direct', weight: 70, fallback: false },
        { name: 'Stripe', weight: 30, fallback: true },
      ],
      createdAt: '2024-01-10',
      lastModified: '2024-01-10',
    },
    {
      id: 'rule_004',
      name: 'InnBucks Primary',
      priority: 4,
      status: 'Active',
      conditions: {
        paymentMethod: 'InnBucks',
        currency: ['ZWL', 'USD'],
        country: 'Zimbabwe',
        minAmount: 1,
        maxAmount: 30000,
      },
      providers: [
        { name: 'InnBucks Direct', weight: 100, fallback: false },
      ],
      createdAt: '2023-03-20',
      lastModified: '2024-01-05',
    },
    {
      id: 'rule_005',
      name: 'Omari with Fallback',
      priority: 5,
      status: 'Degraded',
      conditions: {
        paymentMethod: 'Omari',
        currency: ['ZWL', 'USD'],
        country: 'Zimbabwe',
        minAmount: 1,
        maxAmount: 20000,
      },
      providers: [
        { name: 'Omari Direct', weight: 100, fallback: false },
      ],
      createdAt: '2023-06-10',
      lastModified: '2024-01-15',
    },
    {
      id: 'rule_006',
      name: 'ZIPIT Bank Transfer',
      priority: 6,
      status: 'Active',
      conditions: {
        paymentMethod: 'ZIPIT',
        currency: ['ZWL', 'USD'],
        country: 'Zimbabwe',
        minAmount: 10,
        maxAmount: 100000,
      },
      providers: [
        { name: 'ZIPIT Network', weight: 100, fallback: false },
      ],
      createdAt: '2023-02-28',
      lastModified: '2023-11-20',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-success';
      case 'Draft': return 'bg-secondary';
      case 'Testing': return 'bg-info text-dark';
      case 'Degraded': return 'bg-warning text-dark';
      case 'Suspended': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  return (
    <>
      <div className="mb-4">
        <h2 className="h4">Routing Rules</h2>
        <p className="text-muted">Configure how payments are routed to providers based on conditions</p>
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
                  <p className="text-muted small mb-1">Total Rules</p>
                  <p className="h3 mb-0">{routingRules.length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Active</p>
                  <p className="h3 mb-0 text-success">{routingRules.filter(r => r.status === 'Active').length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Degraded</p>
                  <p className="h3 mb-0 text-warning">{routingRules.filter(r => r.status === 'Degraded').length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">With Fallback</p>
                  <p className="h3 mb-0 text-info">{routingRules.filter(r => r.providers.some(p => p.fallback)).length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Rules Table */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Routing Rules</h5>
              <button className="btn btn-sm btn-primary">
                <i className="bi bi-plus-circle me-1"></i>
                Create Rule
              </button>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Priority</th>
                      <th>Name</th>
                      <th>Payment Method</th>
                      <th>Currency</th>
                      <th>Providers</th>
                      <th>Status</th>
                      <th>Last Modified</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routingRules.map((rule) => (
                      <tr key={rule.id}>
                        <td>
                          <span className="badge bg-primary">{rule.priority}</span>
                        </td>
                        <td>
                          <div>
                            <h6 className="mb-0 small fw-medium">{rule.name}</h6>
                            <small className="text-muted">{rule.id}</small>
                          </div>
                        </td>
                        <td>{rule.conditions.paymentMethod}</td>
                        <td>
                          <div className="d-flex gap-1">
                            {rule.conditions.currency.map((curr) => (
                              <span key={curr} className="badge bg-light text-dark">{curr}</span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {rule.providers.map((provider) => (
                              <span key={provider.name} className="badge bg-secondary">
                                {provider.name} ({provider.weight}%)
                                {provider.fallback && <span className="ms-1">⚡</span>}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getStatusColor(rule.status)}`}>{rule.status}</span>
                        </td>
                        <td className="text-muted small">{new Date(rule.lastModified).toLocaleDateString()}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-primary">
                              <i className="bi bi-pencil"></i>
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

          {/* Rule Details Panel */}
          {selectedRule && (
            <div className="card mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Rule Details</h5>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedRule(null)}>
                  Close
                </button>
              </div>
              <div className="card-body">
                {(() => {
                  const rule = routingRules.find(r => r.id === selectedRule);
                  if (!rule) return null;
                  return (
                    <div className="row g-4">
                      <div className="col-md-6">
                        <h6 className="mb-3">Conditions</h6>
                        <div className="list-group">
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Payment Method</span>
                            <strong>{rule.conditions.paymentMethod}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Currencies</span>
                            <strong>{rule.conditions.currency.join(', ')}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Country</span>
                            <strong>{rule.conditions.country}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Min Amount</span>
                            <strong>${rule.conditions.minAmount}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Max Amount</span>
                            <strong>${rule.conditions.maxAmount}</strong>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <h6 className="mb-3">Provider Configuration</h6>
                        <div className="list-group">
                          {rule.providers.map((provider, index) => (
                            <div key={index} className="list-group-item">
                              <div className="d-flex justify-content-between mb-2">
                                <strong>{provider.name}</strong>
                                <span className="badge bg-primary">{provider.weight}%</span>
                              </div>
                              {provider.fallback && (
                                <span className="badge bg-warning text-dark">Fallback Provider</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Failover Policies */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Failover Policies</h5>
              <button className="btn btn-sm btn-outline-primary">
                <i className="bi bi-plus-circle me-1"></i>
                Add Policy
              </button>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Policy Name</th>
                      <th>Trigger Condition</th>
                      <th>Max Retries</th>
                      <th>Retry Interval</th>
                      <th>Fallback Action</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Standard Payment Failover</td>
                      <td>Provider timeout or error</td>
                      <td>3</td>
                      <td>5s</td>
                      <td>Switch to fallback provider</td>
                      <td><span className="badge bg-success">Active</span></td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-primary">
                            <i className="bi bi-pencil"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>High-Value Transaction</td>
                      <td>Amount &gt; $10,000</td>
                      <td>2</td>
                      <td>10s</td>
                      <td>Manual review required</td>
                      <td><span className="badge bg-success">Active</span></td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-primary">
                            <i className="bi bi-pencil"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Cross-Border Payment</td>
                      <td>Currency mismatch</td>
                      <td>1</td>
                      <td>15s</td>
                      <td>Route to international provider</td>
                      <td><span className="badge bg-info text-dark">Testing</span></td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-primary">
                            <i className="bi bi-pencil"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Routing Simulation */}
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Routing Simulation</h5>
            </div>
            <div className="card-body">
              <div className="alert alert-info" role="alert">
                <i className="bi bi-info-circle me-2"></i>
                Test routing rules with simulated transactions to verify provider selection
              </div>
              <div className="row g-3 mb-3">
                <div className="col-md-3">
                  <label className="form-label small">Payment Method</label>
                  <select className="form-select form-select-sm">
                    <option>EcoCash</option>
                    <option>Visa</option>
                    <option>Mastercard</option>
                    <option>InnBucks</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label small">Currency</label>
                  <select className="form-select form-select-sm">
                    <option>USD</option>
                    <option>ZWL</option>
                    <option>EUR</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label small">Amount</label>
                  <input type="number" className="form-control form-control-sm" placeholder="100.00" />
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <button className="btn btn-primary w-100">
                    <i className="bi bi-play-circle me-1"></i>
                    Simulate
                  </button>
                </div>
              </div>
              <div className="border rounded p-3 bg-light">
                <p className="text-muted small mb-0">
                  <i className="bi bi-lightbulb me-1"></i>
                  Simulation results will display here showing which provider would be selected based on current routing rules
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
