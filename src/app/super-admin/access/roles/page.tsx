'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import { Modal, useToast, useConfirm } from '@/components/ui';

interface Role {
  id: string;
  name: string;
  description: string;
  level: string;
  users: number;
  status: string;
  permissions: string[];
  createdAt: string;
  isSystem: boolean;
}

export default function RolesAndPermissions() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [roleList, setRoleList] = useState<Role[]>([]);
  const [editing, setEditing] = useState<Role | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [createForm, setCreateForm] = useState({ name: '', description: '', level: 'Platform', perms: [] as string[] });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authed = localStorage.getItem('zeepay_authed');
      if (!authed) {
        router.push('/auth/login');
        return;
      }
    }
    setRoleList(seedRoles);
    setLoading(false);
  }, [router]);

  const togglePerm = (id: string) =>
    setCreateForm((f) => ({ ...f, perms: f.perms.includes(id) ? f.perms.filter((p) => p !== id) : [...f.perms, id] }));

  const createRole = () => {
    if (!createForm.name.trim()) {
      toast('Role name required', { tone: 'warning' });
      return;
    }
    const role: Role = {
      id: `role_${Math.random().toString(36).slice(2, 6)}`,
      name: createForm.name.trim(),
      description: createForm.description || 'Custom role',
      level: createForm.level,
      users: 0,
      status: 'Active',
      permissions: createForm.perms,
      createdAt: new Date().toISOString().slice(0, 10),
      isSystem: false,
    };
    setRoleList((prev) => [...prev, role]);
    setShowCreateModal(false);
    setCreateForm({ name: '', description: '', level: 'Platform', perms: [] });
    toast(`${role.name} created`);
  };

  const toggleRoleStatus = (role: Role) => {
    const next = role.status === 'Active' ? 'Inactive' : 'Active';
    setRoleList((prev) => prev.map((r) => (r.id === role.id ? { ...r, status: next } : r)));
    setMenuFor(null);
    toast(`${role.name} ${next.toLowerCase()}`, 'info');
  };

  const seedRoles: Role[] = [
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
                  <p className="h3 mb-0">{roleList.length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Active Roles</p>
                  <p className="h3 mb-0 text-success">{roleList.filter(r => r.status === 'Active').length}</p>
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
                  <p className="h3 mb-0 text-warning">{roleList.filter(r => r.isSystem).length}</p>
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
                        {roleList.map((role) => (
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
                                  <button className="btn btn-outline-primary" onClick={() => setEditing(role)}>
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                )}
                                <div className="position-relative">
                                  <button className="btn btn-outline-secondary" onClick={() => setMenuFor(menuFor === role.id ? null : role.id)}>
                                    <i className="bi bi-three-dots"></i>
                                  </button>
                                  {menuFor === role.id && (
                                    <ul className="dropdown-menu show" style={{ position: 'absolute', right: 0, zIndex: 1050 }}>
                                      {!role.isSystem && (
                                        <li>
                                          <button className="dropdown-item small" onClick={() => toggleRoleStatus(role)}>
                                            {role.status === 'Active' ? 'Deactivate' : 'Activate'}
                                          </button>
                                        </li>
                                      )}
                                      {!role.isSystem && (
                                        <li>
                                          <button className="dropdown-item small text-danger" onClick={() => { setDeleteTarget(role); setMenuFor(null); }}>
                                            Delete
                                          </button>
                                        </li>
                                      )}
                                      {role.isSystem && (
                                        <li><span className="dropdown-item-text small text-muted">System role</span></li>
                                      )}
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
                  const role = roleList.find(r => r.id === selectedRole);
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
                      <input type="text" className="form-control" placeholder="e.g., Support Agent" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea className="form-control" rows={2} placeholder="Describe the role's purpose" value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}></textarea>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Access Level *</label>
                      <select className="form-select" value={createForm.level} onChange={(e) => setCreateForm({ ...createForm, level: e.target.value })}>
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
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id={`perm-${perm.id}`}
                                  checked={createForm.perms.includes(perm.name)}
                                  onChange={() => togglePerm(perm.name)}
                                />
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
                    <button type="button" className="btn btn-primary" onClick={createRole}>
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

      {/* Edit role modal */}
      {editing && (
        <Modal open title={`Edit ${editing.name}`} onClose={() => setEditing(null)}>
          <div className="mb-3">
            <label className="form-label small">Status</label>
            <select
              className="form-select form-select-sm"
              value={editing.status}
              onChange={(e) => {
                const status = e.target.value;
                setRoleList((prev) => prev.map((r) => (r.id === editing.id ? { ...r, status } : r)));
                setEditing(null);
                toast(`${editing.name} → ${status}`, { tone: 'info' });
              }}
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
          <div>
            <label className="form-label small">Permissions</label>
            <div className="d-flex flex-wrap gap-1">
              {editing.permissions.map((p) => (
                <span key={p} className="badge bg-light text-dark">{p}</span>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <Modal open title={"Delete role"} onClose={() => setDeleteTarget(null)} size="sm" footer={<><button className="btn btn-light btn-sm" onClick={() => setDeleteTarget(null)}>Cancel</button><button className="btn btn-danger btn-sm" onClick={() => {
            setRoleList((prev) => prev.filter((r) => r.id !== deleteTarget.id));
            setDeleteTarget(null);
            toast('Role deleted', { tone: 'info' });
          }}>Delete</button></>}><p className="small mb-0">{`Delete role "${deleteTarget.name}"? Users assigned to this role will lose its permissions.`}</p></Modal>
      )}
    </>
  );
}
