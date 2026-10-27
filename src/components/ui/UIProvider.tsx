'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Modal from './Modal';

type Tone = 'success' | 'danger' | 'warning' | 'info';
interface ToastItem {
  id: number;
  tone: Tone;
  title: string;
  message?: string;
}
interface ConfirmOptions {
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  tone?: 'danger' | 'primary' | 'warning' | 'success';
  requireReason?: boolean;
  reasonLabel?: string;
}
type ToastOptions = Tone | { tone?: Tone; message?: string };
interface UIContextValue {
  toast: (title: string, opts?: ToastOptions) => void;
  confirm: (opts: ConfirmOptions) => Promise<false | { reason: string }>;
}

const UIContext = createContext<UIContextValue | null>(null);

const toneIcon: Record<Tone, string> = {
  success: 'bi-check-circle-fill',
  danger: 'bi-x-octagon-fill',
  warning: 'bi-exclamation-triangle-fill',
  info: 'bi-info-circle-fill',
};

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);
  const [reason, setReason] = useState('');
  const resolver = useRef<((v: false | { reason: string }) => void) | null>(null);
  const counter = useRef(0);

  const toast = useCallback<UIContextValue['toast']>((title, opts = 'success') => {
    const id = ++counter.current;
    const tone = typeof opts === 'string' ? opts : opts.tone || 'success';
    const message = typeof opts === 'object' ? opts.message : undefined;
    setToasts((t) => [...t, { id, title, tone, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const confirm = useCallback<UIContextValue['confirm']>((opts) => {
    setReason('');
    setConfirmState(opts);
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (v: false | { reason: string }) => {
    resolver.current?.(v);
    resolver.current = null;
    setConfirmState(null);
  };

  return (
    <UIContext.Provider value={{ toast, confirm }}>
      {children}
      <div className="zp-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`zp-toast zp-toast-${t.tone}`} role="status">
            <i className={`bi ${toneIcon[t.tone]}`}></i>
            <div className="flex-grow-1">
              <div className="fw-semibold">{t.title}</div>
              {t.message && <div className="small opacity-75">{t.message}</div>}
            </div>
            <button className="btn-close btn-close-sm" aria-label="Dismiss" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}></button>
          </div>
        ))}
      </div>
      <Modal
        open={!!confirmState}
        onClose={() => close(false)}
        title={confirmState?.title || ''}
        size="sm"
        footer={
          <>
            <button className="btn btn-light" onClick={() => close(false)}>Cancel</button>
            <button
              className={`btn btn-${confirmState?.tone || 'primary'}`}
              disabled={!!confirmState?.requireReason && !reason.trim()}
              onClick={() => close({ reason })}
            >
              {confirmState?.confirmLabel || 'Confirm'}
            </button>
          </>
        }
      >
        {confirmState?.message && <div className="text-muted">{confirmState.message}</div>}
        {confirmState?.requireReason && (
          <div className="mt-3">
            <label className="form-label small fw-semibold">{confirmState.reasonLabel || 'Reason'}</label>
            <textarea className="form-control" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
          </div>
        )}
      </Modal>
    </UIContext.Provider>
  );
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) {
    return {
      toast: (title) => console.info(title),
      confirm: async (o) => (window.confirm(o.title) ? { reason: '' } : false),
    };
  }
  return ctx;
}

export const useToast = () => useUI().toast;
export const useConfirm = () => useUI().confirm;
