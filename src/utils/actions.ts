/**
 * Shared client-side action helpers: CSV export, printing, clipboard.
 */

export function rowsToCSV(rows: object[], columns?: { key: string; label: string }[]): string {
  if (!rows.length) return '';
  const cols = columns && columns.length ? columns : Object.keys(rows[0]).map((k) => ({ key: k, label: k }));
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = cols.map((c) => escape(c.label)).join(',');
  const body = rows
    .map((r) => cols.map((c) => escape((r as Record<string, unknown>)[c.key])).join(','))
    .join('\n');
  return `${header}\n${body}`;
}

export function downloadCSV(filename: string, rows: object[], columns?: { key: string; label: string }[]) {
  const csv = rowsToCSV(rows, columns);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadJSON(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function printRows(title: string, rows: Record<string, unknown>[], columns?: { key: string; label: string }[]) {
  if (!rows.length) return;
  const cols = columns && columns.length ? columns : Object.keys(rows[0]).map((k) => ({ key: k, label: k }));
  const escapeHtml = (v: unknown) =>
    String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = `<!doctype html><html><head><title>${escapeHtml(title)}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #111; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  p.meta { font-size: 12px; color: #666; margin-bottom: 16px; }
  table { border-collapse: collapse; width: 100%; font-size: 12px; }
  th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
  th { background: #f4f4f4; }
</style></head><body>
<h1>${escapeHtml(title)}</h1>
<p class="meta">Exported ${new Date().toLocaleString()} · ${rows.length} record(s)</p>
<table><thead><tr>${cols.map((c) => `<th>${escapeHtml(c.label)}</th>`).join('')}</tr></thead>
<tbody>${rows.map((r) => `<tr>${cols.map((c) => `<td>${escapeHtml(r[c.key])}</td>`).join('')}</tr>`).join('')}</tbody></table>
</body></html>`;
  const win = window.open('', '_blank', 'width=900,height=650');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers / non-secure contexts
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Given a status value, returns the label for the "toggle" action
 * (e.g. Active → Suspend, Suspended → Activate, Pending → Approve).
 */
export function statusToggleAction(status: string): { action: string; next: string; tone: 'warning' | 'success' | 'danger' } | null {
  const s = status.toLowerCase();
  if (['active', 'enabled', 'connected', 'live', 'approved', 'verified', 'online'].includes(s))
    return { action: 'Suspend', next: 'Suspended', tone: 'warning' };
  if (['suspended', 'disabled', 'inactive', 'restricted', 'offline', 'deactivated'].includes(s))
    return { action: 'Activate', next: 'Active', tone: 'success' };
  if (['pending', 'pending approval', 'under review', 'submitted', 'review', 'awaiting'].includes(s))
    return { action: 'Approve', next: 'Approved', tone: 'success' };
  if (['planned', 'draft'].includes(s))
    return { action: 'Activate', next: 'Active', tone: 'success' };
  if (['failed', 'declined'].includes(s))
    return { action: 'Retry', next: 'Pending', tone: 'warning' };
  return null;
}
