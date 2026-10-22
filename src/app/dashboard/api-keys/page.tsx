'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';

export default function ApiKeys() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  const apiKeys = [
    {
      id: 'pk_live_51Mz...',
      name: 'Production - Public Key',
      type: 'Public',
      environment: 'Production',
      status: 'Active',
      createdAt: '2023-01-15',
      lastUsed: '2024-01-15',
      permissions: ['Read'],
    },
    {
      id: 'sk_live_51Mz...',
      name: 'Production - Secret Key',
      type: 'Secret',
      environment: 'Production',
      status: 'Active',
      createdAt: '2023-01-15',
      lastUsed: '2024-01-15',
      permissions: ['Read', 'Write'],
    },
    {
      id: 'pk_test_51Mz...',
      name: 'Sandbox - Public Key',
      type: 'Public',
      environment: 'Sandbox',
      status: 'Active',
      createdAt: '2023-06-10',
      lastUsed: '2024-01-14',
      permissions: ['Read'],
    },
    {
      id: 'sk_test_51Mz...',
      name: 'Sandbox - Secret Key',
      type: 'Secret',
      environment: 'Sandbox',
      status: 'Active',
      createdAt: '2023-06-10',
      lastUsed: '2024-01-14',
      permissions: ['Read', 'Write'],
    },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Public': return 'bg-info text-dark';
      case 'Secret': return 'bg-warning text-dark';
      default: return 'bg-secondary';
    }
  };

  return (
    <>
      <div className="mb-4">
        <h2 className="h4">API Keys</h2>
        <p className="text-muted">Manage your API keys for integrating with ZeePay</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Security Alert */}
          <div className="alert alert-warning mb-4" role="alert">
            <div className="d-flex gap-3">
              <i className="bi bi-exclamation-triangle-fill fs-4"></i>
              <div>
                <strong>Important:</strong> Never share your secret keys. Keep them secure and never commit them to version control.
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex gap-2">
                  <select className="form-select form-select-sm" style={{ width: '150px' }}>
                    <option>All Environments</option>
                    <option>Production</option>
                    <option>Sandbox</option>
                  </select>
                  <select className="form-select form-select-sm" style={{ width: '150px' }}>
                    <option>All Types</option>
                    <option>Public</option>
                    <option>Secret</option>
                  </select>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                  <i className="bi bi-plus-circle me-2"></i>
                  Create API Key
                </button>
              </div>
            </div>
          </div>

          {/* API Keys Table */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Key ID</th>
                      <th>Type</th>
                      <th>Environment</th>
                      <th>Status</th>
                      <th>Last Used</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map((key) => (
                      <tr key={key.id}>
                        <td>
                          <h6 className="mb-0 small fw-medium">{key.name}</h6>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <code className="small font-monospace">{key.id}</code>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => copyToClipboard(key.id)}
                              title="Copy"
                            >
                              <i className={`bi ${copiedKey === key.id ? 'bi-check' : 'bi-clipboard'}`}></i>
                            </button>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getTypeColor(key.type)}`}>{key.type}</span>
                        </td>
                        <td>
                          <span className={`badge ${key.environment === 'Production' ? 'bg-success' : 'bg-info text-dark'}`}>
                            {key.environment}
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={key.status} type="default" size="sm" />
                        </td>
                        <td className="text-muted small">{new Date(key.lastUsed).toLocaleDateString()}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-primary" title="Reveal">
                              <i className="bi bi-eye"></i>
                            </button>
                            <button className="btn btn-outline-primary" title="Rotate">
                              <i className="bi bi-arrow-repeat"></i>
                            </button>
                            <button className="btn btn-outline-danger" title="Revoke">
                              <i className="bi bi-trash"></i>
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
                    <h5 className="modal-title">Create API Key</h5>
                    <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Key Name *</label>
                      <input type="text" className="form-control" placeholder="e.g., Production - App Integration" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Environment *</label>
                      <select className="form-select">
                        <option>Sandbox</option>
                        <option>Production</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Key Type *</label>
                      <select className="form-select">
                        <option>Secret Key (Full access)</option>
                        <option>Public Key (Read only)</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Permissions</label>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="perm1" defaultChecked />
                        <label className="form-check-label" htmlFor="perm1">Read payments</label>
                      </div>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="perm2" defaultChecked />
                        <label className="form-check-label" htmlFor="perm2">Create payments</label>
                      </div>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="perm3" />
                        <label className="form-check-label" htmlFor="perm3">Refund payments</label>
                      </div>
                    </div>
                    <div className="alert alert-info" role="alert">
                      <i className="bi bi-info-circle me-2"></i>
                      Make sure to copy your secret key immediately. You won't be able to see it again.
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(false)}>
                      Create Key
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Best Practices */}
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">API Key Best Practices</h5>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="d-flex gap-3">
                    <div className="text-success fs-4">
                      <i className="bi bi-shield-check"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">Keep Keys Secret</h6>
                      <p className="text-muted small mb-0">Never expose secret keys in client-side code or public repositories.</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex gap-3">
                    <div className="text-success fs-4">
                      <i className="bi bi-arrow-repeat"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">Rotate Regularly</h6>
                      <p className="text-muted small mb-0">Rotate your keys periodically for enhanced security.</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex gap-3">
                    <div className="text-success fs-4">
                      <i className="bi bi-layers"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">Use Environment-Specific Keys</h6>
                      <p className="text-muted small mb-0">Use separate keys for sandbox and production environments.</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex gap-3">
                    <div className="text-success fs-4">
                      <i className="bi bi-eye-slash"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">Limit Permissions</h6>
                      <p className="text-muted small mb-0">Grant only the minimum permissions needed for each key.</p>
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
