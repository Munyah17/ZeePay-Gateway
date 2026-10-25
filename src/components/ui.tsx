'use client';

/**
 * Shared interactive primitives for ZeePay admin/dashboard pages.
 * Bootstrap-markup Modal, ConfirmDialog and a lightweight Toast system.
 */

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';

/* ---------------------------------- Toast --------------------------------- */

interface ToastItem {
  id: number;
  message: string;
  tone: 'success' | 'danger' | 'info' | 'warning';
}

const ToastContext = createContext<{ notify: (message: string, tone?: ToastItem['tone']) => void }>({
  notify: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

let externalNotify: (message: string, tone?: ToastItem['tone']) => void = () => {};
/** Imperative toast for non-hook contexts: `toast('Saved')` */
export function toast(message: string, tone: ToastItem['tone'] = 'success') {
  externalNotify(message, tone);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const notify = useCallback((message: string, tone: ToastItem['tone'] = 'success') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  useEffect(() => {
    externalNotify = notify;
  }, [notify]);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1090 }}>
        {items.map((t) => (
          <div
            key={t.id}
            className={`toast show align-items-center text-bg-${t.tone} border-0 mb-2`}
            role="alert"
          >
            <div className="d-flex">
              <div className="toast-body small">{t.message}</div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
              ></button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ---------------------------------- Modal --------------------------------- */

export function Modal({
  title,
  children,
  footer,
  onClose,
  size = 'md',
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg';
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      role="dialog"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`modal-dialog modal-${size === 'md' ? '' : size} modal-dialog-centered`.trim()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>
          <div className="modal-body">{children}</div>
          {footer && <div className="modal-footer">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ ConfirmDialog ----------------------------- */

export function ConfirmDialog({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  tone = 'danger',
  onConfirm,
  onCancel,
}: {
  title?: string;
  message: string;
  confirmLabel?: string;
  tone?: 'danger' | 'warning' | 'primary' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      size="sm"
      footer={
        <>
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>
            Cancel
          </button>
          <button className={`btn btn-${tone} btn-sm`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="small mb-0">{message}</p>
    </Modal>
  );
}

/* ------------------------------ RecordActions ----------------------------- */

/**
 * Standard row action dropdown: View / Edit / Suspend-Activate / Delete.
 */
export function RecordActions({
  onView,
  onEdit,
  toggleAction,
  onToggle,
  onDelete,
  extra,
}: {
  onView?: () => void;
  onEdit?: () => void;
  toggleAction?: string | null;
  onToggle?: () => void;
  onDelete?: () => void;
  extra?: { label: string; icon?: string; onClick: () => void }[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  return (
    <div className="dropdown position-static" onClick={(e) => e.stopPropagation()}>
      <div className="btn-group btn-group-sm">
        {onView && (
          <button className="btn btn-outline-primary" onClick={onView} title="View details">
            <i className="bi bi-eye"></i>
          </button>
        )}
        {onEdit && (
          <button className="btn btn-outline-secondary" onClick={onEdit} title="Edit">
            <i className="bi bi-pencil"></i>
          </button>
        )}
        <button
          className="btn btn-outline-secondary dropdown-toggle"
          onClick={() => setOpen((o) => !o)}
          title="More actions"
        ></button>
      </div>
      {open && (
        <ul className="dropdown-menu dropdown-menu-end show" style={{ position: 'absolute', right: 0, zIndex: 1050 }}>
          {extra?.map((a) => (
            <li key={a.label}>
              <button className="dropdown-item small" onClick={() => { a.onClick(); setOpen(false); }}>
                {a.icon && <i className={`bi ${a.icon} me-2`}></i>}
                {a.label}
              </button>
            </li>
          ))}
          {toggleAction && onToggle && (
            <li>
              <button className="dropdown-item small" onClick={() => { onToggle(); setOpen(false); }}>
                <i className="bi bi-arrow-repeat me-2"></i>
                {toggleAction}
              </button>
            </li>
          )}
          {onDelete && (
            <li>
              <button className="dropdown-item small text-danger" onClick={() => { onDelete(); setOpen(false); }}>
                <i className="bi bi-trash me-2"></i>
                Delete
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
