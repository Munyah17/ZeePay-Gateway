'use client';
/* eslint-disable @typescript-eslint/no-explicit-any -- generic record utilities operate on arbitrary row shapes */

import StatusBadge from '@/components/StatusBadge';
import { Drawer } from './Modal';
import type { FieldDef } from './RecordForm';
import { useActivity, timeAgo } from '@/lib/store/activity';
import { humanize } from '@/lib/export';

export interface StatusTransition {
  label: string;
  icon: string;
  next: string;
  tone?: 'success' | 'danger' | 'warning';
  confirm?: boolean;
  requireReason?: boolean;
}

const norm = (s: unknown) => String(s ?? '').toLowerCase().replace(/[_\s-]/g, '');

/** Sensible lifecycle actions for any status value (merchant, ticket, payment, rule, staff…). */
export function statusTransitions(status: unknown): StatusTransition[] {
  const s = norm(status);
  if (!s) return [];
  if (['active', 'enabled', 'on', 'live', 'connected', 'operational', 'healthy', 'approved', 'verified', 'published'].includes(s))
    return [
      { label: 'Suspend', icon: 'bi-pause-circle', next: 'Suspended', tone: 'warning', confirm: true, requireReason: true },
      { label: 'Deactivate', icon: 'bi-slash-circle', next: 'Inactive', tone: 'danger', confirm: true },
    ];
  if (['suspended', 'inactive', 'disabled', 'off', 'paused', 'blocked', 'locked', 'restricted', 'revoked', 'closed', 'archived', 'planned'].includes(s))
    return [{ label: 'Activate', icon: 'bi-play-circle', next: 'Active', tone: 'success', confirm: true }];
  if (['pending', 'pendingreview', 'pendingapproval', 'underreview', 'review', 'submitted', 'awaiting', 'requested', 'new', 'draft', 'additionalinformationrequired', 'flagged', 'invited', 'onhold'].includes(s))
    return [
      { label: 'Approve', icon: 'bi-check2-circle', next: 'Approved', tone: 'success', confirm: true },
      { label: 'Request info', icon: 'bi-chat-left-dots', next: 'Additional information required', requireReason: true, confirm: true },
      { label: 'Reject', icon: 'bi-x-circle', next: 'Rejected', tone: 'danger', confirm: true, requireReason: true },
    ];
  if (['open', 'investigating', 'escalated', 'inprogress', 'degraded', 'warning', 'critical', 'high', 'medium', 'exception'].includes(s))
    return [
      { label: 'Mark resolved', icon: 'bi-check2-all', next: 'Resolved', tone: 'success', confirm: true },
      { label: 'Escalate', icon: 'bi-arrow-up-circle', next: 'Escalated', tone: 'warning', requireReason: true, confirm: true },
    ];
  if (['failed', 'error', 'exhausted', 'declined', 'unavailable'].includes(s))
    return [
      { label: 'Retry', icon: 'bi-arrow-repeat', next: 'Processing', confirm: true },
      { label: 'Mark resolved', icon: 'bi-check2-all', next: 'Resolved', tone: 'success', confirm: true },
    ];
  if (['rejected', 'cancelled', 'canceled', 'expired', 'resolved', 'completed', 'succeeded'].includes(s))
    return [{ label: 'Reopen', icon: 'bi-arrow-counterclockwise', next: 'Open', confirm: true }];
  if (['processing', 'scheduled', 'queued', 'running'].includes(s))
    return [{ label: 'Cancel', icon: 'bi-x-octagon', next: 'Cancelled', tone: 'danger', confirm: true }];
  return [];
}

const STATUS_KEYS = ['status', 'state', 'result', 'health', 'stage'];
export function findStatusKey(keys: string[], badgeKeys: string[] = []): string | undefined {
  return badgeKeys.find((k) => STATUS_KEYS.includes(k.toLowerCase())) || keys.find((k) => STATUS_KEYS.includes(k.toLowerCase())) || badgeKeys[0];
}

/** Build form fields from table columns + sample rows (type, options) so any table becomes editable. */
export function inferFields(columns: { key: string; label: string; badge?: boolean }[], rows: Record<string, any>[]): FieldDef[] {
  return columns.map((c) => {
    const k = c.key.toLowerCase();
    const values = Array.from(new Set(rows.map((r) => r[c.key]).filter((v) => v !== undefined && v !== null && v !== '').map(String)));
    const allNumeric = rows.length > 0 && rows.every((r) => typeof r[c.key] === 'number');
    let type: FieldDef['type'] = 'text';
    if (k.includes('email')) type = 'email';
    else if (k.includes('phone') || k.includes('msisdn') || k.includes('mobile')) type = 'tel';
    else if (k.includes('url') || k.includes('endpoint') || k.includes('website')) type = 'url';
    else if (allNumeric) type = 'number';
    else if (k.includes('description') || k.includes('detail') || k.includes('notes') || k.includes('message') || k.includes('reason') || k.includes('comment')) type = 'textarea';
    const lowCardinality = values.length > 0 && values.length <= 8 && rows.length >= 2;
    const isEnum = c.badge || (lowCardinality && type === 'text' && values.every((v) => v.length < 32));
    const required = rows.length > 0 && rows.every((r) => r[c.key] !== undefined && r[c.key] !== '' && r[c.key] !== null) && (k.includes('name') || k === 'title' || k.includes('email'));
    return {
      key: c.key,
      label: c.label,
      type: isEnum ? 'select' : type,
      options: isEnum ? values : undefined,
      creatable: isEnum ? !c.badge : undefined,
      required,
    } as FieldDef;
  });
}

export function initials(name: string): string {
  return String(name || '?')
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const palette = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
  const idx = String(name).split('').reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length;
  return (
    <span className="zp-avatar" style={{ width: size, height: size, background: palette[idx], fontSize: size * 0.38 }}>
      {initials(name)}
    </span>
  );
}

interface RecordDrawerProps {
  open: boolean;
  onClose: () => void;
  record: Record<string, any> | null;
  title?: string;
  subtitle?: string;
  icon?: string;
  fields?: { key: string; label: string; badge?: boolean }[];
  actions?: React.ReactNode;
  scope?: string;
  children?: React.ReactNode;
}

/** Read-only record view with field list + per-record activity timeline. */
export function RecordDrawer({ open, onClose, record, title, subtitle, icon = 'bi-card-text', fields, actions, scope, children }: RecordDrawerProps) {
  const history = useActivity((a) => !!record && a.recordId === record._id && (!scope || a.scope === scope));
  if (!record) return null;
  const list =
    fields ||
    Object.keys(record)
      .filter((k) => !k.startsWith('_'))
      .map((k) => ({ key: k, label: humanize(k), badge: STATUS_KEYS.includes(k.toLowerCase()) }));
  const statusKey = findStatusKey(list.map((f) => f.key), list.filter((f) => f.badge).map((f) => f.key));
  return (
    <Drawer open={open} onClose={onClose} title={title || String(record.name ?? record.title ?? record.id ?? 'Record')} subtitle={subtitle} icon={icon} footer={actions}>
      {statusKey && record[statusKey] !== undefined && (
        <div className="mb-3">
          <StatusBadge status={String(record[statusKey])} size="lg" />
        </div>
      )}
      <dl className="zp-dl">
        {list.map((f) => (
          <div key={f.key} className="zp-dl-row">
            <dt>{f.label}</dt>
            <dd>{f.badge ? <StatusBadge status={String(record[f.key] ?? '—')} /> : record[f.key] === '' || record[f.key] === undefined ? '—' : String(record[f.key])}</dd>
          </div>
        ))}
        {record._createdAt && (
          <div className="zp-dl-row">
            <dt>Created</dt>
            <dd>{new Date(record._createdAt).toLocaleString()}</dd>
          </div>
        )}
        {record._updatedAt && (
          <div className="zp-dl-row">
            <dt>Last updated</dt>
            <dd>{new Date(record._updatedAt).toLocaleString()}</dd>
          </div>
        )}
      </dl>
      {children}
      <h6 className="zp-section-title mt-4">Activity</h6>
      {history.length === 0 ? (
        <p className="small text-muted">No changes recorded yet. Edits, status changes and notes will appear here.</p>
      ) : (
        <ul className="zp-timeline">
          {history.slice(0, 20).map((h) => (
            <li key={h.id} className={`zp-tl-${h.tone || 'info'}`}>
              <div className="small fw-semibold">{h.action}</div>
              <div className="small text-muted">
                {h.actor} · {timeAgo(h.at)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
