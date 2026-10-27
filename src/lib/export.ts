'use client';
/* eslint-disable @typescript-eslint/no-explicit-any -- generic record utilities operate on arbitrary row shapes */

export interface ExportColumn {
  key: string;
  label: string;
}

const humanize = (k: string) => k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ').replace(/^./, (c) => c.toUpperCase());

export function columnsFromRows(rows: Record<string, any>[]): ExportColumn[] {
  const keys = new Set<string>();
  rows.forEach((r) => Object.keys(r).forEach((k) => !k.startsWith('_') && keys.add(k)));
  return Array.from(keys).map((k) => ({ key: k, label: humanize(k) }));
}

function cell(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const stamp = () => new Date().toISOString().slice(0, 10);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'export';

export function exportCSV(name: string, rows: Record<string, any>[], columns?: ExportColumn[]) {
  const cols = columns || columnsFromRows(rows);
  const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const lines = [cols.map((c) => esc(c.label)).join(','), ...rows.map((r) => cols.map((c) => esc(cell(r[c.key]))).join(','))];
  download(`${slug(name)}-${stamp()}.csv`, '\uFEFF' + lines.join('\n'), 'text/csv;charset=utf-8');
}

export function exportExcel(name: string, rows: Record<string, any>[], columns?: ExportColumn[]) {
  const cols = columns || columnsFromRows(rows);
  const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1"><thead><tr>${cols
    .map((c) => `<th style="background:#1a1650;color:#fff">${escHtml(c.label)}</th>`)
    .join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${cols.map((c) => `<td>${escHtml(cell(r[c.key]))}</td>`).join('')}</tr>`)
    .join('')}</tbody></table></body></html>`;
  download(`${slug(name)}-${stamp()}.xls`, html, 'application/vnd.ms-excel');
}

export function exportJSON(name: string, rows: Record<string, any>[] | Record<string, any>) {
  const list = Array.isArray(rows) ? rows : [rows];
  const clean = list.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => !k.startsWith('_'))));
  download(`${slug(name)}-${stamp()}.json`, JSON.stringify(clean, null, 2), 'application/json');
}

function openPrintWindow(title: string, body: string) {
  const w = window.open('', '_blank', 'width=1000,height=760');
  if (!w) return false;
  w.document.write(`<!doctype html><html><head><title>${title}</title><style>
    *{box-sizing:border-box}body{font-family:Inter,Segoe UI,Arial,sans-serif;color:#1a1650;margin:32px}
    .hdr{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #6366f1;padding-bottom:12px;margin-bottom:20px}
    .brand{font-weight:800;font-size:22px;letter-spacing:-.5px}.brand span{color:#6366f1}
    h1{font-size:18px;margin:0}.meta{font-size:11px;color:#6b7280}
    table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f4f5fb;text-align:left;padding:8px;border-bottom:1px solid #dfe3fa;text-transform:uppercase;font-size:10px;letter-spacing:.04em;color:#4b5563}
    td{padding:8px;border-bottom:1px solid #eef0f8}dl{display:grid;grid-template-columns:200px 1fr;gap:8px 16px;font-size:13px}dt{color:#6b7280}dd{margin:0;font-weight:600}
    .foot{margin-top:24px;font-size:10px;color:#9ca3af;text-align:center}@media print{body{margin:12mm}}
  </style></head><body><div class="hdr"><div><div class="brand">Zee<span>Pay</span></div><h1>${title}</h1></div><div class="meta">Generated ${new Date().toLocaleString()}</div></div>${body}<div class="foot">ZeePay Payment Gateway · Confidential</div><script>window.onload=()=>{window.print();}</script></body></html>`);
  w.document.close();
  return true;
}

export function printTable(title: string, rows: Record<string, any>[], columns?: ExportColumn[]) {
  const cols = columns || columnsFromRows(rows);
  const body = `<table><thead><tr>${cols.map((c) => `<th>${c.label}</th>`).join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${cols.map((c) => `<td>${cell(r[c.key])}</td>`).join('')}</tr>`)
    .join('')}</tbody></table><p class="meta">${rows.length} record(s)</p>`;
  return openPrintWindow(title, body);
}

export function printRecord(title: string, record: Record<string, any>, columns?: ExportColumn[]) {
  const cols = columns || columnsFromRows([record]);
  const body = `<dl>${cols.map((c) => `<dt>${c.label}</dt><dd>${cell(record[c.key]) || '—'}</dd>`).join('')}</dl>`;
  return openPrintWindow(title, body);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export { humanize };
