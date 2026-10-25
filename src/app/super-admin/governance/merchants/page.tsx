'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import { ConfirmDialog, Modal, ToastProvider, toast } from '@/components/ui';
import { downloadCSV } from '@/utils/actions';

interface Merchant {
  id: string;
  businessName: string;
  businessType: string;
  registrationDate: string;
  status: string;
  tier: string;
  riskLevel: string;
  complianceScore: number;
  monthlyVolume: number;
  totalTransactions: number;
  lastAudit: string | null;
  nextReview: string;
  kycStatus: string;
  kycDate: string | null;
  contact: { name: string; email: string; phone: string };
}

export default function MerchantGovernance() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedMerchant, setSelectedMerchant] = useState<string | null>(null);
  const [merchantList, setMerchantList] = useState<Merchant[]>([]);
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [riskFilter, setRiskFilter] = useState('All Risk Levels');
  const [tierFilter, setTierFilter] = useState('All Tiers');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Merchant | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<Merchant | null>(null);
  const [auditing, setAuditing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authed = localStorage.getItem('zeepay_authed');
      if (!authed) {
        router.push('/auth/login');
        return;
      }
    }
    setMerchantList(seedMerchants);
    setLoading(false);
  }, [router]);

  const updateStatus = (m: Merchant, status: string, msg: string) => {
    setMerchantList((prev) => prev.map((x) => (x.id === m.id ? { ...x, status } : x)));
    setEditing(null);
    setSuspendTarget(null);
    setSelectedMerchant(null);
    setMenuFor(null);
    toast(msg, status === 'Suspended' ? 'warning' : 'success');
  };

  const filteredMerchants = merchantList.filter((m) => {
    if (statusFilter !== 'All Status' && m.status !== statusFilter) return false;
    if (riskFilter !== 'All Risk Levels' && m.riskLevel !== riskFilter) return false;
    if (tierFilter !== 'All Tiers' && m.tier !== tierFilter) return false;
    if (search && !m.businessName.toLowerCase().includes(search.toLowerCase()) && !m.contact.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const seedMerchants: Merchant[] = [
    {
      id: 'mch_001',
      businessName: 'Acme Corporation',
      businessType: 'E-commerce',
      registrationDate: '2023-01-15',
      status: 'Active',
      tier: 'Enterprise',
      riskLevel: 'Low',
      complianceScore: 95,
      monthlyVolume: 125000,
      totalTransactions: 15420,
      lastAudit: '2024-01-10',
      nextReview: '2024-04-10',
      kycStatus: 'Verified',
      kycDate: '2023-01-20',
      contact: {
        name: 'John Smith',
        email: 'john@acme.com',
        phone: '+263 71 234 5678',
      },
    },
    {
      id: 'mch_002',
      businessName: 'TechStart Solutions',
      businessType: 'SaaS',
      registrationDate: '2023-03-20',
      status: 'Under Review',
      tier: 'Growth',
      riskLevel: 'Medium',
      complianceScore: 78,
      monthlyVolume: 45000,
      totalTransactions: 5230,
      lastAudit: '2024-01-05',
      nextReview: '2024-04-05',
      kycStatus: 'Pending',
      kycDate: null,
      contact: {
        name: 'Sarah Johnson',
        email: 'sarah@techstart.io',
        phone: '+263 71 876 5432',
      },
    },
    {
      id: 'mch_003',
      businessName: 'Global Industries',
      businessType: 'Manufacturing',
      registrationDate: '2023-06-10',
      status: 'Active',
      tier: 'Enterprise',
      riskLevel: 'Low',
      complianceScore: 92,
      monthlyVolume: 280000,
      totalTransactions: 32150,
      lastAudit: '2024-01-12',
      nextReview: '2024-04-12',
      kycStatus: 'Verified',
      kycDate: '2023-06-15',
      contact: {
        name: 'Mike Davis',
        email: 'mike@global.com',
        phone: '+263 71 111 2222',
      },
    },
    {
      id: 'mch_004',
      businessName: 'Local Business Ltd',
      businessType: 'Retail',
      registrationDate: '2023-09-01',
      status: 'Suspended',
      tier: 'Starter',
      riskLevel: 'High',
      complianceScore: 45,
      monthlyVolume: 8500,
      totalTransactions: 890,
      lastAudit: '2023-12-20',
      nextReview: '2024-01-20',
      kycStatus: 'Failed',
      kycDate: '2023-09-05',
      contact: {
        name: 'Robert Wilson',
        email: 'robert@localbusiness.co.zw',
        phone: '+263 71 333 4444',
      },
    },
    {
      id: 'mch_005',
      businessName: 'Startup Ventures',
      businessType: 'Technology',
      registrationDate: '2024-01-10',
      status: 'Pending Approval',
      tier: 'Starter',
      riskLevel: 'Unknown',
      complianceScore: 0,
      monthlyVolume: 0,
      totalTransactions: 0,
      lastAudit: null,
      nextReview: '2024-04-10',
      kycStatus: 'In Progress',
      kycDate: null,
      contact: {
        name: 'Emily Brown',
        email: 'emily@startup.ventures',
        phone: '+263 71 555 6666',
      },
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-success';
      case 'Under Review': return 'bg-warning text-dark';
      case 'Suspended': return 'bg-danger';
      case 'Pending Approval': return 'bg-info text-dark';
      default: return 'bg-secondary';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-success';
      case 'Medium': return 'bg-warning text-dark';
      case 'High': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Enterprise': return 'bg-primary';
      case 'Growth': return 'bg-info text-dark';
      case 'Starter': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };

  return (
    <ToastProvider>
      <div className="mb-4">
        <h2 className="h4">Merchant Governance</h2>
        <p className="text-muted">Monitor merchant compliance, risk assessment, and approval workflows</p>
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
                  <p className="text-muted small mb-1">Total Merchants</p>
                  <p className="h3 mb-0">{merchantList.length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Active</p>
                  <p className="h3 mb-0 text-success">{merchantList.filter(m => m.status === 'Active').length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Pending Approval</p>
                  <p className="h3 mb-0 text-warning">{merchantList.filter(m => m.status === 'Pending Approval').length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">High Risk</p>
                  <p className="h3 mb-0 text-danger">{merchantList.filter(m => m.riskLevel === 'High').length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Approvals Alert */}
          {merchantList.filter(m => m.status === 'Pending Approval').length > 0 && (
            <div className="alert alert-info mb-4" role="alert">
              <div className="d-flex align-items-center gap-3">
                <i className="bi bi-info-circle-fill fs-4"></i>
                <div>
                  <strong>{merchantList.filter(m => m.status === 'Pending Approval').length} merchants</strong> awaiting approval
                </div>
                <Link href="/super-admin/approvals/merchants" className="btn btn-sm btn-outline-info ms-auto">
                  Review Queue
                </Link>
              </div>
            </div>
          )}

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
                    <option>All Status</option>
                    <option>Active</option>
                    <option>Pending Approval</option>
                    <option>Under Review</option>
                    <option>Suspended</option>
                  </select>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: '150px' }}
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                  >
                    <option>All Risk Levels</option>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: '150px' }}
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                  >
                    <option>All Tiers</option>
                    <option>Enterprise</option>
                    <option>Growth</option>
                    <option>Starter</option>
                  </select>
                </div>
                <input
                  type="text"
                  className="form-control form-select-sm"
                  placeholder="Search merchants..."
                  style={{ width: '250px' }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Merchants Table */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Business</th>
                      <th>Type</th>
                      <th>Tier</th>
                      <th>Status</th>
                      <th>Risk Level</th>
                      <th>Compliance Score</th>
                      <th>Monthly Volume</th>
                      <th>KYC Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMerchants.map((merchant) => (
                      <tr key={merchant.id}>
                        <td>
                          <div>
                            <h6 className="mb-0 small fw-medium">{merchant.businessName}</h6>
                            <small className="text-muted">Since {new Date(merchant.registrationDate).toLocaleDateString()}</small>
                          </div>
                        </td>
                        <td className="small">{merchant.businessType}</td>
                        <td>
                          <span className={`badge ${getTierColor(merchant.tier)}`}>{merchant.tier}</span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusColor(merchant.status)}`}>{merchant.status}</span>
                        </td>
                        <td>
                          <span className={`badge ${getRiskColor(merchant.riskLevel)}`}>{merchant.riskLevel}</span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="progress" style={{ width: '60px', height: '6px' }}>
                              <div
                                className="progress-bar"
                                style={{ width: `${merchant.complianceScore}%` }}
                              ></div>
                            </div>
                            <small className="text-muted">{merchant.complianceScore}%</small>
                          </div>
                        </td>
                        <td className="small">${merchant.monthlyVolume.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${merchant.kycStatus === 'Verified' ? 'bg-success' : merchant.kycStatus === 'Pending' ? 'bg-warning text-dark' : merchant.kycStatus === 'Failed' ? 'bg-danger' : 'bg-info text-dark'}`}>
                            {merchant.kycStatus}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-primary" onClick={() => setSelectedMerchant(merchant.id)}>
                              <i className="bi bi-eye"></i>
                            </button>
                            <button className="btn btn-outline-primary" onClick={() => setEditing(merchant)}>
                              <i className="bi bi-pencil"></i>
                            </button>
                            <div className="position-relative">
                              <button className="btn btn-outline-secondary" onClick={() => setMenuFor(menuFor === merchant.id ? null : merchant.id)}>
                                <i className="bi bi-three-dots"></i>
                              </button>
                              {menuFor === merchant.id && (
                                <ul className="dropdown-menu show" style={{ position: 'absolute', right: 0, zIndex: 1050 }}>
                                  {merchant.status === 'Active' && (
                                    <li>
                                      <button className="dropdown-item small" onClick={() => { setSuspendTarget(merchant); setMenuFor(null); }}>
                                        Suspend
                                      </button>
                                    </li>
                                  )}
                                  {merchant.status === 'Suspended' && (
                                    <li>
                                      <button
                                        className="dropdown-item small"
                                        onClick={() => updateStatus(merchant, 'Active', `${merchant.businessName} reactivated`)}
                                      >
                                        Reactivate
                                      </button>
                                    </li>
                                  )}
                                  <li>
                                    <button
                                      className="dropdown-item small"
                                      onClick={() => {
                                        downloadCSV(`merchant-${merchant.id}`, [merchant]);
                                        setMenuFor(null);
                                        toast('Merchant exported');
                                      }}
                                    >
                                      Export
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

          {/* Merchant Details Panel */}
          {selectedMerchant && (
            <div className="card mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Merchant Details</h5>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedMerchant(null)}>
                  Close
                </button>
              </div>
              <div className="card-body">
                {(() => {
                  const merchant = merchantList.find(m => m.id === selectedMerchant);
                  if (!merchant) return null;
                  return (
                    <div className="row g-4">
                      <div className="col-md-6">
                        <h6 className="mb-3">Business Information</h6>
                        <div className="list-group">
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Business Name</span>
                            <strong>{merchant.businessName}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Business Type</span>
                            <strong>{merchant.businessType}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Tier</span>
                            <span className={`badge ${getTierColor(merchant.tier)}`}>{merchant.tier}</span>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Status</span>
                            <span className={`badge ${getStatusColor(merchant.status)}`}>{merchant.status}</span>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Risk Level</span>
                            <span className={`badge ${getRiskColor(merchant.riskLevel)}`}>{merchant.riskLevel}</span>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Registration Date</span>
                            <strong>{new Date(merchant.registrationDate).toLocaleDateString()}</strong>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <h6 className="mb-3">Performance Metrics</h6>
                        <div className="list-group">
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Compliance Score</span>
                            <strong>{merchant.complianceScore}%</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Monthly Volume</span>
                            <strong>${merchant.monthlyVolume.toLocaleString()}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Total Transactions</span>
                            <strong>{merchant.totalTransactions.toLocaleString()}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Last Audit</span>
                            <strong>{merchant.lastAudit ? new Date(merchant.lastAudit).toLocaleDateString() : 'N/A'}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Next Review</span>
                            <strong>{new Date(merchant.nextReview).toLocaleDateString()}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>KYC Status</span>
                            <span className={`badge ${merchant.kycStatus === 'Verified' ? 'bg-success' : merchant.kycStatus === 'Pending' ? 'bg-warning text-dark' : merchant.kycStatus === 'Failed' ? 'bg-danger' : 'bg-info text-dark'}`}>
                              {merchant.kycStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <h6 className="mb-3">Contact Information</h6>
                        <div className="list-group">
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Contact Name</span>
                            <strong>{merchant.contact.name}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Email</span>
                            <strong>{merchant.contact.email}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Phone</span>
                            <strong>{merchant.contact.phone}</strong>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <h6 className="mb-3">Governance Actions</h6>
                        <div className="d-grid gap-2">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => { downloadCSV(`merchant-${merchant.id}`, [merchant]); toast('Full profile exported'); }}
                          >
                            <i className="bi bi-file-earmark-text me-2"></i>
                            View Full Profile
                          </button>
                          <button
                            className="btn btn-outline-primary"
                            disabled={auditing}
                            onClick={() => {
                              setAuditing(true);
                              setTimeout(() => {
                                setAuditing(false);
                                toast(`Compliance check complete — score ${merchant.complianceScore}%`, 'info');
                              }, 1200);
                            }}
                          >
                            <i className="bi bi-clipboard-check me-2"></i>
                            {auditing ? 'Running…' : 'Run Compliance Check'}
                          </button>
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => {
                              setMerchantList((prev) => prev.map((x) => (x.id === merchant.id ? { ...x, riskLevel: 'Medium', nextReview: '2024-04-15' } : x)));
                              toast('Risk assessment updated', 'info');
                            }}
                          >
                            <i className="bi bi-shield-check me-2"></i>
                            Update Risk Assessment
                          </button>
                          {merchant.status === 'Active' && (
                            <button className="btn btn-outline-warning" onClick={() => setSuspendTarget(merchant)}>
                              <i className="bi bi-pause-circle me-2"></i>
                              Suspend Merchant
                            </button>
                          )}
                          {merchant.status === 'Suspended' && (
                            <button
                              className="btn btn-outline-success"
                              onClick={() => updateStatus(merchant, 'Active', `${merchant.businessName} reactivated`)}
                            >
                              <i className="bi bi-play-circle me-2"></i>
                              Reactivate Merchant
                            </button>
                          )}
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
                  <Link href="/super-admin/approvals/merchants" className="btn btn-outline-primary w-100">
                    <i className="bi bi-check-circle me-2"></i>
                    Approval Queue
                  </Link>
                </div>
                <div className="col-md-3">
                  <button
                    className="btn btn-outline-primary w-100"
                    disabled={auditing}
                    onClick={() => {
                      setAuditing(true);
                      setTimeout(() => { setAuditing(false); toast('Compliance audit complete — all merchants checked', 'success'); }, 1500);
                    }}
                  >
                    <i className="bi bi-shield-check me-2"></i>
                    {auditing ? 'Running…' : 'Run Compliance Audit'}
                  </button>
                </div>
                <div className="col-md-3">
                  <button
                    className="btn btn-outline-primary w-100"
                    onClick={() => {
                      const high = merchantList.filter((m) => m.riskLevel === 'High').length;
                      toast(`${high} high-risk merchant(s) flagged`, high ? 'warning' : 'success');
                    }}
                  >
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Risk Assessment
                  </button>
                </div>
                <div className="col-md-3">
                  <button
                    className="btn btn-outline-primary w-100"
                    onClick={() => {
                      downloadCSV('merchant-governance', filteredMerchants.map((m) => ({
                        business: m.businessName, type: m.businessType, tier: m.tier, status: m.status,
                        risk: m.riskLevel, compliance: m.complianceScore, volume: m.monthlyVolume,
                      })));
                      toast('Governance report exported');
                    }}
                  >
                    <i className="bi bi-file-earmark-bar-graph me-2"></i>
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit status modal */}
      {editing && (
        <Modal title={`Edit ${editing.businessName}`} onClose={() => setEditing(null)}>
          <div className="mb-3">
            <label className="form-label small">Status</label>
            <select
              className="form-select form-select-sm"
              value={editing.status}
              onChange={(e) => updateStatus(editing, e.target.value, `${editing.businessName} → ${e.target.value}`)}
            >
              <option>Active</option>
              <option>Pending Approval</option>
              <option>Under Review</option>
              <option>Suspended</option>
            </select>
          </div>
          <div>
            <label className="form-label small">Tier</label>
            <select
              className="form-select form-select-sm"
              value={editing.tier}
              onChange={(e) => {
                const tier = e.target.value;
                setMerchantList((prev) => prev.map((x) => (x.id === editing.id ? { ...x, tier } : x)));
                setEditing(null);
                toast(`${editing.businessName} tier → ${tier}`, 'info');
              }}
            >
              <option>Enterprise</option>
              <option>Growth</option>
              <option>Starter</option>
            </select>
          </div>
        </Modal>
      )}

      {/* Suspend confirm */}
      {suspendTarget && (
        <ConfirmDialog
          title="Suspend merchant"
          message={`Suspend ${suspendTarget.businessName}? Their payment processing will be paused.`}
          confirmLabel="Suspend"
          tone="warning"
          onConfirm={() => updateStatus(suspendTarget, 'Suspended', `${suspendTarget.businessName} suspended`)}
          onCancel={() => setSuspendTarget(null)}
        />
      )}
    </ToastProvider>
  );
}
