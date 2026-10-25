interface StatusBadgeProps {
  status: string;
  type?: 'payment' | 'refund' | 'merchant' | 'provider' | 'settlement' | 'application' | 'default';
  size?: 'sm' | 'md' | 'lg';
}

export type StatusTone = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'primary';

const TONES: Record<StatusTone, string[]> = {
  success: ['active', 'succeeded', 'success', 'completed', 'complete', 'approved', 'paid', 'reconciled', 'connected', 'resolved', 'healthy', 'operational', 'enabled', 'on', 'verified', 'live', 'passed', 'delivered', 'settled', 'online', 'compliant', 'up', 'granted', 'published', 'won', 'low'],
  danger: ['failed', 'failure', 'rejected', 'suspended', 'blocked', 'unavailable', 'exception', 'critical', 'error', 'down', 'declined', 'revoked', 'lost', 'breach', 'terminated', 'fraud', 'high', 'exhausted', 'overdue', 'denied', 'locked', 'banned'],
  warning: ['pending', 'pendingreview', 'pendingapproval', 'underreview', 'review', 'degraded', 'restricted', 'warning', 'medium', 'awaiting', 'processing', 'investigating', 'escalated', 'open', 'additionalinformationrequired', 'expiring', 'atrisk', 'partial', 'onhold', 'paused', 'flagged', 'retrying', 'due', 'draft'],
  info: ['created', 'requested', 'submitted', 'expected', 'sandbox', 'scheduled', 'new', 'invited', 'test', 'beta', 'inprogress', 'queued', 'running', 'testing', 'monitoring', 'info', 'rollout'],
  primary: ['superadmin', 'admin', 'owner', 'primary', 'default'],
  neutral: ['inactive', 'cancelled', 'canceled', 'expired', 'closed', 'disabled', 'off', 'planned', 'archived', 'deprecated', 'none', 'n/a'],
};

export function statusTone(status: string): StatusTone {
  const n = String(status ?? '').toLowerCase().replace(/[_\s-]/g, '');
  for (const tone of Object.keys(TONES) as StatusTone[]) {
    if (TONES[tone].includes(n)) return tone;
  }
  for (const tone of ['danger', 'warning', 'success', 'info'] as StatusTone[]) {
    if (TONES[tone].some((k) => k.length > 3 && n.includes(k))) return tone;
  }
  return 'neutral';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const label = String(status ?? '');
  const tone = statusTone(label);
  return (
    <span className={`zp-badge zp-badge-${tone} ${size === 'lg' ? 'zp-badge-lg' : ''}`}>
      <span className="zp-badge-dot" />
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </span>
  );
}
