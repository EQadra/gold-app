import type { ReceiptData } from './types';

const WIDTH = 32;

function center(text: string): string {
  const pad = Math.max(0, Math.floor((WIDTH - text.length) / 2));
  return ' '.repeat(pad) + text;
}

function line(char = '-'): string {
  return char.repeat(WIDTH);
}

function row(label: string, value: string): string {
  const space = WIDTH - label.length - value.length;
  if (space <= 0) return `${label}\n${value}`;
  return `${label}${' '.repeat(space)}${value}`;
}

export function buildPlainReceipt(r: ReceiptData): string {
  const rows: string[] = [];

  rows.push(center(r.companyName));
  if (r.companyInfo) rows.push(center(r.companyInfo));
  rows.push(line());

  if (r.clientName) rows.push(`Cliente: ${r.clientName}`);
  rows.push(`Fecha:   ${r.date}`);
  rows.push(`Tipo:    ${r.tipoVenta.toUpperCase()}`);
  rows.push(line());

  for (const it of r.items) {
    rows.push(row(it.label, it.value));
  }
  rows.push(line());

  for (const t of r.totals) {
    rows.push(row(t.label, t.value));
  }

  if (r.footer) {
    rows.push(line());
    rows.push(center(r.footer));
  }

  return rows.join('\n');
}

export function buildReceiptHtml(r: ReceiptData, widthMm = 58): string {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { margin: 0; size: ${widthMm}mm auto; }
  body {
    font-family: 'Courier New', monospace;
    width: ${widthMm}mm;
    padding: 3mm;
    font-size: 11px;
    color: #000;
    margin: 0;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .big { font-size: 14px; font-weight: bold; }
  hr { border: none; border-top: 1px dashed #000; margin: 4px 0; }
  .row { display: flex; justify-content: space-between; gap: 8px; }
  .row span:last-child { text-align: right; white-space: nowrap; }
  .footer { margin-top: 6px; text-align: center; font-size: 10px; }
</style>
</head>
<body>
  <div class="center bold">${escape(r.companyName)}</div>
  ${r.companyInfo ? `<div class="center">${escape(r.companyInfo)}</div>` : ''}
  <hr/>
  ${r.clientName ? `<div>Cliente: ${escape(r.clientName)}</div>` : ''}
  <div>Fecha: ${escape(r.date)}</div>
  <div>Tipo: ${r.tipoVenta.toUpperCase()}</div>
  <hr/>
  ${r.items
    .map(
      (it) =>
        `<div class="row"><span>${escape(it.label)}</span><span>${escape(it.value)}</span></div>`
    )
    .join('')}
  <hr/>
  ${r.totals
    .map(
      (t) =>
        `<div class="row ${t.big ? 'big' : ''}"><span>${escape(t.label)}</span><span>${escape(t.value)}</span></div>`
    )
    .join('')}
  ${r.footer ? `<hr/><div class="footer">${escape(r.footer)}</div>` : ''}
</body>
</html>`.trim();
}

function escape(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}