'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';

export default function CheckoutConfiguration() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appearance');

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

  const checkoutConfig = {
    businessName: 'Acme Solutions',
    businessLogo: '/logo.png',
    supportEmail: 'support@acme.com',
    supportPhone: '+263 123 456 789',
    theme: {
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
      backgroundColor: '#ffffff',
      textColor: '#1e293b',
    },
    paymentMethods: {
      enabled: ['EcoCash', 'InnBucks', 'Visa', 'Mastercard'],
      defaultMethod: 'EcoCash',
      allowMethodSelection: true,
    },
    checkoutFlow: {
      collectCustomerEmail: true,
      collectCustomerPhone: false,
      collectBillingAddress: false,
      requireCustomerName: true,
      allowGuestCheckout: true,
    },
    successSettings: {
      redirectUrl: 'https://acme.com/payment/success',
      redirectEnabled: true,
      sendConfirmationEmail: true,
    },
    failureSettings: {
      redirectUrl: 'https://acme.com/payment/failure',
      redirectEnabled: true,
      sendFailureNotification: true,
    },
  };

  return (
    <>
      <div className="mb-4">
        <h2 className="h4">Checkout Configuration</h2>
        <p className="text-muted">Customize the payment checkout experience for your customers</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Preview Card */}
          <div className="card mb-4 bg-light">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Checkout Preview</h6>
                  <p className="text-muted small mb-0">See how your checkout will appear to customers</p>
                </div>
                <button className="btn btn-primary">
                  <i className="bi bi-eye me-2"></i>
                  Preview Checkout
                </button>
              </div>
            </div>
          </div>

          {/* Configuration Tabs */}
          <ul className="nav nav-tabs mb-4" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'appearance' ? 'active' : ''}`}
                onClick={() => setActiveTab('appearance')}
              >
                Appearance
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'payment' ? 'active' : ''}`}
                onClick={() => setActiveTab('payment')}
              >
                Payment Methods
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'flow' ? 'active' : ''}`}
                onClick={() => setActiveTab('flow')}
              >
                Checkout Flow
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'redirects' ? 'active' : ''}`}
                onClick={() => setActiveTab('redirects')}
              >
                Redirects
              </button>
            </li>
          </ul>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="card">
                <div className="card-body">
                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Business Name *</label>
                        <input type="text" className="form-control" defaultValue={checkoutConfig.businessName} />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Business Logo</label>
                        <div className="d-flex gap-2 align-items-center">
                          <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                            <span className="text-muted small">Logo</span>
                          </div>
                          <button className="btn btn-outline-primary btn-sm">Upload Logo</button>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Support Email</label>
                        <input type="email" className="form-control" defaultValue={checkoutConfig.supportEmail} />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Support Phone</label>
                        <input type="tel" className="form-control" defaultValue={checkoutConfig.supportPhone} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <h6 className="mb-3">Theme Colors</h6>
                      <div className="mb-3">
                        <label className="form-label">Primary Color</label>
                        <div className="d-flex gap-2 align-items-center">
                          <input type="color" className="form-control form-control-color" defaultValue={checkoutConfig.theme.primaryColor} style={{ width: '60px' }} />
                          <input type="text" className="form-control" defaultValue={checkoutConfig.theme.primaryColor} />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Secondary Color</label>
                        <div className="d-flex gap-2 align-items-center">
                          <input type="color" className="form-control form-control-color" defaultValue={checkoutConfig.theme.secondaryColor} style={{ width: '60px' }} />
                          <input type="text" className="form-control" defaultValue={checkoutConfig.theme.secondaryColor} />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Background Color</label>
                        <div className="d-flex gap-2 align-items-center">
                          <input type="color" className="form-control form-control-color" defaultValue={checkoutConfig.theme.backgroundColor} style={{ width: '60px' }} />
                          <input type="text" className="form-control" defaultValue={checkoutConfig.theme.backgroundColor} />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Text Color</label>
                        <div className="d-flex gap-2 align-items-center">
                          <input type="color" className="form-control form-control-color" defaultValue={checkoutConfig.theme.textColor} style={{ width: '60px' }} />
                          <input type="text" className="form-control" defaultValue={checkoutConfig.theme.textColor} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <button className="btn btn-primary">Save Appearance Settings</button>
                </div>
              </div>
            )}

            {/* Payment Methods Tab */}
            {activeTab === 'payment' && (
              <div className="card">
                <div className="card-body">
                  <div className="mb-4">
                    <h6 className="mb-3">Available Payment Methods</h6>
                    <div className="list-group">
                      {['EcoCash', 'InnBucks', 'Omari', 'OneMoney', 'ZIPIT', 'Visa', 'Mastercard'].map((method) => (
                        <div key={method} className="list-group-item d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center gap-3">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`pm-${method}`}
                                defaultChecked={checkoutConfig.paymentMethods.enabled.includes(method)}
                              />
                              <label className="form-check-label" htmlFor={`pm-${method}`}>
                                {method}
                              </label>
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <select className="form-select form-select-sm" style={{ width: '120px' }}>
                              <option>Default</option>
                              <option>Optional</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <h6 className="mb-3">Payment Method Selection</h6>
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="methodSelection" defaultChecked={checkoutConfig.paymentMethods.allowMethodSelection} />
                      <label className="form-check-label" htmlFor="methodSelection">
                        Allow customers to choose payment method
                      </label>
                    </div>
                  </div>
                  <div>
                    <h6 className="mb-3">Default Payment Method</h6>
                    <select className="form-select">
                      {checkoutConfig.paymentMethods.enabled.map((method) => (
                        <option key={method} selected={method === checkoutConfig.paymentMethods.defaultMethod}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="card-footer">
                  <button className="btn btn-primary">Save Payment Methods</button>
                </div>
              </div>
            )}

            {/* Checkout Flow Tab */}
            {activeTab === 'flow' && (
              <div className="card">
                <div className="card-body">
                  <h6 className="mb-3">Customer Information Collection</h6>
                  <div className="list-group mb-4">
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1 small">Customer Name</h6>
                        <p className="text-muted small mb-0">Require customer to provide their name</p>
                      </div>
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" id="reqName" defaultChecked={checkoutConfig.checkoutFlow.requireCustomerName} />
                      </div>
                    </div>
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1 small">Customer Email</h6>
                        <p className="text-muted small mb-0">Require customer to provide their email</p>
                      </div>
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" id="reqEmail" defaultChecked={checkoutConfig.checkoutFlow.collectCustomerEmail} />
                      </div>
                    </div>
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1 small">Customer Phone</h6>
                        <p className="text-muted small mb-0">Require customer to provide their phone number</p>
                      </div>
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" id="reqPhone" defaultChecked={checkoutConfig.checkoutFlow.collectCustomerPhone} />
                      </div>
                    </div>
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1 small">Billing Address</h6>
                        <p className="text-muted small mb-0">Require customer to provide billing address</p>
                      </div>
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" id="reqAddress" defaultChecked={checkoutConfig.checkoutFlow.collectBillingAddress} />
                      </div>
                    </div>
                  </div>
                  <h6 className="mb-3">Checkout Options</h6>
                  <div className="list-group">
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1 small">Guest Checkout</h6>
                        <p className="text-muted small mb-0">Allow customers to pay without creating an account</p>
                      </div>
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" id="guestCheckout" defaultChecked={checkoutConfig.checkoutFlow.allowGuestCheckout} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <button className="btn btn-primary">Save Checkout Flow</button>
                </div>
              </div>
            )}

            {/* Redirects Tab */}
            {activeTab === 'redirects' && (
              <div className="card">
                <div className="card-body">
                  <h6 className="mb-3">Success Redirect</h6>
                  <div className="mb-4">
                    <div className="form-check form-switch mb-3">
                      <input className="form-check-input" type="checkbox" id="successRedirect" defaultChecked={checkoutConfig.successSettings.redirectEnabled} />
                      <label className="form-check-label" htmlFor="successRedirect">
                        Enable redirect on successful payment
                      </label>
                    </div>
                    <label className="form-label">Success URL</label>
                    <input type="url" className="form-control" defaultValue={checkoutConfig.successSettings.redirectUrl} placeholder="https://yourdomain.com/payment/success" />
                    <small className="text-muted">Customer will be redirected to this URL after successful payment</small>
                  </div>
                  <div className="mb-4">
                    <div className="form-check form-switch mb-3">
                      <input className="form-check-input" type="checkbox" id="successEmail" defaultChecked={checkoutConfig.successSettings.sendConfirmationEmail} />
                      <label className="form-check-label" htmlFor="successEmail">
                        Send confirmation email to customer
                      </label>
                    </div>
                  </div>
                  <hr className="my-4" />
                  <h6 className="mb-3">Failure Redirect</h6>
                  <div className="mb-4">
                    <div className="form-check form-switch mb-3">
                      <input className="form-check-input" type="checkbox" id="failRedirect" defaultChecked={checkoutConfig.failureSettings.redirectEnabled} />
                      <label className="form-check-label" htmlFor="failRedirect">
                        Enable redirect on failed payment
                      </label>
                    </div>
                    <label className="form-label">Failure URL</label>
                    <input type="url" className="form-control" defaultValue={checkoutConfig.failureSettings.redirectUrl} placeholder="https://yourdomain.com/payment/failure" />
                    <small className="text-muted">Customer will be redirected to this URL if payment fails</small>
                  </div>
                  <div className="mb-4">
                    <div className="form-check form-switch mb-3">
                      <input className="form-check-input" type="checkbox" id="failNotify" defaultChecked={checkoutConfig.failureSettings.sendFailureNotification} />
                      <label className="form-check-label" htmlFor="failNotify">
                        Send failure notification to customer
                      </label>
                    </div>
                  </div>
                  <div className="alert alert-info" role="alert">
                    <i className="bi bi-info-circle me-2"></i>
                    Webhooks will still be sent regardless of redirect settings
                  </div>
                </div>
                <div className="card-footer">
                  <button className="btn btn-primary">Save Redirect Settings</button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card mt-4">
            <div className="card-header">
              <h5 className="card-title mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <button className="btn btn-outline-primary w-100">
                    <i className="bi bi-eye me-2"></i>
                    Preview Checkout
                  </button>
                </div>
                <div className="col-md-4">
                  <button className="btn btn-outline-primary w-100">
                    <i className="bi bi-code-slash me-2"></i>
                    Get Integration Code
                  </button>
                </div>
                <div className="col-md-4">
                  <button className="btn btn-outline-primary w-100">
                    <i className="bi bi-arrow-counterclockwise me-2"></i>
                    Reset to Defaults
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
