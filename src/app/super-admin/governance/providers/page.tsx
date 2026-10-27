'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import { Modal, useToast, useConfirm } from '@/components/ui';
import { exportCSV } from '@/lib/export';

interface GovProvider {
  id: string;
  name: string;
  type: string;
  region: string;
  status: string;
  certificationStatus: string;
  onboardingDate: string;
  lastAudit: string;
  nextAudit: string;
  complianceScore: number;
  slaCompliance: number;
  uptime: number;
  monthlyVolume: number;
  feeStructure: string;
  settlementDays: number;
  contact: { name: string; email: string; phone: string };
  riskLevel: string;
  contractExpiry: string;
}

export default function ProviderGovernance() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [providerList, setProviderList] = useState<GovProvider[]>([]);
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [regionFilter, setRegionFilter] = useState('All Regions');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<GovProvider | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<GovProvider | null>(null);
  const [showOnboard, setShowOnboard] = useState(false);
  const [onboardForm, setOnboardForm] = useState({ name: '', type: 'Mobile Money', region: 'Zimbabwe' });
  const [auditing, setAuditing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authed = localStorage.getItem('zeepay_authed');
      if (!authed) {
        router.push('/auth/login');
        return;
      }
    }
    setProviderList(seedProviders);
    setLoading(false);
  }, [router]);

  const updateStatus = (p: GovProvider, status: string, msg: string) => {
    setProviderList((prev) => prev.map((x) => (x.id === p.id ? { ...x, status } : x)));
    setEditing(null);
    setSuspendTarget(null);
    setSelectedProvider(null);
    setMenuFor(null);
    toast(msg, status === 'Suspended' ? 'warning' : 'success');
  };

  const onboard = () => {
    if (!onboardForm.name.trim()) {
      toast('Provider name required', { tone: 'warning' });
      return;
    }
    const p: GovProvider = {
      id: `prov_${Math.random().toString(36).slice(2, 6)}`,
      name: onboardForm.name.trim(),
      type: onboardForm.type,
      region: onboardForm.region,
      status: 'Pending',
      certificationStatus: 'Pending',
      onboardingDate: new Date().toISOString().slice(0, 10),
      lastAudit: new Date().toISOString().slice(0, 10),
      nextAudit: '2024-07-01',
      complianceScore: 0,
      slaCompliance: 0,
      uptime: 0,
      monthlyVolume: 0,
      feeStructure: 'TBD',
      settlementDays: 3,
      contact: { name: '—', email: '—', phone: '—' },
      riskLevel: 'Unknown',
      contractExpiry: '2025-12-31',
    };
    setProviderList((prev) => [...prev, p]);
    setShowOnboard(false);
    setOnboardForm({ name: '', type: 'Mobile Money', region: 'Zimbabwe' });
    toast(`${p.name} added — onboarding pending`);
  };

  const filteredProviders = providerList.filter((p) => {
    if (statusFilter !== 'All Status' && p.status !== statusFilter) return false;
    if (regionFilter !== 'All Regions' && p.region !== regionFilter) return false;
    if (typeFilter !== 'All Types' && p.type !== typeFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const seedProviders: GovProvider[] = [
    {
      id: 'prov_001',
      name: 'EcoCash',
      type: 'Mobile Money',
      region: 'Zimbabwe',
      status: 'Active',
      certificationStatus: 'Certified',
      onboardingDate: '2023-01-15',
      lastAudit: '2024-01-10',
      nextAudit: '2024-04-10',
      complianceScore: 98,
      slaCompliance: 99.5,
      uptime: 99.8,
      monthlyVolume: 1250000,
      feeStructure: '1.5% per transaction',
      settlementDays: 2,
      contact: {
        name: 'Chenai Moyo',
        email: 'partnerships@ecocash.co.zw',
        phone: '+263 71 234 5678',
      },
      riskLevel: 'Low',
      contractExpiry: '2024-12-31',
    },
    {
      id: 'prov_002',
      name: 'InnBucks',
      type: 'Mobile Money',
      region: 'Zimbabwe',
      status: 'Active',
      certificationStatus: 'Certified',
      onboardingDate: '2023-03-20',
      lastAudit: '2024-01-08',
      nextAudit: '2024-04-08',
      complianceScore: 95,
      slaCompliance: 98.2,
      uptime: 99.5,
      monthlyVolume: 875000,
      feeStructure: '1.8% per transaction',
      settlementDays: 2,
      contact: {
        name: 'Tendai Chikomba',
        email: 'partnerships@innbucks.co.zw',
        phone: '+263 71 876 5432',
      },
      riskLevel: 'Low',
      contractExpiry: '2024-06-30',
    },
    {
      id: 'prov_003',
      name: 'Omari',
      type: 'Mobile Money',
      region: 'Zimbabwe',
      status: 'Degraded',
      certificationStatus: 'Under Review',
      onboardingDate: '2023-06-10',
      lastAudit: '2024-01-15',
      nextAudit: '2024-02-15',
      complianceScore: 72,
      slaCompliance: 85.0,
      uptime: 97.2,
      monthlyVolume: 520000,
      feeStructure: '2.0% per transaction',
      settlementDays: 3,
      contact: {
        name: 'Farai Zulu',
        email: 'partnerships@omari.co.zw',
        phone: '+263 71 111 2222',
      },
      riskLevel: 'Medium',
      contractExpiry: '2024-09-30',
    },
    {
      id: 'prov_004',
      name: 'Visa Direct',
      type: 'Card Processing',
      region: 'International',
      status: 'Active',
      certificationStatus: 'Certified',
      onboardingDate: '2024-01-10',
      lastAudit: '2024-01-10',
      nextAudit: '2024-07-10',
      complianceScore: 99,
      slaCompliance: 99.8,
      uptime: 99.9,
      monthlyVolume: 2500000,
      feeStructure: '1.2% + $0.30 per transaction',
      settlementDays: 1,
      contact: {
        name: 'Visa Partnership Team',
        email: 'partnerships@visa.com',
        phone: '+1 415 555 0123',
      },
      riskLevel: 'Low',
      contractExpiry: '2025-01-10',
    },
    {
      id: 'prov_005',
      name: 'Mastercard Direct',
      type: 'Card Processing',
      region: 'International',
      status: 'Active',
      certificationStatus: 'Certified',
      onboardingDate: '2024-01-10',
      lastAudit: '2024-01-10',
      nextAudit: '2024-07-10',
      complianceScore: 98,
      slaCompliance: 99.6,
      uptime: 99.8,
      monthlyVolume: 1800000,
      feeStructure: '1.3% + $0.30 per transaction',
      settlementDays: 1,
      contact: {
        name: 'Mastercard Partnership Team',
        email: 'partnerships@mastercard.com',
        phone: '+1 914 555 0456',
      },
      riskLevel: 'Low',
      contractExpiry: '2025-01-10',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-success';
      case 'Degraded': return 'bg-warning text-dark';
      case 'Suspended': return 'bg-danger';
      case 'Pending': return 'bg-info text-dark';
      default: return 'bg-secondary';
    }
  };

  const getCertColor = (status: string) => {
    switch (status) {
      case 'Certified': return 'bg-success';
      case 'Under Review': return 'bg-warning text-dark';
      case 'Expired': return 'bg-danger';
      case 'Pending': return 'bg-info text-dark';
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

  return (
    <>
    <div className="mb-4">
        <h2 className="h4">Provider Governance</h2>
        <p className="text-muted">Monitor provider performance, compliance, and contract management</p>
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
                  <p className="text-muted small mb-1">Total Providers</p>
                  <p className="h3 mb-0">{providerList.length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Active</p>
                  <p className="h3 mb-0 text-success">{providerList.filter(p => p.status === 'Active').length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Certified</p>
                  <p className="h3 mb-0 text-primary">{providerList.filter(p => p.certificationStatus === 'Certified').length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Avg Compliance</p>
                  <p className="h3 mb-0 text-info">
                    {providerList.length ? (providerList.reduce((sum, p) => sum + p.complianceScore, 0) / providerList.length).toFixed(0) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Degraded Provider Alert */}
          {providerList.filter(p => p.status === 'Degraded').length > 0 && (
            <div className="alert alert-warning mb-4" role="alert">
              <div className="d-flex align-items-center gap-3">
                <i className="bi bi-exclamation-triangle-fill fs-4"></i>
                <div>
                  <strong>{providerList.filter(p => p.status === 'Degraded')[0]?.name}</strong> is currently experiencing degraded performance
                </div>
                <Link href="/admin/providers/health" className="btn btn-sm btn-warning ms-auto">
                  View Details
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
                    <option>Degraded</option>
                    <option>Suspended</option>
                    <option>Pending</option>
                  </select>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: '150px' }}
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                  >
                    <option>All Regions</option>
                    <option>Zimbabwe</option>
                    <option>International</option>
                  </select>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: '150px' }}
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option>All Types</option>
                    <option>Mobile Money</option>
                    <option>Card Processing</option>
                    <option>Bank Transfer</option>
                  </select>
                </div>
                <input
                  type="text"
                  className="form-control form-select-sm"
                  placeholder="Search providers..."
                  style={{ width: '250px' }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Providers Table */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Provider</th>
                      <th>Type</th>
                      <th>Region</th>
                      <th>Status</th>
                      <th>Certification</th>
                      <th>Compliance</th>
                      <th>Uptime</th>
                      <th>Monthly Volume</th>
                      <th>Contract</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProviders.map((provider) => (
                      <tr key={provider.id}>
                        <td>
                          <div>
                            <h6 className="mb-0 small fw-medium">{provider.name}</h6>
                            <small className="text-muted">Since {new Date(provider.onboardingDate).toLocaleDateString()}</small>
                          </div>
                        </td>
                        <td className="small">{provider.type}</td>
                        <td className="small">{provider.region}</td>
                        <td>
                          <span className={`badge ${getStatusColor(provider.status)}`}>{provider.status}</span>
                        </td>
                        <td>
                          <span className={`badge ${getCertColor(provider.certificationStatus)}`}>
                            {provider.certificationStatus}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="progress" style={{ width: '50px', height: '6px' }}>
                              <div
                                className="progress-bar"
                                style={{ width: `${provider.complianceScore}%` }}
                              ></div>
                            </div>
                            <small className="text-muted">{provider.complianceScore}%</small>
                          </div>
                        </td>
                        <td className="small">{provider.uptime}%</td>
                        <td className="small">${(provider.monthlyVolume / 1000000).toFixed(1)}M</td>
                        <td className="small">
                          {new Date(provider.contractExpiry) < new Date('2024-02-01') ? (
                            <span className="text-danger fw-medium">Expires Soon</span>
                          ) : (
                            <span className="text-muted">{new Date(provider.contractExpiry).toLocaleDateString()}</span>
                          )}
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-primary" onClick={() => setSelectedProvider(provider.id)}>
                              <i className="bi bi-eye"></i>
                            </button>
                            <button className="btn btn-outline-primary" onClick={() => setEditing(provider)}>
                              <i className="bi bi-pencil"></i>
                            </button>
                            <div className="position-relative">
                              <button className="btn btn-outline-secondary" onClick={() => setMenuFor(menuFor === provider.id ? null : provider.id)}>
                                <i className="bi bi-three-dots"></i>
                              </button>
                              {menuFor === provider.id && (
                                <ul className="dropdown-menu show" style={{ position: 'absolute', right: 0, zIndex: 1050 }}>
                                  {provider.status === 'Active' && (
                                    <li>
                                      <button className="dropdown-item small" onClick={() => { setSuspendTarget(provider); setMenuFor(null); }}>
                                        Suspend
                                      </button>
                                    </li>
                                  )}
                                  {provider.status === 'Suspended' && (
                                    <li>
                                      <button
                                        className="dropdown-item small"
                                        onClick={() => updateStatus(provider, 'Active', `${provider.name} reactivated`)}
                                      >
                                        Reactivate
                                      </button>
                                    </li>
                                  )}
                                  <li>
                                    <button
                                      className="dropdown-item small"
                                      onClick={() => {
                                        exportCSV(`provider-${provider.id}`, [provider]);
                                        setMenuFor(null);
                                        toast('Provider exported');
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

          {/* Provider Details Panel */}
          {selectedProvider && (
            <div className="card mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Provider Details</h5>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedProvider(null)}>
                  Close
                </button>
              </div>
              <div className="card-body">
                {(() => {
                  const provider = providerList.find(p => p.id === selectedProvider);
                  if (!provider) return null;
                  return (
                    <div className="row g-4">
                      <div className="col-md-6">
                        <h6 className="mb-3">Provider Information</h6>
                        <div className="list-group">
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Provider Name</span>
                            <strong>{provider.name}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Type</span>
                            <strong>{provider.type}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Region</span>
                            <strong>{provider.region}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Status</span>
                            <span className={`badge ${getStatusColor(provider.status)}`}>{provider.status}</span>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Certification</span>
                            <span className={`badge ${getCertColor(provider.certificationStatus)}`}>
                              {provider.certificationStatus}
                            </span>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Risk Level</span>
                            <span className={`badge ${getRiskColor(provider.riskLevel)}`}>{provider.riskLevel}</span>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <h6 className="mb-3">Performance Metrics</h6>
                        <div className="list-group">
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Compliance Score</span>
                            <strong>{provider.complianceScore}%</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>SLA Compliance</span>
                            <strong>{provider.slaCompliance}%</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Uptime</span>
                            <strong>{provider.uptime}%</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Monthly Volume</span>
                            <strong>${provider.monthlyVolume.toLocaleString()}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Fee Structure</span>
                            <strong>{provider.feeStructure}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Settlement Days</span>
                            <strong>{provider.settlementDays} days</strong>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <h6 className="mb-3">Contract Information</h6>
                        <div className="list-group">
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Onboarding Date</span>
                            <strong>{new Date(provider.onboardingDate).toLocaleDateString()}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Last Audit</span>
                            <strong>{new Date(provider.lastAudit).toLocaleDateString()}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Next Audit</span>
                            <strong>{new Date(provider.nextAudit).toLocaleDateString()}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Contract Expiry</span>
                            <strong>{new Date(provider.contractExpiry).toLocaleDateString()}</strong>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <h6 className="mb-3">Contact Information</h6>
                        <div className="list-group">
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Contact Name</span>
                            <strong>{provider.contact.name}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Email</span>
                            <strong>{provider.contact.email}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Phone</span>
                            <strong>{provider.contact.phone}</strong>
                          </div>
                        </div>
                      </div>
                      <div className="col-12">
                        <h6 className="mb-3">Governance Actions</h6>
                        <div className="d-flex gap-2 flex-wrap">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => { exportCSV(`contract-${provider.id}`, [{ provider: provider.name, contractExpiry: provider.contractExpiry, fees: provider.feeStructure, settlementDays: provider.settlementDays }]); toast('Contract exported'); }}
                          >
                            <i className="bi bi-file-earmark-text me-2"></i>
                            View Contract
                          </button>
                          <button
                            className="btn btn-outline-primary"
                            disabled={auditing}
                            onClick={() => {
                              setAuditing(true);
                              setTimeout(() => { setAuditing(false); toast(`Compliance audit complete — ${provider.complianceScore}%`, { tone: 'info' }); }, 1200);
                            }}
                          >
                            <i className="bi bi-clipboard-check me-2"></i>
                            {auditing ? 'Running…' : 'Run Compliance Audit'}
                          </button>
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => {
                              setProviderList((prev) => prev.map((x) => (x.id === provider.id ? { ...x, riskLevel: 'Medium' } : x)));
                              toast('Risk assessment updated', { tone: 'info' });
                            }}
                          >
                            <i className="bi bi-shield-check me-2"></i>
                            Update Risk Assessment
                          </button>
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => {
                              exportCSV(`performance-${provider.id}`, [{ uptime: provider.uptime, sla: provider.slaCompliance, volume: provider.monthlyVolume }]);
                              toast('Performance report exported');
                            }}
                          >
                            <i className="bi bi-file-earmark-bar-graph me-2"></i>
                            Performance Report
                          </button>
                          {provider.status === 'Active' && (
                            <button className="btn btn-outline-warning" onClick={() => setSuspendTarget(provider)}>
                              <i className="bi bi-pause-circle me-2"></i>
                              Suspend Provider
                            </button>
                          )}
                          {provider.status === 'Suspended' && (
                            <button
                              className="btn btn-outline-success"
                              onClick={() => updateStatus(provider, 'Active', `${provider.name} reactivated`)}
                            >
                              <i className="bi bi-play-circle me-2"></i>
                              Reactivate Provider
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
                  <button className="btn btn-outline-primary w-100" onClick={() => setShowOnboard(true)}>
                    <i className="bi bi-plus-circle me-2"></i>
                    Onboard New Provider
                  </button>
                </div>
                <div className="col-md-3">
                  <button
                    className="btn btn-outline-primary w-100"
                    disabled={auditing}
                    onClick={() => {
                      setAuditing(true);
                      setTimeout(() => { setAuditing(false); toast('Compliance audit complete for all providers'); }, 1500);
                    }}
                  >
                    <i className="bi bi-clipboard-check me-2"></i>
                    {auditing ? 'Running…' : 'Run Compliance Audit'}
                  </button>
                </div>
                <div className="col-md-3">
                  <button
                    className="btn btn-outline-primary w-100"
                    onClick={() => {
                      exportCSV('provider-performance', filteredProviders.map((p) => ({
                        name: p.name, status: p.status, certification: p.certificationStatus,
                        compliance: p.complianceScore, uptime: p.uptime, volume: p.monthlyVolume,
                      })));
                      toast('Performance report exported');
                    }}
                  >
                    <i className="bi bi-file-earmark-bar-graph me-2"></i>
                    Generate Performance Report
                  </button>
                </div>
                <div className="col-md-3">
                  <Link href="/admin/providers/health" className="btn btn-outline-primary w-100">
                    <i className="bi bi-activity me-2"></i>
                    Provider Health
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit status modal */}
      {editing && (
        <Modal open title={`Edit ${editing.name}`} onClose={() => setEditing(null)}>
          <div className="mb-3">
            <label className="form-label small">Status</label>
            <select
              className="form-select form-select-sm"
              value={editing.status}
              onChange={(e) => updateStatus(editing, e.target.value, `${editing.name} → ${e.target.value}`)}
            >
              <option>Active</option>
              <option>Degraded</option>
              <option>Suspended</option>
              <option>Pending</option>
            </select>
          </div>
          <div>
            <label className="form-label small">Certification</label>
            <select
              className="form-select form-select-sm"
              value={editing.certificationStatus}
              onChange={(e) => {
                const certificationStatus = e.target.value;
                setProviderList((prev) => prev.map((x) => (x.id === editing.id ? { ...x, certificationStatus } : x)));
                setEditing(null);
                toast(`${editing.name} certification → ${certificationStatus}`, { tone: 'info' });
              }}
            >
              <option>Certified</option>
              <option>Under Review</option>
              <option>Expired</option>
              <option>Pending</option>
            </select>
          </div>
        </Modal>
      )}

      {/* Onboard provider modal */}
      {showOnboard && (
        <Modal open 
          title="Onboard New Provider"
          onClose={() => setShowOnboard(false)}
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowOnboard(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={onboard}>Onboard</button>
            </>
          }
        >
          <div className="mb-3">
            <label className="form-label small">Provider name *</label>
            <input
              className="form-control form-control-sm"
              placeholder="e.g., ZimSwitch"
              value={onboardForm.name}
              onChange={(e) => setOnboardForm({ ...onboardForm, name: e.target.value })}
            />
          </div>
          <div className="row g-2">
            <div className="col-6">
              <label className="form-label small">Type</label>
              <select className="form-select form-select-sm" value={onboardForm.type} onChange={(e) => setOnboardForm({ ...onboardForm, type: e.target.value })}>
                <option>Mobile Money</option>
                <option>Card Processing</option>
                <option>Bank Transfer</option>
              </select>
            </div>
            <div className="col-6">
              <label className="form-label small">Region</label>
              <select className="form-select form-select-sm" value={onboardForm.region} onChange={(e) => setOnboardForm({ ...onboardForm, region: e.target.value })}>
                <option>Zimbabwe</option>
                <option>International</option>
              </select>
            </div>
          </div>
        </Modal>
      )}

      {/* Suspend confirm */}
      {suspendTarget && (
        <Modal open title={"Suspend provider"} onClose={() => setSuspendTarget(null)} size="sm" footer={<><button className="btn btn-light btn-sm" onClick={() => setSuspendTarget(null)}>Cancel</button><button className="btn btn-warning btn-sm" onClick={() => updateStatus(suspendTarget, 'Suspended', `${suspendTarget.name} suspended`)}>Suspend</button></>}><p className="small mb-0">{`Suspend ${suspendTarget.name}? Routing rules that prefer this provider will fall back to alternates.`}</p></Modal>
      )}
    </>
  );
}
