'use client';
/* eslint-disable @typescript-eslint/no-explicit-any -- generic record utilities operate on arbitrary row shapes */

import { useEffect, useState } from 'react';
import Modal from './Modal';

export type FieldType = 'text' | 'email' | 'number' | 'tel' | 'date' | 'select' | 'textarea' | 'toggle' | 'password' | 'url' | 'color';

export interface FieldDef {
  key: string;
  label: string;
  type?: FieldType;
  options?: string[];
  required?: boolean;
  placeholder?: string;
  help?: string;
  full?: boolean;
  /** Allow free text in addition to suggested options. */
  creatable?: boolean;
}

export function RecordFields({
  fields,
  values,
  onChange,
  errors = {},
}: {
  fields: FieldDef[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  errors?: Record<string, string>;
}) {
  return (
    <div className="row g-3">
      {fields.map((f) => {
        const id = `fld_${f.key}`;
        const v = values[f.key] ?? '';
        const invalid = errors[f.key] ? 'is-invalid' : '';
        return (
          <div key={f.key} className={f.full || f.type === 'textarea' ? 'col-12' : 'col-md-6'}>
            {f.type !== 'toggle' && (
              <label htmlFor={id} className="form-label small fw-semibold">
                {f.label}
                {f.required && <span className="text-danger ms-1">*</span>}
              </label>
            )}
            {f.type === 'select' && !f.creatable ? (
              <select id={id} className={`form-select ${invalid}`} value={v} onChange={(e) => onChange(f.key, e.target.value)}>
                <option value="">Select…</option>
                {(f.options || []).map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea id={id} rows={3} className={`form-control ${invalid}`} value={v} placeholder={f.placeholder} onChange={(e) => onChange(f.key, e.target.value)} />
            ) : f.type === 'toggle' ? (
              <div className="form-check form-switch mt-md-4">
                <input id={id} className="form-check-input" type="checkbox" role="switch" checked={!!v && v !== 'false' && v !== 'Off' && v !== 'Disabled'} onChange={(e) => onChange(f.key, e.target.checked)} />
                <label className="form-check-label small fw-semibold" htmlFor={id}>{f.label}</label>
              </div>
            ) : (
              <>
                <input
                  id={id}
                  type={f.type === 'select' ? 'text' : f.type || 'text'}
                  list={f.options ? `${id}_list` : undefined}
                  className={`form-control ${invalid}`}
                  value={v}
                  placeholder={f.placeholder}
                  onChange={(e) => onChange(f.key, f.type === 'number' && e.target.value !== '' ? Number(e.target.value) : e.target.value)}
                />
                {f.options && (
                  <datalist id={`${id}_list`}>
                    {f.options.map((o) => (
                      <option key={o} value={o} />
                    ))}
                  </datalist>
                )}
              </>
            )}
            {errors[f.key] ? <div className="invalid-feedback d-block">{errors[f.key]}</div> : f.help && <div className="form-text">{f.help}</div>}
          </div>
        );
      })}
    </div>
  );
}

export function validateFields(fields: FieldDef[], values: Record<string, any>): Record<string, string> {
  const errors: Record<string, string> = {};
  fields.forEach((f) => {
    const v = values[f.key];
    if (f.required && (v === undefined || v === null || String(v).trim() === '')) errors[f.key] = `${f.label} is required`;
    else if (f.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v))) errors[f.key] = 'Enter a valid email address';
    else if (f.type === 'url' && v && !/^https?:\/\//.test(String(v))) errors[f.key] = 'URL must start with http:// or https://';
  });
  return errors;
}

interface RecordFormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: string;
  fields: FieldDef[];
  initial?: Record<string, any>;
  submitLabel?: string;
  onSubmit: (values: Record<string, any>) => void | Promise<void>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function RecordFormModal({ open, onClose, title, subtitle, icon, fields, initial, submitLabel = 'Save', onSubmit, size = 'lg' }: RecordFormModalProps) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValues({ ...(initial || {}) });
      setErrors({});
    }
  }, [open, initial]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const errs = validateFields(fields, values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await onSubmit(values);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={icon}
      size={size}
      footer={
        <>
          <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
          <button type="submit" form="zp-record-form" className="btn btn-primary" disabled={busy}>
            {busy && <span className="spinner-border spinner-border-sm me-2" />}
            {submitLabel}
          </button>
        </>
      }
    >
      <form id="zp-record-form" onSubmit={submit} noValidate>
        <RecordFields fields={fields} values={values} errors={errors} onChange={(k, v) => setValues((p) => ({ ...p, [k]: v }))} />
      </form>
    </Modal>
  );
}
