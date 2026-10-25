'use client';

import { useState, useEffect, useMemo } from 'react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Modal, ConfirmDialog, RecordActions, toast } from '@/components/ui';
import { statusToggleAction } from '@/utils/actions';
import type { PageConfig } from '@/components/ConfigPage';

type Row = Record<string, string | number>;

function storageKey(title: string) {
  return `zeepay_table_${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
}

/**
 * Stateful wrapper around DataTable for ConfigPage-driven pages.
 * Provides View / Edit / Add / Delete / status-toggle / bulk-delete /
 * CSV export / print, persisting edits to localStorage.
 */
export default function InteractiveTable({
  table,
  pageTitle,
}: {
  table: NonNullable<PageConfig['table']>;
  pageTitle: string;
}) {
  const key = storageKey(`${pageTitle}_${table.title}`);
  const [rows, setRows] = useState<Row[]>(table.rows);
  const [hydrated, setHydrated] = useState(false);

  const [viewing, setViewing] = useState<Row | null>(null);
  const [editing, setEditing] = useState<{ row: Row; draft: Row } | null>(null);
  const [adding, setAdding] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [toggling, setToggling] = useState<{ row: Row; next: string; action: string } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Row[]>([]);
  const [bulkDelete, setBulkDelete] = useState(false);

  // Hydrate persisted edits on mount (deferred — keeps server markup stable)
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved) as Row[];
          if (Array.isArray(parsed)) setRows(parsed);
        }
      } catch {
        /* corrupted storage — fall back to config rows */
      }
      setHydrated(true);
    }, 0);
    return () => clearTimeout(t);
  }, [key]);

  const persist = (next: Row[]) => {
    setRows(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* storage full */
    }
  };

  const statusKey = useMemo(() => {
    if (table.statusKey) return table.statusKey;
    const col = table.columns.find((c) => c.badge);
    return col?.key;
  }, [table]);

  const editableCols = table.columns.filter((c) => c.key !== statusKey);
  const identifier = (row: Row) =>
    String(row[table.columns[0].key] ?? Object.values(row)[0] ?? 'record');

  const saveEdit = () => {
    if (!editing) return;
    persist(rows.map((r) => (r === editing.row ? { ...r, ...editing.draft } : r)));
    setEditing(null);
    toast('Changes saved');
  };

  const saveAdd = () => {
    if (!adding) return;
    persist([{ ...adding }, ...rows]);
    setAdding(null);
    toast('Record added');
  };

  const confirmDelete = () => {
    if (!deleting) return;
    persist(rows.filter((r) => r !== deleting));
    setDeleting(null);
    toast('Record deleted', 'info');
  };

  const confirmToggle = () => {
    if (!toggling || !statusKey) return;
    persist(rows.map((r) => (r === toggling.row ? { ...r, [statusKey]: toggling.next } : r)));
    toast(`Status updated to ${toggling.next}`);
    setToggling(null);
  };

  const confirmBulkDelete = () => {
    const n = selectedRows.length;
    persist(rows.filter((r) => !selectedRows.includes(r)));
    setBulkDelete(false);
    setSelectedRows([]);
    toast(`${n} record(s) deleted`, 'info');
  };

  const formFields = (draft: Row, setDraft: (r: Row) => void) => (
    <form onSubmit={(e) => e.preventDefault()}>
      {editableCols.map((col) => (
        <div className="mb-3" key={col.key}>
          <label className="form-label small">{col.label}</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={draft[col.key] ?? ''}
            onChange={(e) => setDraft({ ...draft, [col.key]: e.target.value })}
          />
        </div>
      ))}
      {statusKey && (
        <div className="mb-1">
          <label className="form-label small">
            {table.columns.find((c) => c.key === statusKey)?.label ?? 'Status'}
          </label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={draft[statusKey] ?? ''}
            onChange={(e) => setDraft({ ...draft, [statusKey]: e.target.value })}
          />
        </div>
      )}
    </form>
  );

  return (
    <div className="card mb-4">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="card-title mb-0">{table.title}</h5>
        {!table.readOnly && (
          <div className="d-flex gap-2">
            {selectedRows.length > 0 && (
              <button className="btn btn-sm btn-outline-danger" onClick={() => setBulkDelete(true)}>
                <i className="bi bi-trash me-1"></i>
                Delete {selectedRows.length}
              </button>
            )}
            <button
              className="btn btn-sm btn-primary"
              onClick={() => {
                const blank: Row = {};
                table.columns.forEach((c) => (blank[c.key] = ''));
                setAdding(blank);
              }}
            >
              <i className="bi bi-plus-lg me-1"></i>
              {table.addLabel ?? 'Add'}
            </button>
          </div>
        )}
      </div>
      <div className="card-body">
        <DataTable
          columns={table.columns.map((col) => ({
            key: col.key,
            label: col.label,
            sortable: col.sortable !== false,
            render: col.badge
              ? (value: unknown) => <StatusBadge status={String(value)} type="default" size="sm" />
              : undefined,
          }))}
          data={hydrated ? rows : table.rows}
          searchable
          searchableFields={table.searchableFields}
          selectable={!table.readOnly}
          onSelectionChange={setSelectedRows}
          exportable
          exportName={table.title}
          filters={
            table.filterKey
              ? [{
                  key: table.filterKey,
                  label: table.filterLabel || 'All',
                  options: Array.from(new Set(rows.map((r) => String(r[table.filterKey!]))))
                    .map((v) => ({ value: v, label: v })),
                }]
              : undefined
          }
          rowActions={
            table.actions !== false
              ? (row: Row) => {
                  const toggle = statusKey ? statusToggleAction(String(row[statusKey] ?? '')) : null;
                  return (
                    <RecordActions
                      onView={() => setViewing(row)}
                      onEdit={table.readOnly ? undefined : () => setEditing({ row, draft: { ...row } })}
                      toggleAction={table.readOnly ? null : toggle?.action ?? null}
                      onToggle={
                        table.readOnly || !toggle
                          ? undefined
                          : () => setToggling({ row, next: toggle.next, action: toggle.action })
                      }
                      onDelete={table.readOnly ? undefined : () => setDeleting(row)}
                    />
                  );
                }
              : undefined
          }
        />
      </div>

      {/* View modal */}
      {viewing && (
        <Modal title="Details" onClose={() => setViewing(null)}>
          <ul className="list-group list-group-flush">
            {table.columns.map((col) => (
              <li key={col.key} className="list-group-item d-flex justify-content-between px-0">
                <span className="small text-muted">{col.label}</span>
                {col.badge ? (
                  <StatusBadge status={String(viewing[col.key])} type="default" size="sm" />
                ) : (
                  <span className="small fw-medium text-end">{viewing[col.key]}</span>
                )}
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {/* Edit modal */}
      {editing && (
        <Modal
          title={`Edit ${identifier(editing.row)}`}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={saveEdit}>
                Save changes
              </button>
            </>
          }
        >
          {formFields(editing.draft, (d) => setEditing({ ...editing, draft: d }))}
        </Modal>
      )}

      {/* Add modal */}
      {adding && (
        <Modal
          title={table.addLabel ?? `New ${table.title.replace(/s$/, '')}`}
          onClose={() => setAdding(null)}
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setAdding(null)}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={saveAdd}>
                Add
              </button>
            </>
          }
        >
          {formFields(adding, setAdding)}
        </Modal>
      )}

      {/* Delete confirm */}
      {deleting && (
        <ConfirmDialog
          title="Delete record"
          message={`Delete "${identifier(deleting)}"? This cannot be undone.`}
          confirmLabel="Delete"
          tone="danger"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

      {/* Bulk delete confirm */}
      {bulkDelete && (
        <ConfirmDialog
          title="Delete selected"
          message={`Delete ${selectedRows.length} selected record(s)? This cannot be undone.`}
          confirmLabel="Delete all"
          tone="danger"
          onConfirm={confirmBulkDelete}
          onCancel={() => setBulkDelete(false)}
        />
      )}

      {/* Status toggle confirm */}
      {toggling && (
        <ConfirmDialog
          title={`${toggling.action} record`}
          message={`${toggling.action} "${identifier(toggling.row)}"? Status will change to "${toggling.next}".`}
          confirmLabel={toggling.action}
          tone={toggling.action === 'Approve' || toggling.action === 'Activate' ? 'success' : 'warning'}
          onConfirm={confirmToggle}
          onCancel={() => setToggling(null)}
        />
      )}
    </div>
  );
}
