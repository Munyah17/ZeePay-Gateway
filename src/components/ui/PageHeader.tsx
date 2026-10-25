'use client';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, description, icon, actions }: PageHeaderProps) {
  return (
    <div className="zp-page-header">
      <div className="d-flex align-items-center gap-3 min-w-0">
        {icon && (
          <span className="zp-icon-chip zp-icon-chip-lg">
            <i className={`bi ${icon}`}></i>
          </span>
        )}
        <div className="min-w-0">
          <h1 className="zp-page-title">{title}</h1>
          {description && <p className="zp-page-desc">{description}</p>}
        </div>
      </div>
      {actions && <div className="zp-page-actions">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  tone,
  icon,
  onClick,
  active,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: 'success' | 'danger' | 'warning' | 'info' | 'primary';
  icon?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} className={`zp-stat ${onClick ? 'zp-stat-click' : ''} ${active ? 'zp-stat-active' : ''}`} onClick={onClick}>
      <div className="d-flex justify-content-between align-items-start">
        <span className="zp-stat-label">{label}</span>
        {icon && (
          <span className={`zp-stat-icon zp-tone-${tone || 'primary'}`}>
            <i className={`bi ${icon}`}></i>
          </span>
        )}
      </div>
      <div className={`zp-stat-value ${tone ? `text-${tone}` : ''}`}>{value}</div>
      {sub && <div className="zp-stat-sub">{sub}</div>}
    </Tag>
  );
}
