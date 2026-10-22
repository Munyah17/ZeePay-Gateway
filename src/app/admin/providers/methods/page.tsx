'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';

export default function PaymentMethodsCatalogue() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('all');

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

  const paymentMethods = [
    // Zimbabwe
    {
      id: 'pm_ecocash',
      name: 'EcoCash',
      category: 'Mobile Money',
      region: 'Zimbabwe',
      currencies: ['ZWL', 'USD'],
      status: 'Live',
      providers: ['EcoCash Direct'],
      capabilities: ['Payments', 'Refunds'],
      icon: '📱',
    },
    {
      id: 'pm_innbucks',
      name: 'InnBucks',
      category: 'Mobile Money',
      region: 'Zimbabwe',
      currencies: ['ZWL', 'USD'],
      status: 'Live',
      providers: ['InnBucks Direct'],
      capabilities: ['Payments', 'Refunds'],
      icon: '💰',
    },
    {
      id: 'pm_omari',
      name: 'Omari',
      category: 'Mobile Money',
      region: 'Zimbabwe',
      currencies: ['ZWL', 'USD'],
      status: 'Degraded',
      providers: ['Omari Direct'],
      capabilities: ['Payments', 'Refunds'],
      icon: '💳',
    },
    {
      id: 'pm_onemoney',
      name: 'OneMoney',
      category: 'Mobile Money',
      region: 'Zimbabwe',
      currencies: ['ZWL', 'USD'],
      status: 'Sandbox',
      providers: ['OneMoney Direct'],
      capabilities: ['Payments'],
      icon: '📱',
    },
    {
      id: 'pm_zipit',
      name: 'ZIPIT',
      category: 'Bank Transfer',
      region: 'Zimbabwe',
      currencies: ['ZWL', 'USD'],
      status: 'Live',
      providers: ['ZIPIT Network'],
      capabilities: ['Payments'],
      icon: '🏦',
    },
    // International Cards
    {
      id: 'pm_visa',
      name: 'Visa',
      category: 'Card',
      region: 'International',
      currencies: ['USD', 'EUR', 'GBP'],
      status: 'Sandbox',
      providers: ['Visa Direct', 'Stripe'],
      capabilities: ['Payments', 'Refunds', 'Recurring'],
      icon: '💳',
    },
    {
      id: 'pm_mastercard',
      name: 'Mastercard',
      category: 'Card',
      region: 'International',
      currencies: ['USD', 'EUR', 'GBP'],
      status: 'Sandbox',
      providers: ['Mastercard Direct', 'Stripe'],
      capabilities: ['Payments', 'Refunds', 'Recurring'],
      icon: '💳',
    },
    {
      id: 'pm_amex',
      name: 'American Express',
      category: 'Card',
      region: 'International',
      currencies: ['USD'],
      status: 'Planned',
      providers: [],
      capabilities: ['Payments', 'Refunds'],
      icon: '💳',
    },
    // Regional - Southern Africa
    {
      id: 'pm_mpesa_za',
      name: 'M-Pesa South Africa',
      category: 'Mobile Money',
      region: 'Southern Africa',
      currencies: ['ZAR'],
      status: 'Planned',
      providers: [],
      capabilities: ['Payments', 'Refunds'],
      icon: '📱',
    },
    {
      id: 'pm_ewallet',
      name: 'South African eWallet',
      category: 'Wallet',
      region: 'Southern Africa',
      currencies: ['ZAR'],
      status: 'Planned',
      providers: [],
      capabilities: ['Payments'],
      icon: '💼',
    },
    // Regional - East Africa
    {
      id: 'pm_mpesa_ke',
      name: 'M-Pesa Kenya',
      category: 'Mobile Money',
      region: 'East Africa',
      currencies: ['KES'],
      status: 'Planned',
      providers: [],
      capabilities: ['Payments', 'Refunds'],
      icon: '📱',
    },
    {
      id: 'pm_mtn_momo',
      name: 'MTN MoMo',
      category: 'Mobile Money',
      region: 'East Africa',
      currencies: ['UGX', 'RWF'],
      status: 'Planned',
      providers: [],
      capabilities: ['Payments', 'Refunds'],
      icon: '📱',
    },
    // Regional - West Africa
    {
      id: 'pm_mtn_momo_gh',
      name: 'MTN MoMo Ghana',
      category: 'Mobile Money',
      region: 'West Africa',
      currencies: ['GHS'],
      status: 'Planned',
      providers: [],
      capabilities: ['Payments', 'Refunds'],
      icon: '📱',
    },
    {
      id: 'pm_airtel_money',
      name: 'Airtel Money',
      category: 'Mobile Money',
      region: 'West Africa',
      currencies: ['NGN', 'GHS'],
      status: 'Planned',
      providers: [],
      capabilities: ['Payments', 'Refunds'],
      icon: '📱',
    },
    {
      id: 'pm_opay',
      name: 'OPay',
      category: 'Mobile Money',
      region: 'West Africa',
      currencies: ['NGN'],
      status: 'Planned',
      providers: [],
      capabilities: ['Payments', 'Refunds'],
      icon: '💰',
    },
    {
      id: 'pm_palmpay',
      name: 'PalmPay',
      category: 'Mobile Money',
      region: 'West Africa',
      currencies: ['NGN'],
      status: 'Planned',
      providers: [],
      capabilities: ['Payments', 'Refunds'],
      icon: '💰',
    },
  ];

  const regions = ['all', 'Zimbabwe', 'International', 'Southern Africa', 'East Africa', 'West Africa', 'North Africa'];
  const statuses = ['all', 'Live', 'Sandbox', 'Degraded', 'Planned', 'Suspended'];

  const filteredMethods = paymentMethods.filter((method) => {
    if (selectedRegion !== 'all' && method.region !== selectedRegion) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Live': return 'bg-success';
      case 'Sandbox': return 'bg-info text-dark';
      case 'Degraded': return 'bg-warning text-dark';
      case 'Planned': return 'bg-secondary';
      case 'Suspended': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  return (
    <>
      <div className="mb-4">
        <h2 className="h4">Payment Methods Catalogue</h2>
        <p className="text-muted">Manage payment methods independently of provider integrations</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label small">Region</label>
                  <select
                    className="form-select form-select-sm"
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                  >
                    {regions.map((region) => (
                      <option key={region} value={region}>
                        {region === 'all' ? 'All Regions' : region}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label small">Status</label>
                  <select className="form-select form-select-sm">
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status === 'all' ? 'All Statuses' : status}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label small">Category</label>
                  <select className="form-select form-select-sm">
                    <option value="">All Categories</option>
                    <option value="mobile">Mobile Money</option>
                    <option value="card">Card</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="wallet">Wallet</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Total Methods</p>
                  <p className="h3 mb-0">{paymentMethods.length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Live</p>
                  <p className="h3 mb-0 text-success">{paymentMethods.filter(m => m.status === 'Live').length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Sandbox</p>
                  <p className="h3 mb-0 text-info">{paymentMethods.filter(m => m.status === 'Sandbox').length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <p className="text-muted small mb-1">Planned</p>
                  <p className="h3 mb-0 text-secondary">{paymentMethods.filter(m => m.status === 'Planned').length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods Grid */}
          <div className="row g-4">
            {filteredMethods.map((method) => (
              <div className="col-md-6 col-lg-4" key={method.id}>
                <div className="card h-100">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <span className="fs-4">{method.icon}</span>
                      <h6 className="mb-0">{method.name}</h6>
                    </div>
                    <span className={`badge ${getStatusColor(method.status)}`}>{method.status}</span>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <p className="text-muted small mb-1">Category</p>
                      <p className="small">{method.category}</p>
                    </div>
                    <div className="mb-3">
                      <p className="text-muted small mb-1">Region</p>
                      <p className="small">{method.region}</p>
                    </div>
                    <div className="mb-3">
                      <p className="text-muted small mb-1">Currencies</p>
                      <div className="d-flex flex-wrap gap-1">
                        {method.currencies.map((currency) => (
                          <span key={currency} className="badge bg-light text-dark">{currency}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-muted small mb-1">Connected Providers</p>
                      {method.providers.length > 0 ? (
                        <div className="d-flex flex-wrap gap-1">
                          {method.providers.map((provider) => (
                            <span key={provider} className="badge bg-primary">{provider}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted small">No providers connected</span>
                      )}
                    </div>
                    <div>
                      <p className="text-muted small mb-1">Capabilities</p>
                      <div className="d-flex flex-wrap gap-1">
                        {method.capabilities.map((capability) => (
                          <span key={capability} className="badge bg-success">{capability}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="card-footer">
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-outline-primary flex-grow-1">
                        Configure
                      </button>
                      <button className="btn btn-sm btn-outline-secondary">
                        <i className="bi bi-three-dots"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Method Button */}
          <div className="mt-4">
            <button className="btn btn-primary">
              <i className="bi bi-plus-circle me-2"></i>
              Add Payment Method
            </button>
          </div>
        </>
      )}
    </>
  );
}
