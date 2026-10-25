'use client';
/* eslint-disable @typescript-eslint/no-explicit-any -- generic record utilities operate on arbitrary row shapes */

import { useEffect, useMemo, useState } from 'react';
import ActionMenu from '@/components/ui/ActionMenu';
import { exportCSV, exportExcel, exportJSON, printTable } from '@/lib/export';

export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  hidden?: boolean;
  align?: 'start' | 'end' | 'center';
  render?: (value: any, row: any) => React.ReactNode;
}

interface FilterOption {
  value: string;
  label: string;
}

export interface BulkAction {
  label: string;
  icon?: string;
  tone?: 'danger' | 'success' | 'warning' | 'primary';
  onClick: (rows: any[]) => void;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  title?: string;
  subtitle?: string;
  searchable?: boolean;
  searchableFields?: string[];
  filters?: { key: string; label: string; options: FilterOption[] }[];
  sortable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  onRowClick?: (row: any) => void;
  rowActions?: (row: any) => React.ReactNode;
  selectable?: boolean;
  bulkActions?: BulkAction[];
  toolbarActions?: React.ReactNode;
  exportable?: boolean;
  exportName?: string;
  rowKey?: (row: any, index: number) => string;
  loading?: boolean;
}

const sortValue = (v: any) => {
  if (typeof v === 'number') return v;
  const s = String(v ?? '');
  const num = Number(s.replace(/[$,%\s]|ms|USD|ZWG/gi, ''));
  return s !== '' && !Number.isNaN(num) ? num : s.toLowerCase();
};

export default function DataTable({
  columns,
  data,
  title,
  subtitle,
  searchable = true,
  searchableFields,
  filters,
  sortable = true,
  paginated = true,
  pageSize: initialPageSize = 10,
  emptyMessage = 'No records found',
  emptyAction,
  onRowClick,
  rowActions,
  selectable = false,
  bulkActions,
  toolbarActions,
  exportable = true,
  exportName,
  rowKey,
  loading = false,
}: DataTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(() => new Set(columns.filter((c) => c.hidden).map((c) => c.key)));
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const keyOf = (row: any, i: number) => (rowKey ? rowKey(row, i) : String(row._id ?? row.id ?? i));
  const visibleColumns = columns.filter((c) => !hiddenCols.has(c.key));
  const fields = searchableFields && searchableFields.length ? searchableFields : columns.map((c) => c.key);

  const filteredData = useMemo(
    () =>
      data.filter((row) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!fields.some((f) => row[f] !== undefined && row[f] !== null && String(row[f]).toLowerCase().includes(q))) return false;
        }
        for (const [key, value] of Object.entries(activeFilters)) {
          if (value && String(row[key]) !== value) return false;
        }
        return true;
      }),
    [data, searchQuery, activeFilters, fields],
  );

  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    return [...filteredData].sort((a, b) => {
      const av = sortValue(a[sortColumn]);
      const bv = sortValue(b[sortColumn]);
      if (av === bv) return 0;
      const cmp = av < bv ? -1 : 1;
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * pageSize;
  const pageData = paginated ? sortedData.slice(startIndex, startIndex + pageSize) : sortedData;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected((prev) => {
      const valid = new Set(data.map((r, i) => keyOf(r, i)));
      const next = new Set([...prev].filter((k) => valid.has(k)));
      return next.size === prev.size ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const hasActiveFilters = !!searchQuery || Object.values(activeFilters).some(Boolean);
  const clearFilters = () => {
    setActiveFilters({});
    setSearchQuery('');
    setCurrentPage(1);
  };

  const pageKeys = pageData.map((r) => keyOf(r, data.indexOf(r)));
  const allOnPageSelected = pageKeys.length > 0 && pageKeys.every((k) => selected.has(k));
  const selectedRows = data.filter((r, i) => selected.has(keyOf(r, i)));
  const exportCols = visibleColumns.map((c) => ({ key: c.key, label: c.label }));
  const name = exportName || title || 'export';
  const exportRows = selectedRows.length ? selectedRows : sortedData;
  const showSelect = selectable || !!bulkActions?.length;

  return (
    <div className="zp-table-card">
      {(title || toolbarActions) && (
        <div className="zp-table-head">
          <div className="min-w-0">
            {title && <h5 className="mb-0 fw-semibold">{title}</h5>}
            <div className="small text-muted">{subtitle || `${sortedData.length} of ${data.length} record${data.length === 1 ? '' : 's'}`}</div>
          </div>
          <div className="d-flex gap-2 flex-wrap">{toolbarActions}</div>
        </div>
      )}

      <div className="zp-table-toolbar">
        {searchable && (
          <div className="zp-search">
            <i className="bi bi-search"></i>
            <input
              type="search"
              className="form-control form-control-sm"
              placeholder="Search records…"
              aria-label="Search records"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
        {filters?.map((filter) => (
          <select
            key={filter.key}
            className="form-select form-select-sm zp-filter"
            aria-label={filter.label}
            value={activeFilters[filter.key] || ''}
            onChange={(e) => {
              setActiveFilters((p) => ({ ...p, [filter.key]: e.target.value }));
              setCurrentPage(1);
            }}
          >
            <option value="">{filter.label}</option>
            {filter.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ))}
        {hasActiveFilters && (
          <button className="btn btn-sm btn-link text-decoration-none" onClick={clearFilters}>
            <i className="bi bi-x-circle me-1"></i>Clear
          </button>
        )}
        <div className="ms-auto d-flex gap-2">
          <ActionMenu
            buttonClassName="btn btn-sm btn-outline-secondary"
            label={<><i className="bi bi-layout-three-columns me-1"></i><span className="d-none d-sm-inline">Columns</span></>}
            ariaLabel="Toggle columns"
            actions={columns.map((c) => ({
              label: c.label,
              icon: hiddenCols.has(c.key) ? 'bi-square' : 'bi-check-square-fill',
              onClick: () =>
                setHiddenCols((p) => {
                  const n = new Set(p);
                  if (n.has(c.key)) n.delete(c.key);
                  else if (columns.length - n.size > 1) n.add(c.key);
                  return n;
                }),
            }))}
          />
          {exportable && (
            <ActionMenu
              buttonClassName="btn btn-sm btn-outline-secondary"
              label={<><i className="bi bi-download me-1"></i><span className="d-none d-sm-inline">Export</span></>}
              ariaLabel="Export"
              actions={[
                { label: `CSV${selectedRows.length ? ` (${selectedRows.length} selected)` : ''}`, icon: 'bi-filetype-csv', onClick: () => exportCSV(name, exportRows, exportCols) },
                { label: 'Excel', icon: 'bi-file-earmark-excel', onClick: () => exportExcel(name, exportRows, exportCols) },
                { label: 'JSON', icon: 'bi-filetype-json', onClick: () => exportJSON(name, exportRows) },
                { label: 'Print / PDF', icon: 'bi-printer', divider: true, onClick: () => printTable(name, exportRows, exportCols) },
              ]}
            />
          )}
        </div>
      </div>

      {showSelect && selectedRows.length > 0 && (
        <div className="zp-bulkbar">
          <span className="fw-semibold">{selectedRows.length} selected</span>
          <div className="d-flex gap-2 flex-wrap">
            {bulkActions?.map((a) => (
              <button key={a.label} className={`btn btn-sm btn-${a.tone ? `outline-${a.tone}` : 'light'}`} onClick={() => a.onClick(selectedRows)}>
                {a.icon && <i className={`bi ${a.icon} me-1`}></i>}
                {a.label}
              </button>
            ))}
            <button className="btn btn-sm btn-link text-decoration-none" onClick={() => setSelected(new Set())}>Clear selection</button>
          </div>
        </div>
      )}

      <div className="table-responsive">
        <table className="table zp-table align-middle mb-0">
          <thead>
            <tr>
              {showSelect && (
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    aria-label="Select all on page"
                    checked={allOnPageSelected}
                    onChange={() =>
                      setSelected((p) => {
                        const n = new Set(p);
                        pageKeys.forEach((k) => (allOnPageSelected ? n.delete(k) : n.add(k)));
                        return n;
                      })
                    }
                  />
                </th>
              )}
              {visibleColumns.map((column) => {
                const canSort = sortable && column.sortable !== false;
                return (
                  <th
                    key={column.key}
                    className={`${canSort ? 'zp-sortable' : ''} text-${column.align || 'start'}`}
                    onClick={() => canSort && handleSort(column.key)}
                    aria-sort={sortColumn === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    <span className="d-inline-flex align-items-center gap-1">
                      {column.label}
                      {canSort && (
                        <i className={`bi ${sortColumn === column.key ? (sortDirection === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill') : 'bi-chevron-expand'} zp-sort-icon`}></i>
                      )}
                    </span>
                  </th>
                );
              })}
              {rowActions && <th className="text-end">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={visibleColumns.length + (rowActions ? 1 : 0) + (showSelect ? 1 : 0)}>
                    <div className="zp-skeleton" />
                  </td>
                </tr>
              ))
            ) : pageData.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + (rowActions ? 1 : 0) + (showSelect ? 1 : 0)} className="text-center py-5">
                  <div className="zp-empty">
                    <i className="bi bi-inbox"></i>
                    <div className="fw-semibold">{hasActiveFilters ? 'No matching records' : emptyMessage}</div>
                    {hasActiveFilters ? (
                      <button className="btn btn-sm btn-outline-primary mt-2" onClick={clearFilters}>Clear filters</button>
                    ) : (
                      emptyAction
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              pageData.map((row) => {
                const k = keyOf(row, data.indexOf(row));
                return (
                  <tr
                    key={k}
                    className={`${onRowClick ? 'zp-clickable' : ''} ${selected.has(k) ? 'zp-row-selected' : ''}`}
                    onClick={() => onRowClick?.(row)}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={(e) => onRowClick && e.key === 'Enter' && onRowClick(row)}
                  >
                    {showSelect && (
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          aria-label="Select row"
                          checked={selected.has(k)}
                          onChange={() =>
                            setSelected((p) => {
                              const n = new Set(p);
                              if (n.has(k)) n.delete(k);
                              else n.add(k);
                              return n;
                            })
                          }
                        />
                      </td>
                    )}
                    {visibleColumns.map((column) => (
                      <td key={column.key} className={`text-${column.align || 'start'}`}>
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="text-end text-nowrap" onClick={(e) => e.stopPropagation()}>
                        {rowActions(row)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {paginated && sortedData.length > 0 && (
        <div className="zp-table-foot">
          <div className="d-flex align-items-center gap-2 small text-muted">
            <span>
              {startIndex + 1}–{Math.min(startIndex + pageSize, sortedData.length)} of {sortedData.length}
            </span>
            <select
              className="form-select form-select-sm w-auto"
              aria-label="Rows per page"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {[5, 10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
          </div>
          {totalPages > 1 && (
            <nav aria-label="Pagination">
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" aria-label="Previous" onClick={() => setCurrentPage(Math.max(1, page - 1))}>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let n = i + 1;
                  if (totalPages > 5) {
                    if (page > 3 && page < totalPages - 2) n = page - 2 + i;
                    else if (page >= totalPages - 2) n = totalPages - 4 + i;
                  }
                  return (
                    <li key={n} className={`page-item ${page === n ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(n)}>{n}</button>
                    </li>
                  );
                })}
                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" aria-label="Next" onClick={() => setCurrentPage(Math.min(totalPages, page + 1))}>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
