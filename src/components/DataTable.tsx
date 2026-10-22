'use client';

import { useState } from 'react';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface FilterOption {
  value: string;
  label: string;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  searchable?: boolean;
  searchableFields?: string[];
  filters?: { key: string; label: string; options: FilterOption[] }[];
  sortable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
  rowActions?: (row: any) => React.ReactNode;
}

export default function DataTable({
  columns,
  data,
  searchable = true,
  searchableFields,
  filters,
  sortable = true,
  paginated = true,
  pageSize = 10,
  emptyMessage = 'No data available',
  onRowClick,
  rowActions,
}: DataTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter and search data
  const filteredData = data.filter((row) => {
    // Search filter
    if (searchQuery && searchableFields) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchableFields.some((field) => {
        const value = row[field];
        return value && String(value).toLowerCase().includes(searchLower);
      });
      if (!matchesSearch) return false;
    }

    // Column filters
    for (const [key, value] of Object.entries(activeFilters)) {
      if (value && row[key] !== value) return false;
    }

    return true;
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    
    if (aVal === bVal) return 0;
    
    const comparison = aVal < bVal ? -1 : 1;
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = paginated 
    ? sortedData.slice(startIndex, startIndex + pageSize)
    : sortedData;

  const handleSort = (column: string) => {
    if (!sortable) return;
    
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearchQuery('');
    setSortColumn(null);
    setCurrentPage(1);
  };

  return (
    <div className="data-table">
      {/* Search and Filters */}
      {(searchable || filters) && (
        <div className="card mb-3">
          <div className="card-body">
            <div className="row g-3">
              {searchable && (
                <div className="col-md-4">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </div>
              )}
              {filters?.map((filter) => (
                <div className="col-md-3" key={filter.key}>
                  <select
                    className="form-select form-select-sm"
                    value={activeFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  >
                    <option value="">{filter.label}</option>
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              {(searchQuery || Object.keys(activeFilters).some((k) => activeFilters[k])) && (
                <div className="col-md-auto">
                  <button className="btn btn-sm btn-outline-secondary" onClick={clearFilters}>
                    <i className="bi bi-x-circle me-1"></i>
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={sortable && column.sortable ? 'cursor-pointer user-select-none' : ''}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="d-flex align-items-center gap-2">
                        {column.label}
                        {sortable && column.sortable && (
                          <i
                            className={`bi ${
                              sortColumn === column.key
                                ? sortDirection === 'asc'
                                  ? 'bi-sort-up'
                                  : 'bi-sort-down'
                                : 'bi-arrow-down-up'
                            } small text-muted`}
                          ></i>
                        )}
                      </div>
                    </th>
                  ))}
                  {rowActions && <th className="text-end">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + (rowActions ? 1 : 0)} className="text-center py-5">
                      <div className="text-muted">
                        <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                        {emptyMessage}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, index) => (
                    <tr
                      key={index}
                      className={onRowClick ? 'cursor-pointer' : ''}
                      onClick={() => onRowClick && onRowClick(row)}
                    >
                      {columns.map((column) => (
                        <td key={column.key}>
                          {column.render ? column.render(row[column.key], row) : row[column.key]}
                        </td>
                      ))}
                      {rowActions && <td className="text-end">{rowActions(row)}</td>}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {paginated && totalPages > 1 && (
          <div className="card-footer d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, sortedData.length)} of{' '}
              {sortedData.length} entries
            </small>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  >
                    Previous
                  </button>
                </li>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(pageNum)}>
                        {pageNum}
                      </button>
                    </li>
                  );
                })}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
