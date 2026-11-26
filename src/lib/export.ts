// CSV export: UTF-8 with BOM (umlauts in Excel), semicolon delimiter (DE/AT Excel locale),
// spreadsheet formula-injection protection, export metadata in the first line.

const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(v: unknown): string {
  let s = v === undefined || v === null ? '' : String(v);
  if (FORMULA_START.test(s)) s = `'${s}`; // neutralise formulas from untrusted text
  if (/[;"\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(rows: Record<string, unknown>[], meta?: Record<string, string>): string {
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const lines: string[] = [];
  if (meta) lines.push(csvCell(`WINGS CONTROL export · ${new Date().toISOString()} · ${Object.entries(meta).map(([k, v]) => `${k}=${v}`).join(', ')}`));
  lines.push(headers.map(csvCell).join(';'));
  rows.forEach((r) => lines.push(headers.map((h) => csvCell(r[h])).join(';')));
  return '﻿' + lines.join('\r\n');
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[], meta?: Record<string, string>) {
  const blob = new Blob([toCsv(rows, meta)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
