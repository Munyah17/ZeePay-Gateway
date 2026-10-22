'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';

export default function RolesAndPermissions() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

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

  const roles = [
    {
      id: 'role_001',
      name: 'Super Admin',
      description: 'Full platform access with all permissions',
      level: 'Platform',
      users: 3,
      status: 'Active',
      permissions: ['all'],
      createdAt: '2023-01-01',
      isSystem: true,
    },
    {
      id: 'role_002',
      name: 'Platform Admin',
      description: 'Platform-wide administrative access',
      level: 'Platform',
      users: 5,
      status: 'Active',
      permissions: ['platform.read', 'platform.write', 'platform.manage', 'users.manage', 'roles.manage'],
      createdAt: '2023-01-15',
      isSystem: true,
    },
    {
      id: 'role_003',
      name: 'Finance Manager',
      description: 'Financial operations and reconciliation access',
      level: 'Platform',
      users: 8,
      status: 'Active',
      permissions: ['finance.read', 'finance.write', 'finance.approve', 'settlements.manage'],
      createdAt: '2023-02-01',
      isSystem: false,
    },
    {
      id: 'role_004',
      name: 'Compliance Officer',
      description: 'Compliance and risk management access',
      level: 'Platform',
      users: 4,
      status: 'Active',
      permissions: ['compliance.read', 'compliance.write', 'risk.manage', 'audit.read'],
      createdAt: '2023-02-15',
      isSystem: false,
    },
    {
      id: 'role_005',
      name: 'Support Lead',
      description: 'Customer support and merchant assistance',
      level: 'Platform',
      users: 12,
      status: 'Active',
      permissions: ['support.read', 'support.write', 'merchants.read', 'transactions.read'],
      createdAt: '2023-03-01',
      isSystem: false,
    },
  ];

  const permissions = [
    { id: 'perm_001', name: 'platform.read', category: 'Platform', description: 'Read platform configuration' },
    { id: 'perm_002', name: 'platform.write', category: 'Platform', description: 'Modify platform configuration' },
    { id: 'perm_003', name: 'platform.manage', category: 'Platform', description: 'Full platform management' },
    { id: 'perm_004', name: 'users.read', category: 'Users', description: 'Read user information' },
    { id: 'perm_005', name: 'users.write', category: 'Users', description: 'Modify user information' },
    { id: 'perm_006', name: 'users.manage', category: 'Users', description: 'Full user management' },
    { id: 'perm_007', name: 'roles.read', category: 'Roles', description: 'Read role definitions' },
    { id: 'perm_008', name: 'roles.write', category: 'Roles', description: 'Modify role definitions' },
    { id: 'perm_009', name: 'roles.manage', category: 'Roles', description: 'Full role management' },
    { id: 'perm_010', name: 'merchants.read', category: 'Merchants', description: 'Read merchant information' },
    { id: 'perm_011', name: 'merchants.write', category: 'Merchants', description: 'Modify merchant information' },
    { id: 'perm_012', name: 'merchants.approve', category: 'Merchants', description: 'Approve merchant applications' },
    { id: 'perm_013', name: 'finance.read', category: 'Finance', description: 'Read financial data' },
    { id: 'perm_014', name: 'finance.write', category: 'Finance', description: 'Modify financial data' },
    { id: 'perm_015', name: 'finance.approve', category: 'Finance', description: 'Approve financial operations' },
    { id: 'perm_016', name: 'settlements.manage', category: 'Finance', description: 'Manage settlements' },
    { id: 'perm_017', name: 'compliance.read', category: 'Compliance', description: 'Read compliance data' },
    { id: 'perm_018', name: 'compliance.write', category: 'Compliance', description: 'Modify compliance data' },
    { id: 'perm_019', name: 'risk.manage', category: 'Compliance', description: 'Manage risk settings' },
    { id: 'perm_020', name: 'audit.read', category: 'Compliance', description: 'Read audit logs' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-success';
      case 'Inactive': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };

  return (
    <>
      <div className="mb-4">
        <h2 className="h4">Roles and Permissions</h2>
        <p className="text-muted">Manage platform-wide access control and permissions</p>
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
                  <p className="text-muted small mb-1">Total Roles</p>
                  <p className="h3 mb-0">{roles.length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Active Roles</p>
                  <p className="h3 mb-0 text-success">{roles.filter(r => r.status === 'Active').length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Total Permissions</p>
                  <p className="h3 mb-0 text-primary">{permissions.length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">System Roles</p>
                  <p className="h3 mb-0 text-warning">{roles.filter(r => r.isSystem).length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            {/* Roles Table */}
            <div className="col-lg-8">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Roles</h5>
                  <button className="btn btn-sm btn-primary" onClick={() => setShowCreateModal(true)}>
                    <i className="bi bi-plus-circle me-1"></i>
                    Create Role
                  </button>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Name</th>
                          <th>Level</th>
                          <th>Users</th>
                          <th>Status</th>
                          <th>System</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roles.map((role) => (
                          <tr key={role.id}>
                            <td>
                              <div>
                                <h6 className="mb-0 small fw-medium">{role.name}</h6>
                                <small className="text-muted">{role.description}</small>
                              </div>
                            </td>
                            <td>
                              <span className="badge bg-primary">{role.level}</span>
                            </td>
                            <td className="small">{role.users}</td>
                            <td>
                              <StatusBadge status={role.status} type="default" size="sm" />
                            </td>
                            <td>
                              {role.isSystem ? (
                                <span className="badge bg-warning text-dark">System</span>
                              ) : (
                                <span className="badge bg-light text-dark">Custom</span>
                              )}
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-outline-primary" onClick={() => setSelectedRole(role.id)}>
                                  <i className="bi bi-eye"></i>
                                </button>
                                {!role.isSystem && (
                                  <button className="btn btn-outline-primary">
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                )}
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
            </div>

            {/* Permissions List */}
            <div className="col-lg-4">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Permissions</h5>
                  <Link href="/super-admin/access/permissions" className="btn btn-sm btn-link">
                    Manage →
                  </Link>
                </div>
                <div className="card-body">
                  <div className="list-group list-group-flush">
                    {Object.entries(permissions.reduce((acc, perm) => {
                      if (!acc[perm.category]) acc[perm.category] = [];
                      acc[perm.category].push(perm);
                      return acc;
                    }, {} as Record<string, typeof permissions>)).map(([category, perms]) => (
                      <div key={category} className="list-group-item">
                        <h6 className="mb-2 small fw-medium">{category}</h6>
                        <div className="d-flex flex-wrap gap-1">
                          {perms.slice(0, 3).map((perm) => (
                            <span key={perm.id} className="badge bg-light text-dark small">{perm.name}</span>
                          ))}
                          {perms.length > 3 && (
                            <span className="badge bg-light text-dark small">+{perms.length - 3}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Role Details Panel */}
          {selectedRole && (
            <div className="card mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Role Details</h5>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedRole(null)}>
                  Close
                </button>
              </div>
              <div className="card-body">
                {(() => {
                  const role = roles.find(r => r.id === selectedRole);
                  if (!role) return null;
                  return (
                    <div className="row g-4">
                      <div className="col-md-6">
                        <h6 className="mb-3">Role Information</h6>
                        <div className="list-group">
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Name</span>
                            <strong>{role.name}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Description</span>
                            <strong>{role.description}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Level</span>
                            <strong>{role.level}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Users</span>
                            <strong>{role.users}</strong>
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Status</span>
                            <StatusBadge status={role.status} type="default" size="sm" />
                          </div>
                          <div className="list-group-item d-flex justify-content-between">
                            <span>Created</span>
                            <strong>{new Date(role.createdAt).toLocaleDateString()}</strong>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <h6 className="mb-3">Assigned Permissions</h6>
                        <div className="list-group">
                          {role.permissions.length === 1 && role.permissions[0] === 'all' ? (
                            <div className="list-group-item">
                              <span className="badge bg-success">All Permissions</span>
                            </div>
                          ) : (
                            role.permissions.map((perm) => (
                              <div key={perm} className="list-group-item">
                                <code className="small">{perm}</code>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Create Role Modal */}
          {showCreateModal && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-lg">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Create Custom Role</h5>
                    <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Role Name *</label>
                      <input type="text" className="form-control" placeholder="e.g., Support Agent" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea className="form-control" rows={2} placeholder="Describe the role's purpose"></textarea>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Access Level *</label>
                      <select className="form-select">
                        <option>Platform</option>
                        <option>Organization</option>
                        <option>Department</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Permissions</label>
                      <div className="border rounded p-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {Object.entries(permissions.reduce((acc, perm) => {
                          if (!acc[perm.category]) acc[perm.category] = [];
                          acc[perm.category].push(perm);
                          return acc;
                        }, {} as Record<string, typeof permissions>)).map(([category, perms]) => (
                          <div key={category}>
                            <h6 className="small fw-medium mt-2 mb-2">{category}</h6>
                            {perms.map((perm) => (
                              <div className="form-check" key={perm.id}>
                                <input className="form-check-input" type="checkbox" id={`perm-${perm.id}`} />
                                <label className="form-check-label small" htmlFor={`perm-${perm.id}`}>
                                  {perm.name} - {perm.description}
                                </label>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(false)}>
                      Create Role
                    </button>
                  </div>
                </div>
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
                  <Link href="/super-admin/access/permissions" className="btn btn-outline-primary w-100">
                    <i className="bi bi-key me-2"></i>
                    Manage Permissions
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link href="/super-admin/access/templates" className="btn btn-outline-primary w-100">
                    <i className="bi bi-file-earmark-text me-2"></i>
                    Permission Templates
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link href="/super-admin/access/reviews" className="btn btn-outline-primary w-100">
                    <i className="bi bi-check-circle me-2"></i>
                    Access Reviews
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link href="/super-admin/organisation/staff" className="btn btn-outline-primary w-100">
                    <i className="bi bi-people me-2"></i>
                    Assign Roles
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
