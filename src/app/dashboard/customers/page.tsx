'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Customer {
  name: string;
  email: string;
  payments: number;
  totalPaid: number;
  lastActivity: string;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authed = localStorage.getItem('zeepay_authed');
      if (!authed) {
        router.push('/auth/login');
        return;
      }
    }

    fetchCustomers();
  }, [router]);

  const fetchCustomers = async () => {
    try {
      setCustomers([
        { name: 'Sarah Moyo', email: 'sarah@example.com', payments: 6, totalPaid: 95, lastActivity: '2 min ago' },
        { name: 'Tawanda Ncube', email: 'tawanda@example.com', payments: 4, totalPaid: 180, lastActivity: '1 day ago' },
        { name: 'Rudo Dube', email: 'rudo@example.com', payments: 3, totalPaid: 42, lastActivity: '2 days ago' },
        { name: 'Brian Moyo', email: 'brian@example.com', payments: 2, totalPaid: 65, lastActivity: '3 days ago' },
        { name: 'Tariro Ndlovu', email: 'tariro@example.com', payments: 2, totalPaid: 20, lastActivity: '4 days ago' },
      ]);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('zeepay_authed');
      localStorage.removeItem('zeepay_user');
    }
    router.push('/');
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-0">Customers</h2>
          <p className="text-muted small mb-0">Customers associated with your payment activity</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary btn-sm"
          data-bs-toggle="modal"
          data-bs-target="#addCustomerModal"
        >
          <i className="bi bi-plus-lg me-1"></i> Add customer
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Payments</th>
                    <th>Total paid</th>
                    <th>Last activity</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer, index) => (
                    <tr key={index}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                               style={{ width: '32px', height: '32px' }}>
                            {customer.name.charAt(0)}
                          </div>
                          <span className="fw-medium">{customer.name}</span>
                        </div>
                      </td>
                      <td className="text-muted">{customer.email}</td>
                      <td>{customer.payments}</td>
                      <td>${customer.totalPaid.toFixed(2)}</td>
                      <td className="text-muted small">{customer.lastActivity}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card-footer">
            <nav aria-label="Page navigation">
              <ul className="pagination pagination-sm justify-content-end mb-0">
                <li className="page-item disabled">
                  <a className="page-link" href="#">Previous</a>
                </li>
                <li className="page-item active">
                  <a className="page-link" href="#">1</a>
                </li>
                <li className="page-item">
                  <a className="page-link" href="#">Next</a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add customer</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label className="form-label small">Full name</label>
                    <input
                      type="text"
                      required
                      className="form-control form-control-sm"
                      placeholder="Customer name"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">Email address</label>
                    <input
                      type="email"
                      required
                      className="form-control form-control-sm"
                      placeholder="customer@example.com"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">Phone (optional)</label>
                    <input
                      type="tel"
                      className="form-control form-control-sm"
                      placeholder="+263..."
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Add customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
