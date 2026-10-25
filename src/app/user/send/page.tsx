'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SendMoney() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('ecocash');
  const [step, setStep] = useState(1);
  const [sending, setSending] = useState(false);
  const [sentRef, setSentRef] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [recipientName, setRecipientName] = useState('');

  const confirmSend = () => {
    const method = paymentMethods.find((m) => m.id === selectedMethod);
    if (method && parseFloat(amount) > method.balance) {
      setStep(2);
      alert(`Insufficient balance in ${method.name}`);
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSentRef(`txn_${Math.random().toString(36).slice(2, 10).toUpperCase()}`);
      setStep(4);
    }, 1500);
  };

  const resetFlow = () => {
    setStep(1);
    setAmount('');
    setRecipient('');
    setRecipientName('');
    setNote('');
    setSentRef(null);
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

  const paymentMethods = [
    { id: 'ecocash', name: 'EcoCash', icon: '📱', balance: 1250.00 },
    { id: 'innbucks', name: 'InnBucks', icon: '💰', balance: 890.00 },
    { id: 'zipit', name: 'ZIPIT', icon: '🏦', balance: 2100.00 },
    { id: 'visa', name: 'Visa Card', icon: '💳', balance: 5000.00 },
  ];

  const recentRecipients = [
    { name: 'John Smith', phone: '+263 71 234 5678', avatar: 'JS' },
    { name: 'Mary Johnson', phone: '+263 71 876 5432', avatar: 'MJ' },
    { name: 'Robert Davis', phone: '+263 71 111 2222', avatar: 'RD' },
  ];

  const quickAmounts = [10, 20, 50, 100, 200, 500];

  return (
    <>
      <div className="mb-4">
        <h2 className="h4">Send Money</h2>
        <p className="text-muted">Send money instantly to anyone in Zimbabwe</p>
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
                      <h5 className="mb-4">Select Recipient</h5>
                      
                      {/* Quick Recipients */}
                      <div className="mb-4">
                        <p className="text-muted small mb-2">Recent Recipients</p>
                        <div className="d-flex gap-3 flex-wrap">
                          {recentRecipients.map((recipient, index) => (
                            <button
                              key={index}
                              className="btn btn-outline-secondary d-flex flex-column align-items-center gap-2"
                              style={{ minWidth: '100px', padding: '15px' }}
                              onClick={() => { setRecipient(recipient.phone); setStep(2); }}
                            >
                              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                {recipient.avatar}
                              </div>
                              <div className="text-center">
                                <small className="d-block fw-medium">{recipient.name}</small>
                                <small className="d-block text-muted" style={{ fontSize: '10px' }}>{recipient.phone}</small>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <hr className="my-4" />

                      {/* Manual Entry */}
                      <div className="mb-3">
                        <label className="form-label">Phone Number or Email</label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          placeholder="+263 7X XXX XXXX or email@example.com"
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Recipient Name (Optional)</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter recipient name"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                        />
                      </div>

                      <button className="btn btn-primary w-100" onClick={() => setStep(2)} disabled={!recipient}>
                        Continue
                      </button>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <h5 className="mb-4">Enter Amount</h5>

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

                      {/* Payment Method Selection */}
                      <div className="mb-4">
                        <label className="form-label">Payment Method</label>
                        <div className="row g-2">
                          {paymentMethods.map((method) => (
                            <div className="col-6" key={method.id}>
                              <button
                                className={`btn w-100 d-flex align-items-center gap-2 ${selectedMethod === method.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                                onClick={() => setSelectedMethod(method.id)}
                              >
                                <span className="fs-5">{method.icon}</span>
                                <div className="text-start">
                                  <div className="small fw-medium">{method.name}</div>
                                  <div className="small text-muted">${method.balance.toFixed(2)}</div>
                                </div>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Note */}
                      <div className="mb-4">
                        <label className="form-label">Note (Optional)</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          placeholder="What's this for?"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                        ></textarea>
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
                      <h5 className="mb-4">Confirm Transfer</h5>

                      {/* Summary */}
                      <div className="card bg-light mb-4">
                        <div className="card-body">
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Recipient</span>
                            <strong>{recipient}</strong>
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

                      {/* Payment Method */}
                      <div className="mb-4">
                        <p className="text-muted small mb-1">Payment Method</p>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fs-4">{paymentMethods.find(m => m.id === selectedMethod)?.icon}</span>
                          <strong>{paymentMethods.find(m => m.id === selectedMethod)?.name}</strong>
                        </div>
                      </div>

                      <div className="alert alert-info" role="alert">
                        <i className="bi bi-info-circle me-2"></i>
                        This transfer will be processed instantly. Please verify all details before confirming.
                      </div>

                      <div className="d-flex gap-2">
                        <button className="btn btn-outline-secondary flex-grow-1" onClick={() => setStep(2)}>
                          Back
                        </button>
                        <button className="btn btn-success flex-grow-1" onClick={confirmSend} disabled={sending}>
                          {sending ? 'Sending…' : 'Confirm & Send'}
                        </button>
                      </div>
                    </>
                  )}

                  {step === 4 && sentRef && (
                    <div className="text-center py-4">
                      <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '64px', height: '64px' }}>
                        <i className="bi bi-check-lg fs-2"></i>
                      </div>
                      <h5>Transfer Sent</h5>
                      <p className="text-muted small mb-1">
                        ${parseFloat(amount).toFixed(2)} sent to {recipientName || recipient}
                      </p>
                      <p className="text-muted small">
                        Reference: <code>{sentRef}</code>
                      </p>
                      {note && <p className="small text-muted fst-italic">“{note}”</p>}
                      <div className="d-flex gap-2 justify-content-center mt-4">
                        <button className="btn btn-outline-primary" onClick={resetFlow}>
                          Send another
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
                  <p className="text-muted small mb-0">Across all accounts</p>
                </div>
              </div>

              {/* Quick Links */}
              <div className="card">
                <div className="card-body">
                  <h6 className="mb-3">Quick Actions</h6>
                  <div className="d-grid gap-2">
                    <Link href="/user/airtime" className="btn btn-outline-primary text-start">
                      <i className="bi bi-phone me-2"></i>
                      Buy Airtime
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

              {/* Security Tips */}
              <div className="card mt-4">
                <div className="card-body">
                  <h6 className="mb-3">
                    <i className="bi bi-shield-check text-success me-2"></i>
                    Security Tips
                  </h6>
                  <ul className="small text-muted mb-0">
                    <li className="mb-2">Always verify the recipient's phone number</li>
                    <li className="mb-2">Never share your PIN with anyone</li>
                    <li className="mb-2">Report suspicious activity immediately</li>
                    <li>Use strong passwords for your account</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
