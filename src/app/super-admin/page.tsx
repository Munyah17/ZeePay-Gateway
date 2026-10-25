'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Modal, ToastProvider, toast } from '@/components/ui';

const strategicAlerts = [
  { id: 'SA-1', alert: 'Omari provider experiencing intermittent delays', category: 'Infrastructure', severity: 'Medium', severityClass: 'bg-warning text-dark', date: '2 hours ago', status: 'Monitoring', statusClass: 'bg-secondary' },
  { id: 'SA-2', alert: 'Unusual transaction pattern detected - Merchant ID 45', category: 'Fraud', severity: 'High', severityClass: 'bg-danger', date: '5 hours ago', status: 'Investigating', statusClass: 'bg-primary' },
  { id: 'SA-3', alert: 'RBA quarterly report due in 30 days', category: 'Compliance', severity: 'Low', severityClass: 'bg-info text-dark', date: '1 day ago', status: 'Scheduled', statusClass: 'bg-success' },
];

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<typeof strategicAlerts[number] | null>(null);

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

  return (
    <ToastProvider>
      <div className="mb-4">
        <h2 className="h4">Executive Overview</h2>
        <p className="text-muted">High-level platform metrics and strategic insights</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="row g-4 mb-4">
            <div className="col-md-3">
              <div className="card border-primary">
                <div className="card-body">
                  <p className="text-muted small mb-1">Total Platform Volume</p>
                  <p className="h3 mb-0">$2.4M</p>
                  <p className="text-success small mt-2">↑ 18.5% vs last quarter</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Active Merchants</p>
                  <p className="h3 mb-0">156</p>
                  <p className="text-success small mt-2">↑ 24 this quarter</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Total Users</p>
                  <p className="h3 mb-0">12,450</p>
                  <p className="text-success small mt-2">↑ 890 this month</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Platform Health</p>
                  <p className="h3 mb-0">99.2%</p>
                  <p className="text-success small mt-2">Excellent uptime</p>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Revenue by Payment Method</h5>
                  <Link href="/super-admin/analytics" className="btn btn-sm btn-link">View details</Link>
                </div>
                <div className="card-body">
                  <div className="list-group list-group-flush">
                    {[
                      { name: 'EcoCash', amount: '$890,000', percentage: 37, color: 'bg-success' },
                      { name: 'Visa & Mastercard', amount: '$720,000', percentage: 30, color: 'bg-primary' },
                      { name: 'InnBucks', amount: '$480,000', percentage: 20, color: 'bg-info' },
                      { name: 'Omari', amount: '$240,000', percentage: 10, color: 'bg-warning' },
                      { name: 'Bank Transfer', amount: '$70,000', percentage: 3, color: 'bg-secondary' },
                    ].map((method) => (
                      <div key={method.name} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-medium">{method.name}</span>
                          <span className="text-muted">{method.amount}</span>
                        </div>
                        <div className="progress" style={{ height: '6px' }}>
                          <div className={`progress-bar ${method.color}`} style={{ width: `${method.percentage}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Regional Performance</h5>
                  <Link href="/super-admin/analytics" className="btn btn-sm btn-link">View details</Link>
                </div>
                <div className="card-body">
                  <div className="list-group list-group-flush">
                    {[
                      { region: 'Harare', volume: '$1.2M', transactions: '45,000', growth: '+22%' },
                      { region: 'Bulawayo', volume: '$580K', transactions: '21,000', growth: '+15%' },
                      { region: 'Mutare', volume: '$320K', transactions: '12,000', growth: '+18%' },
                      { region: 'Gweru', volume: '$180K', transactions: '6,500', growth: '+12%' },
                      { region: 'Other Regions', volume: '$100K', transactions: '3,500', growth: '+8%' },
                    ].map((region) => (
                      <div key={region.region} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1 small fw-medium">{region.region}</h6>
                          <small className="text-muted">{region.transactions} transactions</small>
                        </div>
                        <div className="text-end">
                          <p className="mb-0 small fw-medium">{region.volume}</p>
                          <small className="text-success">{region.growth}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Provider Status</h5>
                </div>
                <div className="card-body">
                  <div className="list-group list-group-flush">
                    {[
                      { name: 'EcoCash', status: 'Operational', uptime: '99.8%', color: 'bg-success' },
                      { name: 'InnBucks', status: 'Operational', uptime: '99.5%', color: 'bg-success' },
                      { name: 'Omari', status: 'Degraded', uptime: '97.2%', color: 'bg-warning' },
                      { name: 'Visa/Mastercard', status: 'Operational', uptime: '99.9%', color: 'bg-success' },
                    ].map((provider) => (
                      <div key={provider.name} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1 small fw-medium">{provider.name}</h6>
                          <small className="text-muted">{provider.uptime} uptime</small>
                        </div>
                        <span className={`badge ${provider.color}`}>{provider.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Team Performance</h5>
                </div>
                <div className="card-body">
                  <div className="list-group list-group-flush">
                    {[
                      { team: 'Engineering', tasks: 12, completed: 10 },
                      { team: 'Support', tickets: 45, resolved: 42 },
                      { team: 'Sales', leads: 28, converted: 15 },
                      { team: 'Compliance', audits: 3, passed: 3 },
                    ].map((team) => (
                      <div key={team.team} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-medium">{team.team}</span>
                          <span className="text-muted small">{team.completed || team.resolved || team.converted || team.passed}/{team.tasks || team.tickets || team.leads || team.audits}</span>
                        </div>
                        <div className="progress" style={{ height: '6px' }}>
                          <div className="progress-bar bg-primary" style={{ width: `${((team.completed || team.resolved || team.converted || team.passed || 0) / (team.tasks || team.tickets || team.leads || team.audits || 1)) * 100}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Compliance Status</h5>
                </div>
                <div className="card-body">
                  <div className="list-group list-group-flush">
                    {[
                      { item: 'PCI DSS', status: 'Compliant', expiry: 'Dec 2026' },
                      { item: 'RBZ License', status: 'Active', expiry: 'Mar 2027' },
                      { item: 'Data Protection', status: 'In Progress', expiry: '-' },
                      { item: 'AML/KYC', status: 'Compliant', expiry: 'Jun 2027' },
                    ].map((item) => (
                      <div key={item.item} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1 small fw-medium">{item.item}</h6>
                          <small className="text-muted">Expires: {item.expiry}</small>
                        </div>
                        <span className={`badge ${item.status === 'Compliant' || item.status === 'Active' ? 'bg-success' : 'bg-warning'}`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Recent Strategic Alerts</h5>
              <Link href="/super-admin/compliance" className="btn btn-sm btn-outline-primary">View all</Link>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Alert</th>
                      <th>Category</th>
                      <th>Severity</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {strategicAlerts.map((a) => (
                      <tr key={a.id} role="button" style={{ cursor: 'pointer' }} onClick={() => setViewing(a)}>
                        <td>{a.alert}</td>
                        <td>{a.category}</td>
                        <td><span className={`badge ${a.severityClass}`}>{a.severity}</span></td>
                        <td className="text-muted">{a.date}</td>
                        <td><span className={`badge ${a.statusClass}`}>{a.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {viewing && (
        <Modal title={`${viewing.id} — ${viewing.category}`} onClose={() => setViewing(null)}>
          <ul className="list-group list-group-flush">
            <li className="list-group-item px-0">
              <p className="small text-muted mb-1">Alert</p>
              <p className="small">{viewing.alert}</p>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Severity</span>
              <span className={`badge ${viewing.severityClass}`}>{viewing.severity}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Status</span>
              <span className={`badge ${viewing.statusClass}`}>{viewing.status}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="small text-muted">Raised</span>
              <span className="small">{viewing.date}</span>
            </li>
          </ul>
          <button
            className="btn btn-outline-primary btn-sm w-100 mt-3"
            onClick={() => { setViewing(null); toast(`${viewing.id} acknowledged`, 'info'); }}
          >
            Acknowledge
          </button>
        </Modal>
      )}
    </ToastProvider>
  );
}
