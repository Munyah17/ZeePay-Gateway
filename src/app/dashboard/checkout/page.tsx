'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import { Modal, useToast, useConfirm, usePersistentState } from '@/components/ui';
import { copyToClipboard as copyText } from '@/lib/export';

const defaultConfig = {
  businessName: 'Acme Solutions',
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

export default function CheckoutConfiguration() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appearance');
  const [config, persist] = usePersistentState('checkout_config', defaultConfig);
  const [showPreview, setShowPreview] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const saveSection = (name: string) => {
    persist(config); // usePersistentState already writes on every change
    toast(`${name} settings saved`);
  };

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

  const checkoutConfig = config;
  const ALL_METHODS = ['EcoCash', 'InnBucks', 'Omari', 'OneMoney', 'ZIPIT', 'Visa', 'Mastercard'];

  const toggleMethod = (method: string) => {
    const enabled = checkoutConfig.paymentMethods.enabled.includes(method)
      ? checkoutConfig.paymentMethods.enabled.filter((m) => m !== method)
      : [...checkoutConfig.paymentMethods.enabled, method];
    persist({ ...config, paymentMethods: { ...config.paymentMethods, enabled } });
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
                <button className="btn btn-primary" onClick={() => setShowPreview(true)}>
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
                        <input
                          type="text"
                          className="form-control"
                          value={checkoutConfig.businessName}
                          onChange={(e) => persist({ ...config, businessName: e.target.value })}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Business Logo</label>
                        <div className="d-flex gap-2 align-items-center">
                          <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                            <span className="text-muted small">Logo</span>
                          </div>
                          <button className="btn btn-outline-primary btn-sm" onClick={() => toast('Logo upload requires merchant file storage — coming soon', { tone: 'info' })}>Upload Logo</button>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Support Email</label>
                        <input
                          type="email"
                          className="form-control"
                          value={checkoutConfig.supportEmail}
                          onChange={(e) => persist({ ...config, supportEmail: e.target.value })}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Support Phone</label>
                        <input
                          type="tel"
                          className="form-control"
                          value={checkoutConfig.supportPhone}
                          onChange={(e) => persist({ ...config, supportPhone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <h6 className="mb-3">Theme Colors</h6>
                      <div className="mb-3">
                        <label className="form-label">Primary Color</label>
                        <div className="d-flex gap-2 align-items-center">
                          <input
                            type="color"
                            className="form-control form-control-color"
                            value={checkoutConfig.theme.primaryColor}
                            onChange={(e) => persist({ ...config, theme: { ...config.theme, primaryColor: e.target.value } })}
                            style={{ width: '60px' }}
                          />
                          <input
                            type="text"
                            className="form-control"
                            value={checkoutConfig.theme.primaryColor}
                            onChange={(e) => persist({ ...config, theme: { ...config.theme, primaryColor: e.target.value } })}
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Secondary Color</label>
                        <div className="d-flex gap-2 align-items-center">
                          <input
                            type="color"
                            className="form-control form-control-color"
                            value={checkoutConfig.theme.secondaryColor}
                            onChange={(e) => persist({ ...config, theme: { ...config.theme, secondaryColor: e.target.value } })}
                            style={{ width: '60px' }}
                          />
                          <input
                            type="text"
                            className="form-control"
                            value={checkoutConfig.theme.secondaryColor}
                            onChange={(e) => persist({ ...config, theme: { ...config.theme, secondaryColor: e.target.value } })}
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Background Color</label>
                        <div className="d-flex gap-2 align-items-center">
                          <input
                            type="color"
                            className="form-control form-control-color"
                            value={checkoutConfig.theme.backgroundColor}
                            onChange={(e) => persist({ ...config, theme: { ...config.theme, backgroundColor: e.target.value } })}
                            style={{ width: '60px' }}
                          />
                          <input
                            type="text"
                            className="form-control"
                            value={checkoutConfig.theme.backgroundColor}
                            onChange={(e) => persist({ ...config, theme: { ...config.theme, backgroundColor: e.target.value } })}
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Text Color</label>
                        <div className="d-flex gap-2 align-items-center">
                          <input
                            type="color"
                            className="form-control form-control-color"
                            value={checkoutConfig.theme.textColor}
                            onChange={(e) => persist({ ...config, theme: { ...config.theme, textColor: e.target.value } })}
                            style={{ width: '60px' }}
                          />
                          <input
                            type="text"
                            className="form-control"
                            value={checkoutConfig.theme.textColor}
                            onChange={(e) => persist({ ...config, theme: { ...config.theme, textColor: e.target.value } })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <button className="btn btn-primary" onClick={() => saveSection('Appearance')}>Save Appearance Settings</button>
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
                      {ALL_METHODS.map((method) => (
                        <div key={method} className="list-group-item d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center gap-3">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`pm-${method}`}
                                checked={checkoutConfig.paymentMethods.enabled.includes(method)}
                                onChange={() => toggleMethod(method)}
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
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="methodSelection"
                        checked={checkoutConfig.paymentMethods.allowMethodSelection}
                        onChange={(e) => persist({ ...config, paymentMethods: { ...config.paymentMethods, allowMethodSelection: e.target.checked } })}
                      />
                      <label className="form-check-label" htmlFor="methodSelection">
                        Allow customers to choose payment method
                      </label>
                    </div>
                  </div>
                  <div>
                    <h6 className="mb-3">Default Payment Method</h6>
                    <select
                      className="form-select"
                      value={checkoutConfig.paymentMethods.defaultMethod}
                      onChange={(e) => persist({ ...config, paymentMethods: { ...config.paymentMethods, defaultMethod: e.target.value } })}
                    >
                      {checkoutConfig.paymentMethods.enabled.map((method) => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="card-footer">
                  <button className="btn btn-primary" onClick={() => saveSection('Payment Methods')}>Save Payment Methods</button>
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
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="reqName"
                          checked={checkoutConfig.checkoutFlow.requireCustomerName}
                          onChange={(e) => persist({ ...config, checkoutFlow: { ...config.checkoutFlow, requireCustomerName: e.target.checked } })}
                        />
                      </div>
                    </div>
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1 small">Customer Email</h6>
                        <p className="text-muted small mb-0">Require customer to provide their email</p>
                      </div>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="reqEmail"
                          checked={checkoutConfig.checkoutFlow.collectCustomerEmail}
                          onChange={(e) => persist({ ...config, checkoutFlow: { ...config.checkoutFlow, collectCustomerEmail: e.target.checked } })}
                        />
                      </div>
                    </div>
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1 small">Customer Phone</h6>
                        <p className="text-muted small mb-0">Require customer to provide their phone number</p>
                      </div>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="reqPhone"
                          checked={checkoutConfig.checkoutFlow.collectCustomerPhone}
                          onChange={(e) => persist({ ...config, checkoutFlow: { ...config.checkoutFlow, collectCustomerPhone: e.target.checked } })}
                        />
                      </div>
                    </div>
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1 small">Billing Address</h6>
                        <p className="text-muted small mb-0">Require customer to provide billing address</p>
                      </div>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="reqAddress"
                          checked={checkoutConfig.checkoutFlow.collectBillingAddress}
                          onChange={(e) => persist({ ...config, checkoutFlow: { ...config.checkoutFlow, collectBillingAddress: e.target.checked } })}
                        />
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
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="guestCheckout"
                          checked={checkoutConfig.checkoutFlow.allowGuestCheckout}
                          onChange={(e) => persist({ ...config, checkoutFlow: { ...config.checkoutFlow, allowGuestCheckout: e.target.checked } })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <button className="btn btn-primary" onClick={() => saveSection('Checkout Flow')}>Save Checkout Flow</button>
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
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="successRedirect"
                        checked={checkoutConfig.successSettings.redirectEnabled}
                        onChange={(e) => persist({ ...config, successSettings: { ...config.successSettings, redirectEnabled: e.target.checked } })}
                      />
                      <label className="form-check-label" htmlFor="successRedirect">
                        Enable redirect on successful payment
                      </label>
                    </div>
                    <label className="form-label">Success URL</label>
                    <input
                      type="url"
                      className="form-control"
                      value={checkoutConfig.successSettings.redirectUrl}
                      onChange={(e) => persist({ ...config, successSettings: { ...config.successSettings, redirectUrl: e.target.value } })}
                      placeholder="https://yourdomain.com/payment/success"
                    />
                    <small className="text-muted">Customer will be redirected to this URL after successful payment</small>
                  </div>
                  <div className="mb-4">
                    <div className="form-check form-switch mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="successEmail"
                        checked={checkoutConfig.successSettings.sendConfirmationEmail}
                        onChange={(e) => persist({ ...config, successSettings: { ...config.successSettings, sendConfirmationEmail: e.target.checked } })}
                      />
                      <label className="form-check-label" htmlFor="successEmail">
                        Send confirmation email to customer
                      </label>
                    </div>
                  </div>
                  <hr className="my-4" />
                  <h6 className="mb-3">Failure Redirect</h6>
                  <div className="mb-4">
                    <div className="form-check form-switch mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="failRedirect"
                        checked={checkoutConfig.failureSettings.redirectEnabled}
                        onChange={(e) => persist({ ...config, failureSettings: { ...config.failureSettings, redirectEnabled: e.target.checked } })}
                      />
                      <label className="form-check-label" htmlFor="failRedirect">
                        Enable redirect on failed payment
                      </label>
                    </div>
                    <label className="form-label">Failure URL</label>
                    <input
                      type="url"
                      className="form-control"
                      value={checkoutConfig.failureSettings.redirectUrl}
                      onChange={(e) => persist({ ...config, failureSettings: { ...config.failureSettings, redirectUrl: e.target.value } })}
                      placeholder="https://yourdomain.com/payment/failure"
                    />
                    <small className="text-muted">Customer will be redirected to this URL if payment fails</small>
                  </div>
                  <div className="mb-4">
                    <div className="form-check form-switch mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="failNotify"
                        checked={checkoutConfig.failureSettings.sendFailureNotification}
                        onChange={(e) => persist({ ...config, failureSettings: { ...config.failureSettings, sendFailureNotification: e.target.checked } })}
                      />
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
                  <button className="btn btn-primary" onClick={() => saveSection('Redirect')}>Save Redirect Settings</button>
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
                  <button className="btn btn-outline-primary w-100" onClick={() => setShowPreview(true)}>
                    <i className="bi bi-eye me-2"></i>
                    Preview Checkout
                  </button>
                </div>
                <div className="col-md-4">
                  <button className="btn btn-outline-primary w-100" onClick={() => setShowCode(true)}>
                    <i className="bi bi-code-slash me-2"></i>
                    Get Integration Code
                  </button>
                </div>
                <div className="col-md-4">
                  <button className="btn btn-outline-primary w-100" onClick={() => setConfirmReset(true)}>
                    <i className="bi bi-arrow-counterclockwise me-2"></i>
                    Reset to Defaults
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Preview modal */}
      {showPreview && (
        <Modal open title="Checkout Preview" onClose={() => setShowPreview(false)}>
          <div className="border rounded p-3" style={{ backgroundColor: checkoutConfig.theme.backgroundColor }}>
            <h6 className="mb-1" style={{ color: checkoutConfig.theme.textColor }}>{checkoutConfig.businessName}</h6>
            <p className="small text-muted mb-3">Payment of USD 25.00</p>
            {checkoutConfig.checkoutFlow.requireCustomerName && (
              <input className="form-control form-control-sm mb-2" placeholder="Full name" readOnly />
            )}
            {checkoutConfig.checkoutFlow.collectCustomerEmail && (
              <input className="form-control form-control-sm mb-2" placeholder="Email" readOnly />
            )}
            {checkoutConfig.checkoutFlow.collectCustomerPhone && (
              <input className="form-control form-control-sm mb-2" placeholder="Phone" readOnly />
            )}
            <div className="d-flex flex-wrap gap-1 mb-3">
              {(checkoutConfig.paymentMethods.allowMethodSelection
                ? checkoutConfig.paymentMethods.enabled
                : [checkoutConfig.paymentMethods.defaultMethod]
              ).map((m) => (
                <span key={m} className="badge" style={{ backgroundColor: checkoutConfig.theme.primaryColor }}>{m}</span>
              ))}
            </div>
            <button className="btn w-100" style={{ backgroundColor: checkoutConfig.theme.primaryColor, color: '#fff' }}>
              Pay USD 25.00
            </button>
          </div>
          <p className="small text-muted mt-3 mb-0">This is a mock preview rendered from your current settings.</p>
        </Modal>
      )}

      {/* Integration code modal */}
      {showCode && (
        <Modal open title="Integration Code" onClose={() => setShowCode(false)} size="lg">
          <p className="small text-muted">Drop this snippet into your site to launch ZeePay checkout:</p>
          <pre className="bg-dark text-light rounded p-3 small">{`<script src="https://js.zeepay.co.zw/v1/checkout.js"></script>
<button id="zeepay-pay">Pay Now</button>
<script>
  ZeePayCheckout.render('#zeepay-pay', {
    key: 'pk_live_...',
    amount: 2500,
    currency: 'USD',
    methods: ${JSON.stringify(checkoutConfig.paymentMethods.enabled)},
    successUrl: '${checkoutConfig.successSettings.redirectUrl}',
    failureUrl: '${checkoutConfig.failureSettings.redirectUrl}',
  });
</script>`}</pre>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => { copyText(`ZeePayCheckout.render({ key: 'pk_live_...', methods: ${JSON.stringify(checkoutConfig.paymentMethods.enabled)} })`); toast('Code copied'); }}
          >
            <i className="bi bi-clipboard me-1"></i> Copy snippet
          </button>
        </Modal>
      )}

      {/* Reset confirm */}
      {confirmReset && (
        <Modal open title={"Reset checkout settings"} onClose={() => setConfirmReset(false)} size="sm" footer={<><button className="btn btn-light btn-sm" onClick={() => setConfirmReset(false)}>Cancel</button><button className="btn btn-warning btn-sm" onClick={() => { persist(defaultConfig); setConfirmReset(false); toast('Settings reset to defaults', { tone: 'info' }); }}>Reset</button></>}><p className="small mb-0">Restore all checkout settings to defaults? Your current customization will be lost.</p></Modal>
      )}
    </>
  );
}
