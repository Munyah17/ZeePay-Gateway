'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';

export interface PageStat {
  label: string;
  value: string | number;
  tone?: 'success' | 'danger' | 'warning' | 'info' | 'primary';
  sub?: string;
}

export interface PageConfig {
  title: string;
  description: string;
  stats?: PageStat[];
  alert?: { tone: 'danger' | 'warning' | 'info' | 'success'; message: string };
  table?: {
    title: string;
    columns: { key: string; label: string; sortable?: boolean; badge?: boolean }[];
    rows: Record<string, string | number>[];
    searchableFields?: string[];
    filterKey?: string;
    filterLabel?: string;
    actions?: boolean;
  };
  panels?: {
    title: string;
    description?: string;
    items: { label: string; value?: string; badge?: string }[];
  }[];
}

const toneClasses: Record<string, string> = {
  success: 'text-success',
  danger: 'text-danger',
  warning: 'text-warning',
  info: 'text-info',
  primary: 'text-primary',
};

export default function ConfigPage({ config }: { config: PageConfig }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

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

  const { title, description, stats, alert, table, panels } = config;

  return (
    <>
      <div className="mb-4">
        <h2 className="h4">{title}</h2>
        <p className="text-muted">{description}</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {alert && (
            <div className={`alert alert-${alert.tone} mb-4`} role="alert">
              <div className="d-flex align-items-center gap-3">
                <i className="bi bi-exclamation-triangle-fill fs-4"></i>
                <div>{alert.message}</div>
              </div>
            </div>
          )}

          {stats && stats.length > 0 && (
            <div className="row g-3 mb-4">
              {stats.map((stat) => (
                <div className="col-md-3" key={stat.label}>
                  <div className="card h-100">
                    <div className="card-body">
                      <p className="text-muted small mb-1">{stat.label}</p>
                      <p className={`h3 mb-0 ${stat.tone ? toneClasses[stat.tone] : ''}`}>{stat.value}</p>
                      {stat.sub && <small className="text-muted">{stat.sub}</small>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {panels && panels.length > 0 && (
            <div className="row g-4 mb-4">
              {panels.map((panel) => (
                <div className="col-md-6" key={panel.title}>
                  <div className="card h-100">
                    <div className="card-header">
                      <h5 className="card-title mb-0">{panel.title}</h5>
                      {panel.description && <small className="text-muted">{panel.description}</small>}
                    </div>
                    <div className="card-body">
                      <ul className="list-group list-group-flush">
                        {panel.items.map((item) => (
                          <li key={item.label} className="list-group-item d-flex justify-content-between align-items-center px-0">
                            <span className="small">{item.label}</span>
                            {item.badge ? (
                              <StatusBadge status={item.badge} type="default" size="sm" />
                            ) : (
                              <span className="small text-muted">{item.value}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {table && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="card-title mb-0">{table.title}</h5>
              </div>
              <div className="card-body">
                <DataTable
                  columns={table.columns.map((col) => ({
                    key: col.key,
                    label: col.label,
                    sortable: col.sortable !== false,
                    render: col.badge
                      ? (value: any) => <StatusBadge status={String(value)} type="default" size="sm" />
                      : undefined,
                  }))}
                  data={table.rows}
                  searchable
                  searchableFields={table.searchableFields}
                  filters={
                    table.filterKey
                      ? [{
                          key: table.filterKey,
                          label: table.filterLabel || 'All',
                          options: Array.from(new Set(table.rows.map((r) => String(r[table.filterKey!]))))
                            .map((v) => ({ value: v, label: v })),
                        }]
                      : undefined
                  }
                  rowActions={
                    table.actions !== false
                      ? () => <button className="btn btn-sm btn-outline-primary">View</button>
                      : undefined
                  }
                />
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
