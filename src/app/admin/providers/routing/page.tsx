'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import { Modal, ConfirmDialog, ToastProvider, toast } from '@/components/ui';

interface RoutingRule {
  id: string;
  name: string;
  priority: number;
  status: string;
  conditions: {
    paymentMethod: string;
    currency: string[];
    country: string;
    minAmount: number;
    maxAmount: number;
  };
  providers: { name: string; weight: number; fallback: boolean }[];
  createdAt: string;
  lastModified: string;
}

export default function RoutingRules() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const [ruleList, setRuleList] = useState<RoutingRule[]>([]);
  const [editing, setEditing] = useState<RoutingRule | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RoutingRule | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [sim, setSim] = useState({ method: 'EcoCash', currency: 'USD', amount: '100' });
  const [simResult, setSimResult] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({ name: '', method: 'EcoCash', currency: 'USD', minAmount: '1', maxAmount: '10000', provider: 'EcoCash Direct' });
  const [editPolicy, setEditPolicy] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authed = localStorage.getItem('zeepay_authed');
      if (!authed) {
        router.push('/auth/login');
        return;
      }
    }
    setRuleList(seedRules);
    setLoading(false);
  }, [router]);

  const updateRuleStatus = (rule: RoutingRule, status: string) => {
    setRuleList((prev) => prev.map((r) => (r.id === rule.id ? { ...r, status, lastModified: new Date().toISOString().slice(0, 10) } : r)));
    setEditing(null);
    toast(`${rule.name} → ${status}`, 'info');
  };

  const createRule = () => {
    if (!createForm.name.trim()) {
      toast('Rule name required', 'warning');
      return;
    }
    const maxPriority = ruleList.reduce((m, r) => Math.max(m, r.priority), 0);
    const rule: RoutingRule = {
      id: `rule_${Math.random().toString(36).slice(2, 6)}`,
      name: createForm.name.trim(),
      priority: maxPriority + 1,
      status: 'Draft',
      conditions: {
        paymentMethod: createForm.method,
        currency: [createForm.currency],
        country: 'Zimbabwe',
        minAmount: parseFloat(createForm.minAmount) || 1,
        maxAmount: parseFloat(createForm.maxAmount) || 10000,
      },
      providers: [{ name: createForm.provider, weight: 100, fallback: false }],
      createdAt: new Date().toISOString().slice(0, 10),
      lastModified: new Date().toISOString().slice(0, 10),
    };
    setRuleList((prev) => [...prev, rule]);
    setShowCreate(false);
    setCreateForm({ name: '', method: 'EcoCash', currency: 'USD', minAmount: '1', maxAmount: '10000', provider: 'EcoCash Direct' });
    toast(`${rule.name} created as draft`);
  };

  const deleteRule = () => {
    if (!deleteTarget) return;
    setRuleList((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast('Rule deleted', 'info');
  };

  const runSimulation = () => {
    const match = ruleList.find(
      (r) =>
        r.status !== 'Suspended' &&
        r.conditions.paymentMethod === sim.method &&
        r.conditions.currency.includes(sim.currency) &&
        parseFloat(sim.amount) >= r.conditions.minAmount &&
        parseFloat(sim.amount) <= r.conditions.maxAmount,
    );
    if (match) {
      const primary = match.providers.filter((p) => !p.fallback)[0] || match.providers[0];
      const fallback = match.providers.find((p) => p.fallback);
      setSimResult(
        `Rule "${match.name}" (priority ${match.priority}) would route ${sim.amount} ${sim.currency} via ${primary.name} (${primary.weight}%)${fallback ? ` — fallback: ${fallback.name}` : ''}.`,
      );
    } else {
      setSimResult('No active routing rule matches these parameters.');
    }
  };

  const seedRules: RoutingRule[] = [
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
    <ToastProvider>
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
                  <p className="h3 mb-0">{ruleList.length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Active</p>
                  <p className="h3 mb-0 text-success">{ruleList.filter(r => r.status === 'Active').length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Degraded</p>
                  <p className="h3 mb-0 text-warning">{ruleList.filter(r => r.status === 'Degraded').length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">With Fallback</p>
                  <p className="h3 mb-0 text-info">{ruleList.filter(r => r.providers.some(p => p.fallback)).length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Rules Table */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Routing Rules</h5>
              <button className="btn btn-sm btn-primary" onClick={() => setShowCreate(true)}>
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
                    {ruleList.map((rule) => (
                      <tr key={rule.id} role="button" style={{ cursor: 'pointer' }} onClick={() => setSelectedRule(rule.id)}>
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
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-primary" onClick={() => setEditing(rule)}>
                              <i className="bi bi-pencil"></i>
                            </button>
                            <div className="position-relative">
                              <button className="btn btn-outline-secondary" onClick={() => setMenuFor(menuFor === rule.id ? null : rule.id)}>
                                <i className="bi bi-three-dots"></i>
                              </button>
                              {menuFor === rule.id && (
                                <ul className="dropdown-menu show" style={{ position: 'absolute', right: 0, zIndex: 1050 }}>
                                  <li>
                                    <button
                                      className="dropdown-item small"
                                      onClick={() => { updateRuleStatus(rule, rule.status === 'Suspended' ? 'Active' : 'Suspended'); setMenuFor(null); }}
                                    >
                                      {rule.status === 'Suspended' ? 'Activate' : 'Suspend'}
                                    </button>
                                  </li>
                                  <li>
                                    <button className="dropdown-item small text-danger" onClick={() => { setDeleteTarget(rule); setMenuFor(null); }}>
                                      Delete
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
                  const rule = ruleList.find(r => r.id === selectedRule);
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
              <button className="btn btn-sm btn-outline-primary" onClick={() => toast('Add a failover policy (demo)', 'info')}>
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
                          <button className="btn btn-outline-primary" onClick={() => setEditPolicy('Standard Payment Failover')}>
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
                          <button className="btn btn-outline-primary" onClick={() => setEditPolicy('High-Value Transaction')}>
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
                          <button className="btn btn-outline-primary" onClick={() => setEditPolicy('Cross-Border Payment')}>
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
                  <select className="form-select form-select-sm" value={sim.method} onChange={(e) => setSim({ ...sim, method: e.target.value })}>
                    <option>EcoCash</option>
                    <option>Visa</option>
                    <option>Mastercard</option>
                    <option>InnBucks</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label small">Currency</label>
                  <select className="form-select form-select-sm" value={sim.currency} onChange={(e) => setSim({ ...sim, currency: e.target.value })}>
                    <option>USD</option>
                    <option>ZWL</option>
                    <option>EUR</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label small">Amount</label>
                  <input type="number" className="form-control form-control-sm" placeholder="100.00" value={sim.amount} onChange={(e) => setSim({ ...sim, amount: e.target.value })} />
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <button className="btn btn-primary w-100" onClick={runSimulation}>
                    <i className="bi bi-play-circle me-1"></i>
                    Simulate
                  </button>
                </div>
              </div>
              <div className="border rounded p-3 bg-light">
                <p className={`small mb-0 ${simResult ? '' : 'text-muted'}`}>
                  <i className={`bi ${simResult ? 'bi-check-circle text-success' : 'bi-lightbulb'} me-1`}></i>
                  {simResult || 'Simulation results will display here showing which provider would be selected based on current routing rules'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit rule modal */}
      {editing && (
        <Modal title={`Edit ${editing.name}`} onClose={() => setEditing(null)}>
          <div className="mb-3">
            <label className="form-label small">Status</label>
            <select
              className="form-select form-select-sm"
              value={editing.status}
              onChange={(e) => updateRuleStatus(editing, e.target.value)}
            >
              <option>Active</option>
              <option>Draft</option>
              <option>Testing</option>
              <option>Degraded</option>
              <option>Suspended</option>
            </select>
          </div>
          <p className="small text-muted mb-0">
            Routing condition and weight changes require full provider testing in production.
          </p>
        </Modal>
      )}

      {/* Create rule modal */}
      {showCreate && (
        <Modal
          title="Create Routing Rule"
          onClose={() => setShowCreate(false)}
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={createRule}>Create rule</button>
            </>
          }
        >
          <div className="mb-3">
            <label className="form-label small">Rule name *</label>
            <input className="form-control form-control-sm" placeholder="e.g., ZIPIT High Value" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
          </div>
          <div className="row g-2 mb-3">
            <div className="col-6">
              <label className="form-label small">Payment method</label>
              <select className="form-select form-select-sm" value={createForm.method} onChange={(e) => setCreateForm({ ...createForm, method: e.target.value })}>
                <option>EcoCash</option>
                <option>InnBucks</option>
                <option>Omari</option>
                <option>Visa</option>
                <option>Mastercard</option>
                <option>ZIPIT</option>
              </select>
            </div>
            <div className="col-6">
              <label className="form-label small">Currency</label>
              <select className="form-select form-select-sm" value={createForm.currency} onChange={(e) => setCreateForm({ ...createForm, currency: e.target.value })}>
                <option>USD</option>
                <option>ZWL</option>
                <option>EUR</option>
              </select>
            </div>
          </div>
          <div className="row g-2 mb-3">
            <div className="col-6">
              <label className="form-label small">Min amount</label>
              <input type="number" className="form-control form-control-sm" value={createForm.minAmount} onChange={(e) => setCreateForm({ ...createForm, minAmount: e.target.value })} />
            </div>
            <div className="col-6">
              <label className="form-label small">Max amount</label>
              <input type="number" className="form-control form-control-sm" value={createForm.maxAmount} onChange={(e) => setCreateForm({ ...createForm, maxAmount: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="form-label small">Primary provider</label>
            <input className="form-control form-control-sm" value={createForm.provider} onChange={(e) => setCreateForm({ ...createForm, provider: e.target.value })} />
          </div>
        </Modal>
      )}

      {/* Edit failover policy modal */}
      {editPolicy && (
        <Modal
          title={`Edit ${editPolicy}`}
          onClose={() => setEditPolicy(null)}
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditPolicy(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={() => { setEditPolicy(null); toast('Failover policy updated'); }}>Save</button>
            </>
          }
        >
          <div className="mb-3">
            <label className="form-label small">Max retries</label>
            <input type="number" className="form-control form-control-sm" defaultValue="3" />
          </div>
          <div>
            <label className="form-label small">Retry interval (seconds)</label>
            <input type="number" className="form-control form-control-sm" defaultValue="5" />
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete routing rule"
          message={`Delete "${deleteTarget.name}"? This affects how new payments are routed.`}
          confirmLabel="Delete"
          tone="danger"
          onConfirm={deleteRule}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </ToastProvider>
  );
}
