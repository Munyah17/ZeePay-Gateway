/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * In-memory Supabase stand-in for service-layer tests.
 * Implements the subset of the PostgREST query builder the services use:
 * select/insert/update with eq/neq/in/lte/lt/or/contains/is, order, range,
 * limit, single, count-head, and simple FK embeds used in select strings.
 */

export type Row = Record<string, any>;

export const db: Map<string, Row[]> = new Map();
export const webhookEvents: { merchantId: string; eventType: string; data: any }[] = [];

export function resetDb() {
  db.clear();
  webhookEvents.length = 0;
}

export function table(name: string): Row[] {
  if (!db.has(name)) db.set(name, []);
  return db.get(name)!;
}

export function findBy(tableName: string, col: string, val: any): Row | undefined {
  return table(tableName).find((r) => r[col] === val);
}

function matches(row: Row, op: string, col: string, val: any): boolean {
  switch (op) {
    case 'eq':
      return row[col] === val;
    case 'neq':
      return row[col] !== val;
    case 'lt':
      return row[col] != null && row[col] < val;
    case 'lte':
      return row[col] != null && row[col] <= val;
    case 'gt':
      return row[col] != null && row[col] > val;
    case 'gte':
      return row[col] != null && row[col] >= val;
    case 'is':
      // e.g. is.null
      return val === 'null' ? row[col] == null : row[col] === val;
    case 'in':
      return (val as any[]).includes(row[col]);
    case 'contains':
      return Array.isArray(row[col]) && (row[col] as any[]).includes(val);
    default:
      return true;
  }
}

/** Parse PostgREST `or()` groups like "locked_at.is.null,locked_at.lt.2024-01-01" */
function parseOr(expr: string): { col: string; op: string; val: any }[] {
  return expr.split(',').map((part) => {
    const firstDot = part.indexOf('.');
    const secondDot = part.indexOf('.', firstDot + 1);
    const col = part.slice(0, firstDot);
    const op = secondDot === -1 ? part.slice(firstDot + 1) : part.slice(firstDot + 1, secondDot);
    let val: any = secondDot === -1 ? '' : part.slice(secondDot + 1);
    if (val === 'null') val = 'null';
    return { col, op, val };
  });
}

function embed(rows: Row[], selectCols: string): Row[] {
  if (!selectCols) return rows;
  return rows.map((row) => {
    const out = { ...row };
    if (selectCols.includes('payment_mandates(*)')) {
      out.payment_mandates = table('payment_mandates').find((m) => m.id === row.mandate_id) || null;
    }
    if (selectCols.includes('payment_providers(name)')) {
      const p = table('payment_providers').find((pr) => pr.id === row.provider_id);
      out.payment_providers = p ? { name: p.name } : null;
    }
    return out;
  });
}

class Builder {
  private rows: () => Row[];
  private mode: 'select' | 'insert' | 'update' = 'select';
  private insertRows: Row[] = [];
  private updateFields: Row = {};
  private filters: ((r: Row) => boolean)[] = [];
  private orGroups: { col: string; op: string; val: any }[][] = [];
  private selectCols = '';
  private countExact = false;
  private headOnly = false;
  private orderCol = '';
  private orderAsc = true;
  private rangeFrom: number | null = null;
  private rangeTo: number | null = null;
  private limitN: number | null = null;
  private singleRow = false;

  constructor(private dbMap: Map<string, Row[]>, private tableName: string) {
    this.rows = () => table(tableName);
  }

  select(cols = '*', opts?: { count?: 'exact'; head?: boolean }) {
    this.selectCols = cols;
    if (opts?.count === 'exact') this.countExact = true;
    if (opts?.head) this.headOnly = true;
    return this;
  }

  insert(rows: Row | Row[]) {
    this.mode = 'insert';
    this.insertRows = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  update(fields: Row) {
    this.mode = 'update';
    this.updateFields = fields;
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push((r) => matches(r, 'eq', col, val));
    return this;
  }
  neq(col: string, val: any) {
    this.filters.push((r) => matches(r, 'neq', col, val));
    return this;
  }
  lt(col: string, val: any) {
    this.filters.push((r) => matches(r, 'lt', col, val));
    return this;
  }
  lte(col: string, val: any) {
    this.filters.push((r) => matches(r, 'lte', col, val));
    return this;
  }
  gt(col: string, val: any) {
    this.filters.push((r) => matches(r, 'gt', col, val));
    return this;
  }
  gte(col: string, val: any) {
    this.filters.push((r) => matches(r, 'gte', col, val));
    return this;
  }
  is(col: string, val: any) {
    this.filters.push((r) => matches(r, 'is', col, val));
    return this;
  }
  in(col: string, vals: any[]) {
    this.filters.push((r) => matches(r, 'in', col, vals));
    return this;
  }
  contains(col: string, val: any) {
    this.filters.push((r) => matches(r, 'contains', col, val));
    return this;
  }
  or(expr: string) {
    this.orGroups.push(parseOr(expr));
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col;
    this.orderAsc = opts?.ascending !== false;
    return this;
  }
  range(from: number, to: number) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }
  single() {
    this.singleRow = true;
    return this.execute();
  }

  private applyFilters(rows: Row[]): Row[] {
    let out = rows.filter((r) => this.filters.every((f) => f(r)));
    for (const group of this.orGroups) {
      out = out.filter((r) => group.some((c) => matches(r, c.op, c.col, c.val)));
    }
    return out;
  }

  private async execute(): Promise<any> {
    if (this.mode === 'insert') {
      const now = new Date().toISOString();
      const inserted = this.insertRows.map((r) => ({ created_at: now, ...r }));
      table(this.tableName).push(...inserted);
      const data = embed(inserted, this.selectCols);
      if (this.singleRow) return { data: data[0] ?? null, error: null };
      return { data, error: null };
    }

    if (this.mode === 'update') {
      const matched = this.applyFilters(this.rows());
      matched.forEach((r) => Object.assign(r, this.updateFields));
      const data = embed(matched, this.selectCols);
      if (this.singleRow) return { data: data[0] ?? null, error: matched.length ? null : null };
      return { data, error: null };
    }

    // select
    let matched = this.applyFilters(this.rows());
    if (this.orderCol) {
      matched = [...matched].sort((a, b) => {
        const av = a[this.orderCol];
        const bv = b[this.orderCol];
        if (av === bv) return 0;
        const cmp = av < bv ? -1 : 1;
        return this.orderAsc ? cmp : -cmp;
      });
    }
    if (this.rangeFrom != null && this.rangeTo != null) {
      matched = matched.slice(this.rangeFrom, this.rangeTo + 1);
    }
    if (this.limitN != null) {
      matched = matched.slice(0, this.limitN);
    }
    if (this.headOnly) {
      return { data: null, count: matched.length, error: null };
    }
    const data = embed(matched, this.selectCols);
    if (this.singleRow) return { data: data[0] ?? null, error: null };
    return { data, count: this.countExact ? matched.length : null, error: null };
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export const supabaseAdmin = {
  from(tableName: string) {
    return new Builder(db, tableName);
  },
};

// Webhook stub — records deliveries instead of hitting the DB/network
export async function deliverWebhookToMerchant(merchantId: string, eventType: string, data: any) {
  webhookEvents.push({ merchantId, eventType, data });
}
