'use client';

import { useEffect, useState } from 'react';

export interface ActivityEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
  scope: string;
  recordId?: string;
  tone?: 'success' | 'info' | 'warning' | 'danger';
  read?: boolean;
}

const KEY = 'zeepay:activity';
const EVENT = 'zeepay:activity';
const MAX = 200;

export function currentUser(): { name: string; email: string; role: string; business?: string } {
  if (typeof window === 'undefined') return { name: 'User', email: '', role: 'merchant' };
  try {
    const u = JSON.parse(localStorage.getItem('zeepay_user') || '{}');
    return { name: u.name || 'User', email: u.email || '', role: u.role || 'merchant', business: u.business };
  } catch {
    return { name: 'User', email: '', role: 'merchant' };
  }
}

export function readActivity(): ActivityEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function logActivity(e: Omit<ActivityEntry, 'id' | 'at' | 'actor'> & { actor?: string }) {
  if (typeof window === 'undefined') return;
  const entry: ActivityEntry = {
    id: Math.random().toString(36).slice(2),
    at: new Date().toISOString(),
    actor: e.actor || currentUser().name,
    ...e,
  };
  const next = [entry, ...readActivity()].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

export function markAllActivityRead() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(readActivity().map((a) => ({ ...a, read: true }))));
  window.dispatchEvent(new Event(EVENT));
}

export function clearActivity() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, '[]');
  window.dispatchEvent(new Event(EVENT));
}

export function useActivity(filter?: (a: ActivityEntry) => boolean): ActivityEntry[] {
  const [items, setItems] = useState<ActivityEntry[]>([]);
  useEffect(() => {
    const load = () => setItems(readActivity());
    load();
    window.addEventListener(EVENT, load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener(EVENT, load);
      window.removeEventListener('storage', load);
    };
  }, []);
  return filter ? items.filter(filter) : items;
}

export function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}
