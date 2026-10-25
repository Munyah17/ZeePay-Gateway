'use client';
/* eslint-disable @typescript-eslint/no-explicit-any -- generic record utilities operate on arbitrary row shapes */

import { useMemo, useState } from 'react';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import ActionMenu, { MenuAction } from '@/components/ui/ActionMenu';
import RecordFormModal, { FieldDef } from '@/components/ui/RecordForm';
import Modal from '@/components/ui/Modal';
import PageHeader, { StatCard } from '@/components/ui/PageHeader';
import { useUI } from '@/components/ui/UIProvider';
import { RecordDrawer, statusTransitions, inferFields, findStatusKey, Avatar, StatusTransition } from '@/components/ui/records';
import { useCollection, usePersistentState, Row } from '@/lib/store/useCollection';
import { logActivity } from '@/lib/store/activity';
import { exportCSV, exportExcel, exportJSON, printTable, printRecord, copyToClipboard } from '@/lib/export';

export interface PageStat {
  label: string;
  value: string | number;
  tone?: 'success' | 'danger' | 'warning' | 'info' | 'primary';
  sub?: string;
}

export interface PanelItem {
  label: string;
  value?: string;
  badge?: string;
}

export interface PageConfig {
  id?: string;
  title: string;
  description: string;
  icon?: string;
  entity?: string;
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
    items: PanelItem[];
  }[];
}

const STAT_ICONS = ['bi-graph-up-arrow', 'bi-check2-circle', 'bi-hourglass-split', 'bi-exclamation-octagon'];
const TOGGLE_PAIRS: [string, string][] = [
  ['active', 'inactive'],
  ['enabled', 'disabled'],
  ['on', 'off'],
  ['completed', 'pending'],
];

function togglePartner(badge?: string): string | null {
  if (!badge) return null;
  const b = badge.toLowerCase();
  for (const [a, z] of TOGGLE_PAIRS) {
    if (b === a) return z.charAt(0).toUpperCase() + z.slice(1);
    if (b === z) return a.charAt(0).toUpperCase() + a.slice(1);
  }
  return null;
}
const isOn = (badge?: string) => ['active', 'enabled', 'on', 'completed'].includes(String(badge).toLowerCase());

function singular(title: string) {
  const t = title.replace(/^(recent|all|active|open|pending|current)\s+/i, '').trim();
  return t.endsWith('ies') ? t.slice(0, -3) + 'y' : t.endsWith('ses') ? t.slice(0, -2) : t.endsWith('s') ? t.slice(0, -1) : t;
}

export default function ConfigPage({ config }: { config: PageConfig }) {
  const { title, description, stats, alert, table, panels } = config;
  const pageId = config.id || title.toLowerCase().replace(/\s+/g, '-');
  const { toast, confirm } = useUI();
  const entity = config.entity || (table ? singular(table.title).toLowerCase() : 'record');
  const editable = !!table && table.actions !== false;

  const collection = useCollection<Record<string, any>>(`cfg:${pageId}`, table?.rows || [], { entity });
  const [panelState, setPanelState] = usePersistentState(`cfg-panels:${pageId}`, panels || []);
  const [alertOpen, setAlertOpen] = useState(true);
  const [viewing, setViewing] = useState<Row | null>(null);
  const [editing, setEditing] = useState<Row | 'new' | null>(null);
  const [statFilter, setStatFilter] = useState<string | null>(null);
  const [panelEdit, setPanelEdit] = useState<{ p: number; i: number | null } | null>(null);

  const columns = useMemo(() => table?.columns || [], [table]);
  const badgeKeys = columns.filter((c) => c.badge).map((c) => c.key);
  const statusKey = findStatusKey(columns.map((c) => c.key), badgeKeys);
  const primaryKey = columns[0]?.key;
  const fields: FieldDef[] = useMemo(() => inferFields(columns, table?.rows || []), [columns, table?.rows]);
  const statusValues = useMemo(
    () => (statusKey ? Array.from(new Set(collection.rows.map((r) => String(r[statusKey])))) : []),
    [collection.rows, statusKey],
  );

  const matchStat = (label: string): string | null => {
    if (!statusKey) return null;
    const l = label.toLowerCase();
    return statusValues.find((v) => l.includes(v.toLowerCase()) || v.toLowerCase().includes(l.replace(/s$/, ''))) || null;
  };

  const rows = statFilter && statusKey ? collection.rows.filter((r) => String(r[statusKey]) === statFilter) : collection.rows;
  const readable = (r: Record<string, any>) => String(r[primaryKey || 'name'] ?? r.name ?? r._id);

  const applyTransition = async (row: Row, t: StatusTransition) => {
    if (!statusKey) return;
    let reason = '';
    if (t.confirm || t.requireReason) {
      const res = await confirm({
        title: `${t.label} ${entity}?`,
        message: (
          <>
            <strong>{readable(row)}</strong> will move from <StatusBadge status={String(row[statusKey])} /> to <StatusBadge status={t.next} />.
          </>
        ),
        confirmLabel: t.label,
        tone: t.tone === 'danger' ? 'danger' : t.tone === 'warning' ? 'warning' : 'primary',
        requireReason: t.requireReason,
      });
      if (!res) return;
      reason = res.reason;
    }
    collection.update(row._id, { [statusKey]: t.next }, `${t.label}${reason ? ` — ${reason}` : ''}`);
    setViewing((v) => (v && v._id === row._id ? { ...v, [statusKey]: t.next } : v));
    toast(`${readable(row)} → ${t.next}`, { tone: t.tone === 'danger' ? 'danger' : t.tone === 'warning' ? 'warning' : 'success' });
  };

  const deleteRow = async (row: Row) => {
    const ok = await confirm({ title: `Delete ${entity}?`, message: `“${readable(row)}” will be permanently removed.`, confirmLabel: 'Delete', tone: 'danger' });
    if (!ok) return;
    collection.remove(row._id);
    setViewing(null);
    toast(`${readable(row)} deleted`, { tone: 'danger' });
  };

  const duplicateRow = (row: Row) => {
    const { _id, _createdAt, _updatedAt, ...rest } = row;
    void _id; void _createdAt; void _updatedAt;
    const copy = primaryKey ? { ...rest, [primaryKey]: `${rest[primaryKey]} (copy)` } : rest;
    collection.add(copy, `Duplicated ${entity}`);
    toast('Duplicated', { tone: 'info' });
  };

  const rowMenu = (row: Row): MenuAction[] => {
    const transitions = statusKey ? statusTransitions(row[statusKey]) : [];
    return [
      { label: 'View details', icon: 'bi-eye', onClick: () => setViewing(row) },
      { label: 'Edit', icon: 'bi-pencil-square', onClick: () => setEditing(row), hidden: !editable },
      ...(editable ? transitions.map((t, i) => ({ label: t.label, icon: t.icon, tone: t.tone, divider: i === 0, onClick: () => applyTransition(row, t) })) : []),
      { label: 'Duplicate', icon: 'bi-copy', divider: true, onClick: () => duplicateRow(row), hidden: !editable },
      { label: 'Copy as text', icon: 'bi-clipboard', onClick: async () => { await copyToClipboard(columns.map((c) => `${c.label}: ${row[c.key] ?? ''}`).join('\n')); toast('Copied to clipboard', { tone: 'info' }); } },
      { label: 'Print', icon: 'bi-printer', onClick: () => printRecord(`${singular(table?.title || title)} — ${readable(row)}`, row, columns) },
      { label: 'Delete', icon: 'bi-trash3', tone: 'danger', divider: true, onClick: () => deleteRow(row), hidden: !editable },
    ];
  };

  const bulkTransitions = useMemo(() => {
    const map = new Map<string, StatusTransition>();
    statusValues.forEach((v) => statusTransitions(v).forEach((t) => !t.requireReason && !map.has(t.label) && map.set(t.label, t)));
    return Array.from(map.values()).slice(0, 3);
  }, [statusValues]);

  const tableColumns: Column[] = columns.map((col, idx) => ({
    key: col.key,
    label: col.label,
    sortable: col.sortable !== false,
    render: col.badge
      ? (value: any) => <StatusBadge status={String(value)} />
      : idx === 0
        ? (value: any, row: any) => {
            const looksLikePerson = /name|merchant|business|customer|staff|user|member|owner|company|provider/i.test(col.key + col.label);
            return (
              <span className="d-inline-flex align-items-center gap-2 fw-semibold text-body">
                {looksLikePerson && <Avatar name={String(value)} size={28} />}
                <span>{value}</span>
                {row._createdAt && Date.now() - new Date(row._createdAt).getTime() < 3600_000 && <span className="zp-new-pill">new</span>}
              </span>
            );
          }
        : undefined,
  }));

  const pageExportRows = collection.rows;
  const exportCols = columns.map((c) => ({ key: c.key, label: c.label }));
  const activePanel = panelEdit ? panelState[panelEdit.p] : null;
  const activeItem = panelEdit && activePanel && panelEdit.i !== null ? activePanel.items[panelEdit.i] : null;

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        icon={config.icon}
        actions={
          <>
            {table && (
              <ActionMenu
                buttonClassName="btn btn-outline-secondary btn-sm"
                label={<><i className="bi bi-box-arrow-up me-1"></i>Export</>}
                actions={[
                  { label: 'Export CSV', icon: 'bi-filetype-csv', onClick: () => exportCSV(title, pageExportRows, exportCols) },
                  { label: 'Export Excel', icon: 'bi-file-earmark-excel', onClick: () => exportExcel(title, pageExportRows, exportCols) },
                  { label: 'Export JSON', icon: 'bi-filetype-json', onClick: () => exportJSON(title, pageExportRows) },
                  { label: 'Print report', icon: 'bi-printer', divider: true, onClick: () => printTable(title, pageExportRows, exportCols) },
                  {
                    label: 'Reset demo data',
                    icon: 'bi-arrow-counterclockwise',
                    divider: true,
                    tone: 'warning',
                    hidden: !editable,
                    onClick: async () => {
                      if (await confirm({ title: 'Reset data?', message: 'All local edits on this page will be discarded.', tone: 'warning', confirmLabel: 'Reset' })) {
                        collection.reset();
                        setPanelState(panels || []);
                        toast('Data reset', { tone: 'warning' });
                      }
                    },
                  },
                ]}
              />
            )}
            {editable && (
              <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>
                <i className="bi bi-plus-lg me-1"></i>Add {entity}
              </button>
            )}
          </>
        }
      />

      {alert && alertOpen && (
        <div className={`alert alert-${alert.tone} zp-alert d-flex align-items-center gap-3`} role="alert">
          <i className="bi bi-exclamation-triangle-fill fs-5"></i>
          <div className="flex-grow-1">{alert.message}</div>
          <button className="btn-close" aria-label="Dismiss" onClick={() => setAlertOpen(false)}></button>
        </div>
      )}

      {stats && stats.length > 0 && (
        <div className="zp-stat-grid mb-4">
          {stats.map((stat, i) => {
            const match = matchStat(stat.label);
            return (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                sub={match ? (statFilter === match ? 'Filtering table · click to clear' : 'Click to filter') : stat.sub}
                tone={stat.tone}
                icon={STAT_ICONS[i % STAT_ICONS.length]}
                active={!!match && statFilter === match}
                onClick={match ? () => setStatFilter((f) => (f === match ? null : match)) : undefined}
              />
            );
          })}
        </div>
      )}

      {panelState.length > 0 && (
        <div className="row g-3 mb-4">
          {panelState.map((panel, p) => (
            <div className={panelState.length === 1 ? 'col-12' : 'col-lg-6'} key={panel.title + p}>
              <div className="zp-card h-100">
                <div className="zp-card-head">
                  <div>
                    <h6 className="mb-0 fw-semibold">{panel.title}</h6>
                    {panel.description && <small className="text-muted">{panel.description}</small>}
                  </div>
                  <button className="btn btn-sm btn-light" onClick={() => setPanelEdit({ p, i: null })}>
                    <i className="bi bi-plus-lg me-1"></i>Add
                  </button>
                </div>
                <ul className="zp-panel-list">
                  {panel.items.map((item, i) => {
                    const partner = togglePartner(item.badge);
                    return (
                      <li key={item.label + i}>
                        <button type="button" className="zp-panel-item" onClick={() => setPanelEdit({ p, i })} title="Click to edit">
                          <span>{item.label}</span>
                          {item.badge ? <StatusBadge status={item.badge} /> : <span className="text-muted">{item.value}</span>}
                        </button>
                        {partner && (
                          <div className="form-check form-switch m-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              aria-label={`Toggle ${item.label}`}
                              checked={isOn(item.badge)}
                              onChange={() => {
                                setPanelState((prev) =>
                                  prev.map((pp, pi) => (pi !== p ? pp : { ...pp, items: pp.items.map((it, ii) => (ii === i ? { ...it, badge: partner } : it)) })),
                                );
                                logActivity({ action: `${item.label} → ${partner}`, target: panel.title, scope: `cfg-panels:${pageId}`, tone: 'info' });
                                toast(`${item.label} set to ${partner}`);
                              }}
                            />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {table && (
        <DataTable
          title={table.title}
          subtitle={statFilter ? `Filtered by ${statFilter} · ${rows.length} record(s)` : undefined}
          columns={tableColumns}
          data={rows}
          searchableFields={table.searchableFields}
          exportName={`${title} - ${table.title}`}
          filters={
            table.filterKey
              ? [
                  {
                    key: table.filterKey,
                    label: table.filterLabel || 'All',
                    options: Array.from(new Set(collection.rows.map((r) => String(r[table.filterKey!])))).map((v) => ({ value: v, label: v })),
                  },
                ]
              : undefined
          }
          onRowClick={(row) => setViewing(row)}
          bulkActions={
            editable
              ? [
                  ...bulkTransitions.map((t) => ({
                    label: t.label,
                    icon: t.icon,
                    tone: t.tone,
                    onClick: async (sel: Row[]) => {
                      if (!statusKey) return;
                      if (!(await confirm({ title: `${t.label} ${sel.length} record(s)?`, confirmLabel: t.label, tone: t.tone === 'danger' ? 'danger' : 'primary' }))) return;
                      collection.updateMany(sel.map((r) => r._id), { [statusKey]: t.next }, `${t.label} (${sel.length})`);
                      toast(`${sel.length} record(s) → ${t.next}`);
                    },
                  })),
                  {
                    label: 'Delete',
                    icon: 'bi-trash3',
                    tone: 'danger' as const,
                    onClick: async (sel: Row[]) => {
                      if (!(await confirm({ title: `Delete ${sel.length} record(s)?`, message: 'This cannot be undone.', confirmLabel: 'Delete', tone: 'danger' }))) return;
                      collection.removeMany(sel.map((r) => r._id));
                      toast(`${sel.length} record(s) deleted`, { tone: 'danger' });
                    },
                  },
                ]
              : undefined
          }
          selectable
          emptyAction={
            editable ? (
              <button className="btn btn-sm btn-primary mt-2" onClick={() => setEditing('new')}>
                <i className="bi bi-plus-lg me-1"></i>Add {entity}
              </button>
            ) : undefined
          }
          rowActions={(row: Row) => {
            const quick = editable && statusKey ? statusTransitions(row[statusKey])[0] : undefined;
            return (
              <div className="d-inline-flex gap-1 align-items-center">
                <button className="btn btn-sm zp-icon-btn" title="View" aria-label="View" onClick={() => setViewing(row)}>
                  <i className="bi bi-eye"></i>
                </button>
                {editable && (
                  <button className="btn btn-sm zp-icon-btn" title="Edit" aria-label="Edit" onClick={() => setEditing(row)}>
                    <i className="bi bi-pencil"></i>
                  </button>
                )}
                {quick && (
                  <button className={`btn btn-sm zp-quick zp-quick-${quick.tone || 'primary'} d-none d-xl-inline-flex`} onClick={() => applyTransition(row, quick)}>
                    <i className={`bi ${quick.icon} me-1`}></i>
                    {quick.label}
                  </button>
                )}
                <ActionMenu actions={rowMenu(row)} />
              </div>
            );
          }}
        />
      )}

      <RecordDrawer
        open={!!viewing}
        onClose={() => setViewing(null)}
        record={viewing}
        title={viewing ? readable(viewing) : ''}
        subtitle={table?.title}
        icon={config.icon || 'bi-card-text'}
        fields={columns}
        scope={`cfg:${pageId}`}
        actions={
          viewing && (
            <div className="d-flex flex-wrap gap-2 w-100">
              {editable && (
                <button className="btn btn-primary btn-sm" onClick={() => { setEditing(viewing); }}>
                  <i className="bi bi-pencil-square me-1"></i>Edit
                </button>
              )}
              {editable &&
                statusKey &&
                statusTransitions(viewing[statusKey]).map((t) => (
                  <button key={t.label} className={`btn btn-sm btn-outline-${t.tone || 'secondary'}`} onClick={() => applyTransition(viewing, t)}>
                    <i className={`bi ${t.icon} me-1`}></i>
                    {t.label}
                  </button>
                ))}
              <button className="btn btn-sm btn-light ms-auto" onClick={() => printRecord(`${singular(table?.title || title)} — ${readable(viewing)}`, viewing, columns)}>
                <i className="bi bi-printer"></i>
              </button>
              {editable && (
                <button className="btn btn-sm btn-outline-danger" aria-label="Delete" onClick={() => deleteRow(viewing)}>
                  <i className="bi bi-trash3"></i>
                </button>
              )}
            </div>
          )
        }
      />

      <RecordFormModal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? `Add ${entity}` : `Edit ${entity}`}
        subtitle={editing && editing !== 'new' ? readable(editing) : table?.title}
        icon={editing === 'new' ? 'bi-plus-circle' : 'bi-pencil-square'}
        fields={fields}
        initial={editing === 'new' ? (statusKey ? { [statusKey]: statusValues.find((v) => /pending|active/i.test(v)) || '' } : {}) : (editing as Row | null) || undefined}
        submitLabel={editing === 'new' ? `Create ${entity}` : 'Save changes'}
        onSubmit={(values) => {
          if (editing === 'new') {
            collection.add(values);
            toast(`${entity.charAt(0).toUpperCase() + entity.slice(1)} created`, { message: readable(values) });
          } else if (editing) {
            collection.update(editing._id, values);
            setViewing((v) => (v && v._id === editing._id ? { ...v, ...values } : v));
            toast('Changes saved', { message: readable({ ...editing, ...values }) });
          }
        }}
      />

      <PanelItemModal
        open={!!panelEdit}
        panelTitle={activePanel?.title || ''}
        item={activeItem}
        onClose={() => setPanelEdit(null)}
        onSave={(item) => {
          if (!panelEdit) return;
          setPanelState((prev) =>
            prev.map((pp, pi) =>
              pi !== panelEdit.p ? pp : { ...pp, items: panelEdit.i === null ? [...pp.items, item] : pp.items.map((it, ii) => (ii === panelEdit.i ? item : it)) },
            ),
          );
          logActivity({ action: `${panelEdit.i === null ? 'Added' : 'Updated'} ${item.label}`, target: activePanel?.title || '', scope: `cfg-panels:${pageId}`, tone: 'info' });
          toast(panelEdit.i === null ? 'Item added' : 'Item updated');
          setPanelEdit(null);
        }}
        onDelete={
          panelEdit && panelEdit.i !== null
            ? () => {
                setPanelState((prev) => prev.map((pp, pi) => (pi !== panelEdit.p ? pp : { ...pp, items: pp.items.filter((_, ii) => ii !== panelEdit.i) })));
                toast('Item removed', { tone: 'danger' });
                setPanelEdit(null);
              }
            : undefined
        }
      />
    </>
  );
}

function PanelItemModal({
  open,
  panelTitle,
  item,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  panelTitle: string;
  item: PanelItem | null;
  onClose: () => void;
  onSave: (item: PanelItem) => void;
  onDelete?: () => void;
}) {
  const [label, setLabel] = useState('');
  const [mode, setMode] = useState<'value' | 'badge'>('value');
  const [val, setVal] = useState('');
  const [lastKey, setLastKey] = useState<string | null>(null);
  const key = open ? `${panelTitle}|${item?.label ?? '__new'}` : null;
  if (key !== lastKey) {
    setLastKey(key);
    if (open) {
      setLabel(item?.label || '');
      setMode(item?.badge ? 'badge' : 'value');
      setVal(item?.badge || item?.value || '');
    }
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? `Edit ${item.label}` : 'Add item'}
      subtitle={panelTitle}
      icon="bi-sliders"
      size="sm"
      footer={
        <>
          {onDelete && (
            <button className="btn btn-outline-danger me-auto" onClick={onDelete}>
              <i className="bi bi-trash3"></i>
            </button>
          )}
          <button className="btn btn-light" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!label.trim()} onClick={() => onSave(mode === 'badge' ? { label, badge: val } : { label, value: val })}>
            Save
          </button>
        </>
      }
    >
      <div className="mb-3">
        <label className="form-label small fw-semibold">Label</label>
        <input className="form-control" value={label} onChange={(e) => setLabel(e.target.value)} autoFocus />
      </div>
      <div className="btn-group btn-group-sm mb-3" role="group">
        <button className={`btn ${mode === 'value' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setMode('value')}>Value</button>
        <button className={`btn ${mode === 'badge' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setMode('badge')}>Status</button>
      </div>
      {mode === 'badge' ? (
        <select className="form-select" value={val} onChange={(e) => setVal(e.target.value)}>
          {['Active', 'Inactive', 'Enabled', 'Disabled', 'Pending', 'Completed', 'Failed', 'Degraded'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      ) : (
        <input className="form-control" value={val} onChange={(e) => setVal(e.target.value)} placeholder="Value" />
      )}
    </Modal>
  );
}
