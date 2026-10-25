'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: string;
}

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
}

export default function Modal({ open, onClose, title, subtitle, children, footer, size = 'md', icon }: ModalProps) {
  useEscape(open, onClose);
  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className="zp-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`zp-modal zp-modal-${size}`} role="dialog" aria-modal="true">
        <div className="zp-modal-header">
          <div className="d-flex align-items-center gap-3">
            {icon && (
              <span className="zp-icon-chip">
                <i className={`bi ${icon}`}></i>
              </span>
            )}
            <div>
              <h5 className="mb-0">{title}</h5>
              {subtitle && <div className="small text-muted">{subtitle}</div>}
            </div>
          </div>
          <button className="btn-close" aria-label="Close" onClick={onClose}></button>
        </div>
        <div className="zp-modal-body">{children}</div>
        {footer && <div className="zp-modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ open, onClose, title, subtitle, children, footer, icon, width = 520 }: Omit<ModalProps, 'size'> & { width?: number }) {
  useEscape(open, onClose);
  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className="zp-overlay zp-overlay-drawer" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="zp-drawer" style={{ width: `min(${width}px, 100vw)` }} role="dialog" aria-modal="true">
        <div className="zp-modal-header">
          <div className="d-flex align-items-center gap-3 min-w-0">
            {icon && (
              <span className="zp-icon-chip">
                <i className={`bi ${icon}`}></i>
              </span>
            )}
            <div className="min-w-0">
              <h5 className="mb-0 text-truncate">{title}</h5>
              {subtitle && <div className="small text-muted">{subtitle}</div>}
            </div>
          </div>
          <button className="btn-close" aria-label="Close" onClick={onClose}></button>
        </div>
        <div className="zp-drawer-body">{children}</div>
        {footer && <div className="zp-modal-footer">{footer}</div>}
      </aside>
    </div>,
    document.body,
  );
}
