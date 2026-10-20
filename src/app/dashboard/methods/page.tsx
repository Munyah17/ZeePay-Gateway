'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PaymentMethod {
  name: string;
  category: string;
  status: string;
}

export default function MethodsPage() {
  const router = useRouter();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authed = localStorage.getItem('zeepay_authed');
      if (!authed) {
        router.push('/auth/login');
        return;
      }
    }

    fetchMethods();
  }, [router]);

  const fetchMethods = async () => {
    try {
      setMethods([
        { name: 'EcoCash', category: 'Mobile money', status: 'Active' },
        { name: 'InnBucks', category: 'Mobile money', status: 'Active' },
        { name: 'Omari', category: 'Mobile money', status: 'Active' },
        { name: 'Visa & Mastercard', category: 'Cards', status: 'Sandbox' },
        { name: 'American Express', category: 'Cards', status: 'Not configured' },
        { name: 'UnionPay', category: 'Cards', status: 'Not configured' },
        { name: 'M-Pesa', category: 'Mobile money', status: 'Roadmap' },
        { name: 'MTN MoMo', category: 'Mobile money', status: 'Roadmap' },
      ]);
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
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

  const toggleMethod = (name: string) => {
    setMethods(methods.map(m => 
      m.name === name 
        ? { ...m, status: m.status === 'Active' ? 'Inactive' : 'Active' }
        : m
    ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-success';
      case 'Sandbox':
        return 'bg-warning text-dark';
      case 'Inactive':
        return 'bg-secondary';
      case 'Not configured':
        return 'bg-dark';
      case 'Roadmap':
        return 'bg-info text-dark';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <>
      <div className="mb-4">
        <h2 className="h4">Payment methods</h2>
        <p className="text-muted">Manage the methods enabled for your ZeePay merchant account</p>
      </div>

      <div className="alert alert-warning mb-4" role="alert">
        <strong>Prototype mode.</strong> Toggles update this demo interface only. Live payment methods require provider approval, credentials, and successful integration testing.
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Your payment methods</h5>
                <span className="badge bg-primary">
                  {methods.filter(m => m.status === 'Active').length} enabled
                </span>
              </div>
              <div className="card-body">
                <div className="list-group list-group-flush">
                  {methods.map((method) => (
                    <div key={method.name} className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-light rounded d-flex align-items-center justify-content-center"
                             style={{ width: '40px', height: '40px' }}>
                          <span className="fw-bold text-muted small">{method.name.substring(0, 2).toUpperCase()}</span>
                        </div>
                        <div>
                          <h6 className="mb-0 small fw-medium">{method.name}</h6>
                          <small className="text-muted">
                            {['EcoCash', 'InnBucks', 'Omari', 'Visa & Mastercard'].includes(method.name)
                              ? 'Initial integration target'
                              : 'Planned integration · Not live'}
                          </small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <span className={`badge ${getStatusBadge(method.status)}`}>
                          {method.status}
                        </span>
                        {['EcoCash', 'InnBucks', 'Omari', 'Visa & Mastercard'].includes(method.name) && (
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={method.status === 'Active'}
                              onChange={() => toggleMethod(method.name)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Provider coverage</h5>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                  <div>
                    <h6 className="small fw-medium mb-0">Connected / sandbox</h6>
                    <small className="text-muted">Local mobile money and card sandbox</small>
                  </div>
                  <span className="fw-bold">3</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                  <div>
                    <h6 className="small fw-medium mb-0">Setup required</h6>
                    <small className="text-muted">Additional card network onboarding</small>
                  </div>
                  <span className="fw-bold">2</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="small fw-medium mb-0">Roadmap</h6>
                    <small className="text-muted">Subject to provider access and eligibility</small>
                  </div>
                  <span className="fw-bold">3</span>
                </div>
              </div>
              <div className="card-footer">
                <div className="alert alert-warning small mb-0" role="alert">
                  The interface never treats a roadmap item as an operational payment method. Provider capability and merchant eligibility must be verified before live activation.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
