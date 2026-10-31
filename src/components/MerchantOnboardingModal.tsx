'use client';

import { useState } from 'react';
import Modal from './ui/Modal';

export interface OnboardingData {
  businessName: string;
  tradingName: string;
  businessType: string;
  registrationNumber: string;
  country: string;
  contactName: string;
  email: string;
  phone: string;
  settlementCurrency: 'USD' | 'ZWG';
  settlementMethod: string;
  paymentMethods: string[];
  tier: string;
  monthlyLimit: string;
  sendInvite: boolean;
}

interface MerchantOnboardingModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: OnboardingData) => void;
}

const STEPS = ['Business', 'Contact & settlement', 'Payment methods', 'Review'];

const BUSINESS_TYPES = ['Private Limited', 'Sole Proprietor', 'Partnership', 'NGO / Non-profit', 'Government'];
const COUNTRIES = ['Zimbabwe', 'South Africa', 'Zambia', 'Botswana', 'Kenya'];
const SETTLEMENT_METHODS = ['EcoCash merchant wallet', 'Bank account (ZB)', 'Bank account (international)', 'OneMoney'];
const PAYMENT_METHODS = [
  { id: 'ecocash', label: 'EcoCash', hint: 'USSD & push payments' },
  { id: 'innbucks', label: 'InnBucks', hint: 'Wallet payments' },
  { id: 'omari', label: 'Omari', hint: 'Wallet payments' },
  { id: 'cards', label: 'Visa & Mastercard', hint: 'ZimSwitch Online' },
  { id: 'bank_transfer', label: 'Bank transfer', hint: 'Direct settlement' },
];
const TIERS = [
  { id: 'starter', label: 'Starter', hint: 'Up to $5K/month' },
  { id: 'growth', label: 'Growth', hint: 'Up to $50K/month' },
  { id: 'enterprise', label: 'Enterprise', hint: 'Custom limits' },
];

const initialForm: OnboardingData = {
  businessName: '',
  tradingName: '',
  businessType: 'Private Limited',
  registrationNumber: '',
  country: 'Zimbabwe',
  contactName: '',
  email: '',
  phone: '',
  settlementCurrency: 'USD',
  settlementMethod: SETTLEMENT_METHODS[0],
  paymentMethods: ['ecocash'],
  tier: 'starter',
  monthlyLimit: '',
  sendInvite: true,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function MerchantOnboardingModal({ open, onClose, onSubmit }: MerchantOnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<OnboardingData>(initialForm);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleMethod = (id: string) =>
    setForm((f) => ({
      ...f,
      paymentMethods: f.paymentMethods.includes(id)
        ? f.paymentMethods.filter((m) => m !== id)
        : [...f.paymentMethods, id],
    }));

  const stepErrors = (): string[] => {
    const e: string[] = [];
    if (step === 0) {
      if (!form.businessName.trim()) e.push('Business name is required');
      if (!form.registrationNumber.trim()) e.push('Registration number is required');
    }
    if (step === 1) {
      if (!form.contactName.trim()) e.push('Contact name is required');
      if (!EMAIL_RE.test(form.email)) e.push('A valid email address is required');
      if (!form.phone.trim()) e.push('Phone number is required');
    }
    if (step === 2) {
      if (form.paymentMethods.length === 0) e.push('Select at least one payment method');
      if (form.tier === 'enterprise' && !form.monthlyLimit.trim()) e.push('Monthly limit is required for Enterprise');
    }
    return e;
  };

  const canAdvance = stepErrors().length === 0;

  const reset = () => {
    setStep(0);
    setForm(initialForm);
    setTouched(false);
    setSubmitting(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const next = () => {
    if (!canAdvance) {
      setTouched(true);
      return;
    }
    setTouched(false);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => {
    setTouched(false);
    setStep((s) => Math.max(0, s - 1));
  };

  const submit = () => {
    setSubmitting(true);
    // Simulated submission — the page owns persistence.
    setTimeout(() => {
      onSubmit(form);
      reset();
    }, 400);
  };

  const errors = touched ? stepErrors() : [];

  const field = (label: string, input: React.ReactNode, hint?: string) => (
    <div className="mb-3">
      <label className="form-label small fw-medium mb-1">{label}</label>
      {input}
      {hint && <div className="form-text small">{hint}</div>}
    </div>
  );

  const reviewRow = (label: string, value: string) => (
    <li className="list-group-item d-flex justify-content-between gap-3 px-0">
      <span className="small text-muted flex-shrink-0">{label}</span>
      <span className="small text-end">{value || '—'}</span>
    </li>
  );

  return (
    <Modal
      open={open}
      onClose={close}
      title="Onboard merchant"
      subtitle={`Step ${step + 1} of ${STEPS.length} — ${STEPS[step]}`}
      icon="bi-briefcase"
      size="lg"
      footer={
        <div className="d-flex w-100 gap-2">
          {step > 0 && (
            <button className="btn btn-light" onClick={back} disabled={submitting}>
              <i className="bi bi-arrow-left me-1"></i>Back
            </button>
          )}
          <div className="flex-grow-1" />
          <button className="btn btn-light" onClick={close} disabled={submitting}>
            Cancel
          </button>
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={next}>
              Continue<i className="bi bi-arrow-right ms-1"></i>
            </button>
          ) : (
            <button className="btn btn-primary" onClick={submit} disabled={submitting}>
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  Creating…
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-1"></i>Create merchant
                </>
              )}
            </button>
          )}
        </div>
      }
    >
      {/* Step indicator */}
      <div className="d-flex gap-1 mb-4" aria-hidden="true">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className="flex-grow-1 rounded"
            style={{
              height: 4,
              background: i <= step ? 'var(--zp-accent, #6366f1)' : 'var(--zp-border, #e6e8f2)',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>

      {errors.length > 0 && (
        <div className="alert alert-danger py-2 px-3 small mb-3" role="alert">
          {errors.map((e) => (
            <div key={e}><i className="bi bi-exclamation-circle me-1"></i>{e}</div>
          ))}
        </div>
      )}

      {step === 0 && (
        <div>
          <div className="row g-3">
            <div className="col-sm-6">
              {field(
                'Business name *',
                <input
                  className="form-control form-control-sm"
                  value={form.businessName}
                  onChange={(e) => set('businessName', e.target.value)}
                  placeholder="Acme Solutions (Pvt) Ltd"
                  autoFocus
                />,
              )}
            </div>
            <div className="col-sm-6">
              {field(
                'Trading name',
                <input
                  className="form-control form-control-sm"
                  value={form.tradingName}
                  onChange={(e) => set('tradingName', e.target.value)}
                  placeholder="Acme Store"
                />,
                'Shown on customer statements if different',
              )}
            </div>
            <div className="col-sm-6">
              {field(
                'Business type *',
                <select
                  className="form-select form-select-sm"
                  value={form.businessType}
                  onChange={(e) => set('businessType', e.target.value)}
                >
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>,
              )}
            </div>
            <div className="col-sm-6">
              {field(
                'Country *',
                <select
                  className="form-select form-select-sm"
                  value={form.country}
                  onChange={(e) => set('country', e.target.value)}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>,
              )}
            </div>
            <div className="col-12">
              {field(
                'Registration number *',
                <input
                  className="form-control form-control-sm"
                  value={form.registrationNumber}
                  onChange={(e) => set('registrationNumber', e.target.value)}
                  placeholder="e.g. 12345/2024"
                />,
                'Company registration or business licence number',
              )}
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <div className="row g-3">
            <div className="col-sm-6">
              {field(
                'Primary contact *',
                <input
                  className="form-control form-control-sm"
                  value={form.contactName}
                  onChange={(e) => set('contactName', e.target.value)}
                  placeholder="John Mukono"
                />,
              )}
            </div>
            <div className="col-sm-6">
              {field(
                'Work email *',
                <input
                  type="email"
                  className="form-control form-control-sm"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="john@acme.co.zw"
                />,
              )}
            </div>
            <div className="col-sm-6">
              {field(
                'Phone *',
                <input
                  type="tel"
                  className="form-control form-control-sm"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="+263 77 000 0000"
                />,
              )}
            </div>
            <div className="col-sm-6">
              {field(
                'Settlement currency',
                <select
                  className="form-select form-select-sm"
                  value={form.settlementCurrency}
                  onChange={(e) => set('settlementCurrency', e.target.value as 'USD' | 'ZWG')}
                >
                  <option value="USD">USD</option>
                  <option value="ZWG">ZWG</option>
                </select>,
              )}
            </div>
            <div className="col-12">
              {field(
                'Settlement destination',
                <select
                  className="form-select form-select-sm"
                  value={form.settlementMethod}
                  onChange={(e) => set('settlementMethod', e.target.value)}
                >
                  {SETTLEMENT_METHODS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>,
              )}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <p className="small text-muted mb-2">Payment methods the merchant can accept</p>
          <div className="row g-2 mb-4">
            {PAYMENT_METHODS.map((m) => {
              const on = form.paymentMethods.includes(m.id);
              return (
                <div key={m.id} className="col-sm-6">
                  <button
                    type="button"
                    className={`btn w-100 text-start d-flex align-items-center gap-2 py-2 ${on ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => toggleMethod(m.id)}
                    aria-pressed={on}
                  >
                    <i className={`bi ${on ? 'bi-check-circle-fill' : 'bi-circle'}`}></i>
                    <span className="flex-grow-1">
                      <span className="d-block small fw-semibold">{m.label}</span>
                      <span className="d-block small opacity-75">{m.hint}</span>
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          <p className="small text-muted mb-2">Merchant tier</p>
          <div className="row g-2 mb-3">
            {TIERS.map((t) => {
              const on = form.tier === t.id;
              return (
                <div key={t.id} className="col-4">
                  <button
                    type="button"
                    className={`btn w-100 py-2 ${on ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => set('tier', t.id)}
                    aria-pressed={on}
                  >
                    <span className="d-block small fw-semibold">{t.label}</span>
                    <span className="d-block" style={{ fontSize: 11, opacity: 0.75 }}>{t.hint}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {form.tier === 'enterprise' && (
            <div className="mb-3">
              <label className="form-label small fw-medium mb-1">Monthly limit (USD) *</label>
              <input
                className="form-control form-control-sm"
                value={form.monthlyLimit}
                onChange={(e) => set('monthlyLimit', e.target.value)}
                placeholder="e.g. 250000"
                inputMode="numeric"
              />
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div>
          <ul className="list-group list-group-flush mb-3">
            {reviewRow('Business', form.tradingName ? `${form.businessName} (t/a ${form.tradingName})` : form.businessName)}
            {reviewRow('Type', `${form.businessType} · ${form.country}`)}
            {reviewRow('Registration #', form.registrationNumber)}
            {reviewRow('Contact', `${form.contactName} · ${form.phone}`)}
            {reviewRow('Email', form.email)}
            {reviewRow('Settlement', `${form.settlementMethod} · ${form.settlementCurrency}`)}
            {reviewRow(
              'Methods',
              form.paymentMethods
                .map((id) => PAYMENT_METHODS.find((m) => m.id === id)?.label)
                .filter(Boolean)
                .join(', '),
            )}
            {reviewRow(
              'Tier',
              `${TIERS.find((t) => t.id === form.tier)?.label}${form.monthlyLimit ? ` · $${form.monthlyLimit}/mo` : ''}`,
            )}
          </ul>
          <div className="form-check">
            <input
              id="ob-invite"
              type="checkbox"
              className="form-check-input"
              checked={form.sendInvite}
              onChange={(e) => set('sendInvite', e.target.checked)}
            />
            <label htmlFor="ob-invite" className="form-check-label small">
              Email the merchant their sign-in invitation and test API keys
            </label>
          </div>
        </div>
      )}
    </Modal>
  );
}
