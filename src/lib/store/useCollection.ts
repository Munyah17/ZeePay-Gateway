'use client';
/* eslint-disable @typescript-eslint/no-explicit-any -- generic record utilities operate on arbitrary row shapes */

import { useCallback, useEffect, useRef, useState } from 'react';
import { logActivity } from './activity';

export type Row = Record<string, any> & { _id: string };

const PREFIX = 'zeepay:data:';

export function newId(prefix = 'rec'): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function withIds<T extends Record<string, any>>(rows: T[]): Row[] {
  return rows.map((r, i) => ('_id' in r && r._id ? (r as unknown as Row) : { ...r, _id: `seed_${i}` }));
}

function read<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage full or blocked */
  }
}

export interface CollectionApi<T extends Record<string, any>> {
  rows: (T & Row)[];
  ready: boolean;
  add: (row: Partial<T>, label?: string) => T & Row;
  update: (id: string, patch: Partial<T>, label?: string) => void;
  remove: (id: string, label?: string) => void;
  removeMany: (ids: string[], label?: string) => void;
  updateMany: (ids: string[], patch: Partial<T>, label?: string) => void;
  setAll: (rows: (T & Row)[]) => void;
  reset: () => void;
}

/**
 * Client-side persisted collection (localStorage) used by dashboard pages until
 * the matching Supabase tables/API routes are wired. Every mutation is written to
 * the shared activity log so the topbar feed and audit drawers stay in sync.
 */
export function useCollection<T extends Record<string, any>>(
  key: string,
  seed: T[],
  opts: { entity?: string; labelField?: string } = {},
): CollectionApi<T> {
  const seedRef = useRef(seed);
  const [rows, setRows] = useState<(T & Row)[]>(() => withIds(seed) as (T & Row)[]);
  const [ready, setReady] = useState(false);
  const entity = opts.entity || 'record';
  const labelOf = (r: Record<string, any> | undefined) =>
    r ? String(r[opts.labelField || ''] ?? r.name ?? r.title ?? r.id ?? r.reference ?? r._id) : '';

  useEffect(() => {
    const stored = read<(T & Row)[]>(key);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored && Array.isArray(stored)) setRows(stored);
    setReady(true);
  }, [key]);

  const commit = useCallback(
    (next: (T & Row)[]) => {
      setRows(next);
      write(key, next);
    },
    [key],
  );

  const add: CollectionApi<T>['add'] = (row, label) => {
    const rec = { ...(row as T), _id: newId(), _createdAt: new Date().toISOString() } as T & Row;
    commit([rec, ...rows]);
    logActivity({ action: label || `Created ${entity}`, target: labelOf(rec), scope: key, recordId: rec._id, tone: 'success' });
    return rec;
  };

  const update: CollectionApi<T>['update'] = (id, patch, label) => {
    const target = rows.find((r) => r._id === id);
    commit(rows.map((r) => (r._id === id ? { ...r, ...patch, _updatedAt: new Date().toISOString() } : r)));
    logActivity({ action: label || `Updated ${entity}`, target: labelOf(target), scope: key, recordId: id, tone: 'info' });
  };

  const remove: CollectionApi<T>['remove'] = (id, label) => {
    const target = rows.find((r) => r._id === id);
    commit(rows.filter((r) => r._id !== id));
    logActivity({ action: label || `Deleted ${entity}`, target: labelOf(target), scope: key, recordId: id, tone: 'danger' });
  };

  const removeMany: CollectionApi<T>['removeMany'] = (ids, label) => {
    const set = new Set(ids);
    commit(rows.filter((r) => !set.has(r._id)));
    logActivity({ action: label || `Deleted ${ids.length} ${entity}(s)`, target: '', scope: key, tone: 'danger' });
  };

  const updateMany: CollectionApi<T>['updateMany'] = (ids, patch, label) => {
    const set = new Set(ids);
    commit(rows.map((r) => (set.has(r._id) ? { ...r, ...patch, _updatedAt: new Date().toISOString() } : r)));
    logActivity({ action: label || `Updated ${ids.length} ${entity}(s)`, target: '', scope: key, tone: 'info' });
  };

  const reset = () => {
    commit(withIds(seedRef.current) as (T & Row)[]);
    logActivity({ action: `Reset ${entity} data`, target: '', scope: key, tone: 'warning' });
  };

  return { rows, ready, add, update, remove, removeMany, updateMany, setAll: commit, reset };
}

/** Persisted single value (settings objects, toggles, form state). */
export function usePersistentState<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    const stored = read<T>(key);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored !== null) setValue(stored);
  }, [key]);
  const set = useCallback(
    (v: T | ((p: T) => T)) => {
      setValue((prev) => {
        const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
        write(key, next);
        return next;
      });
    },
    [key],
  );
  return [value, set];
}
