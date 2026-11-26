import type { ISODate } from '../types';

const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(): ISODate {
  return toISODate(new Date());
}

export function addDays(base: ISODate | Date, days: number): ISODate {
  const d = typeof base === 'string' ? parseISO(base) : new Date(base);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function parseISO(s: ISODate): Date {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function fmtDate(s?: string): string {
  if (!s) return '—';
  const d = parseISO(s);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function fmtShort(s?: string): string {
  if (!s) return '—';
  const d = parseISO(s);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]}`;
}

export function fmtDateTime(s?: string): string {
  if (!s) return '—';
  const d = new Date(s);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function relDays(s?: ISODate, today: ISODate = todayISO()): string {
  if (!s) return '';
  const n = daysBetween(today, s);
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n === -1) return 'yesterday';
  return n > 0 ? `in ${n} d` : `${-n} d overdue`;
}

export function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 60_000;
  if (diff < 1) return 'just now';
  if (diff < 60) return `${Math.round(diff)} min ago`;
  if (diff < 60 * 24) return `${Math.round(diff / 60)} h ago`;
  return `${Math.round(diff / 1440)} d ago`;
}

/** ISO-8601 calendar week. */
export function isoWeek(s: ISODate): number {
  const d = parseISO(s);
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - y0.getTime()) / 86_400_000 + 1) / 7);
}

export function startOfIsoWeek(s: ISODate): ISODate {
  const d = parseISO(s);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return toISODate(d);
}
