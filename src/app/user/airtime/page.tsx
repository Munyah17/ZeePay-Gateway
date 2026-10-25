'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Airtime() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('ecocash');
  const [step, setStep] = useState(1);
  const [buying, setBuying] = useState(false);
  const [doneRef, setDoneRef] = useState<string | null>(null);

  const confirmBuy = () => {
    setBuying(true);
    setTimeout(() => {
      setBuying(false);
      setDoneRef(`air_${Math.random().toString(36).slice(2, 10).toUpperCase()}`);
      setStep(4);
    }, 1200);
  };

  const resetFlow = () => {
    setStep(1);
    setAmount('');
    setPhone('');
    setDoneRef(null);
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

  const providers = [
    { id: 'ecocash', name: 'EcoCash', icon: '📱', color: 'bg-success' },
    { id: 'innbucks', name: 'InnBucks', icon: '💰', color: 'bg-primary' },
    { id: 'onemoney', name: 'OneMoney', icon: '📱', color: 'bg-warning' },
    { id: 'netone', name: 'NetOne', icon: '📡', color: 'bg-info' },
    { id: 'telecel', name: 'Telecel', icon: '📶', color: 'bg-danger' },
  ];

  const quickAmounts = [1, 2, 5, 10, 20, 50];

  const recentNumbers = [
    { phone: '+263 71 234 5678', provider: 'EcoCash', date: '2 hours ago' },
    { phone: '+263 71 876 5432', provider: 'OneMoney', date: 'Yesterday' },
    { phone: '+263 71 111 2222', provider: 'EcoCash', date: '3 days ago' },
  ];

  return (
    <>
      <div className="mb-4">
        <h2 className="h4">Buy Airtime</h2>
        <p className="text-muted">Instant airtime top-up for all networks</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="card">
                <div className="card-body">
                  {/* Progress Steps */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small text-muted">Step {step} of 3</span>
                      <span className="small text-muted">{step * 33}% Complete</span>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div className="progress-bar" style={{ width: `${step * 33}%` }}></div>
                    </div>
                  </div>

                  {step === 1 && (
                    <>
                      <h5 className="mb-4">Enter Phone Number</h5>

                      {/* Recent Numbers */}
                      <div className="mb-4">
                        <p className="text-muted small mb-2">Recent Numbers</p>
                        <div className="list-group">
                          {recentNumbers.map((item, index) => (
                            <button
                              key={index}
                              className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                              onClick={() => { setPhone(item.phone); setStep(2); }}
                            >
                              <div>
                                <h6 className="mb-1 small fw-medium">{item.phone}</h6>
                                <small className="text-muted">{item.provider} • {item.date}</small>
                              </div>
                              <i className="bi bi-chevron-right text-muted"></i>
                            </button>
                          ))}
                        </div>
                      </div>

                      <hr className="my-4" />

                      {/* Manual Entry */}
                      <div className="mb-3">
                        <label className="form-label">Phone Number *</label>
                        <input
                          type="tel"
                          className="form-control form-control-lg"
                          placeholder="+263 7X XXX XXXX"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>

                      <button className="btn btn-primary w-100" onClick={() => setStep(2)} disabled={!phone}>
                        Continue
                      </button>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <h5 className="mb-4">Select Provider & Amount</h5>

                      {/* Provider Selection */}
                      <div className="mb-4">
                        <label className="form-label">Network Provider</label>
                        <div className="row g-2">
                          {providers.map((provider) => (
                            <div className="col-4" key={provider.id}>
                              <button
                                className={`btn w-100 d-flex flex-column align-items-center gap-1 ${selectedProvider === provider.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                                onClick={() => setSelectedProvider(provider.id)}
                                style={{ padding: '15px' }}
                              >
                                <span className="fs-4">{provider.icon}</span>
                                <span className="small">{provider.name}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Amount Input */}
                      <div className="mb-4">
                        <label className="form-label">Amount (USD)</label>
                        <div className="input-group input-group-lg mb-3">
                          <span className="input-group-text">$</span>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                          />
                        </div>

                        {/* Quick Amounts */}
                        <div className="d-flex gap-2 flex-wrap">
                          {quickAmounts.map((quickAmount) => (
                            <button
                              key={quickAmount}
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => setAmount(quickAmount.toString())}
                            >
                              ${quickAmount}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="d-flex gap-2">
                        <button className="btn btn-outline-secondary flex-grow-1" onClick={() => setStep(1)}>
                          Back
                        </button>
                        <button className="btn btn-primary flex-grow-1" onClick={() => setStep(3)} disabled={!amount}>
                          Continue
                        </button>
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <h5 className="mb-4">Confirm Purchase</h5>

                      {/* Summary */}
                      <div className="card bg-light mb-4">
                        <div className="card-body">
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Phone Number</span>
                            <strong>{phone}</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Provider</span>
                            <strong>{providers.find(p => p.id === selectedProvider)?.name}</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Amount</span>
                            <strong>${parseFloat(amount).toFixed(2)}</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Fee</span>
                            <strong>$0.00</strong>
                          </div>
                          <hr />
                          <div className="d-flex justify-content-between">
                            <span className="fw-medium">Total</span>
                            <strong className="text-success">${parseFloat(amount).toFixed(2)}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="alert alert-info" role="alert">
                        <i className="bi bi-info-circle me-2"></i>
                        Airtime will be sent instantly to {phone}. Please verify the number before confirming.
                      </div>

                      <div className="d-flex gap-2">
                        <button className="btn btn-outline-secondary flex-grow-1" onClick={() => setStep(2)}>
                          Back
                        </button>
                        <button className="btn btn-success flex-grow-1" onClick={confirmBuy} disabled={buying}>
                          {buying ? 'Processing…' : 'Confirm & Buy'}
                        </button>
                      </div>
                    </>
                  )}

                  {step === 4 && doneRef && (
                    <div className="text-center py-4">
                      <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '64px', height: '64px' }}>
                        <i className="bi bi-check-lg fs-2"></i>
                      </div>
                      <h5>Airtime Purchased</h5>
                      <p className="text-muted small mb-1">
                        ${parseFloat(amount).toFixed(2)} {providers.find(p => p.id === selectedProvider)?.name} airtime sent to {phone}
                      </p>
                      <p className="text-muted small">Reference: <code>{doneRef}</code></p>
                      <div className="d-flex gap-2 justify-content-center mt-4">
                        <button className="btn btn-outline-primary" onClick={resetFlow}>
                          Buy more
                        </button>
                        <Link href="/user/history" className="btn btn-primary">
                          View history
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              {/* Balance Card */}
              <div className="card mb-4">
                <div className="card-body">
                  <p className="text-muted small mb-1">Available Balance</p>
                  <h3 className="h2 mb-0">$9,240.00</h3>
                  <p className="text-muted small mb-0">Ready for airtime purchase</p>
                </div>
              </div>

              {/* Quick Links */}
              <div className="card">
                <div className="card-body">
                  <h6 className="mb-3">Quick Actions</h6>
                  <div className="d-grid gap-2">
                    <Link href="/user/send" className="btn btn-outline-primary text-start">
                      <i className="bi bi-send me-2"></i>
                      Send Money
                    </Link>
                    <Link href="/user/bills" className="btn btn-outline-primary text-start">
                      <i className="bi bi-receipt me-2"></i>
                      Pay Bills
                    </Link>
                    <Link href="/user/history" className="btn btn-outline-primary text-start">
                      <i className="bi bi-clock-history me-2"></i>
                      Transaction History
                    </Link>
                  </div>
                </div>
              </div>

              {/* Promotions */}
              <div className="card mt-4 bg-primary text-white">
                <div className="card-body">
                  <h6 className="mb-2">
                    <i className="bi bi-gift me-2"></i>
                    Special Offer
                  </h6>
                  <p className="small mb-3">Get 10% bonus on airtime purchases above $20 this week!</p>
                  <button className="btn btn-light btn-sm w-100">Learn More</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
