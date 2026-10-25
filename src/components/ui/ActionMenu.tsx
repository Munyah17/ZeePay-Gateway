'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface MenuAction {
  label: string;
  icon?: string;
  onClick: () => void;
  tone?: 'danger' | 'success' | 'warning';
  divider?: boolean;
  disabled?: boolean;
  hidden?: boolean;
}

interface ActionMenuProps {
  actions: MenuAction[];
  label?: React.ReactNode;
  buttonClassName?: string;
  align?: 'start' | 'end';
  ariaLabel?: string;
}

export default function ActionMenu({ actions, label, buttonClassName, align = 'end', ariaLabel = 'More actions' }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const r = btn.current.getBoundingClientRect();
    const mw = menu.current?.offsetWidth || 200;
    const mh = menu.current?.offsetHeight || 0;
    let top = r.bottom + 6;
    if (top + mh > window.innerHeight - 8) top = Math.max(8, r.top - mh - 6);
    const left = align === 'end' ? Math.max(8, r.right - mw) : Math.min(r.left, window.innerWidth - mw - 8);
    setPos({ top, left });
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (menu.current?.contains(e.target as Node) || btn.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', () => setOpen(false), { once: true, capture: true });
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const visible = actions.filter((a) => !a.hidden);

  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        className={buttonClassName || 'btn btn-sm zp-icon-btn'}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        {label || <i className="bi bi-three-dots-vertical"></i>}
      </button>
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div ref={menu} className="zp-menu" style={{ top: pos.top, left: pos.left }} role="menu" onClick={(e) => e.stopPropagation()}>
            {visible.map((a, i) => (
              <div key={a.label + i}>
                {a.divider && i > 0 && <div className="zp-menu-divider" />}
                <button
                  type="button"
                  role="menuitem"
                  disabled={a.disabled}
                  className={`zp-menu-item ${a.tone ? `text-${a.tone}` : ''}`}
                  onClick={() => {
                    setOpen(false);
                    a.onClick();
                  }}
                >
                  {a.icon && <i className={`bi ${a.icon}`}></i>}
                  <span>{a.label}</span>
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
