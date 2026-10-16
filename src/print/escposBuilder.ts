import type { ReceiptData } from './types';

/**
 * Tipos de "jobs" que soporta el builder.
 * El driver Bluetooth los traduce a métodos de react-native-esc-pos-printer.
 */
export type PrintJob =
  | {
      type: 'text';
      text: string;
      align?: 'left' | 'center' | 'right';
      bold?: boolean;
      size?: 'normal' | 'large';
    }
  | {
      type: 'columns';
      cols: { text: string; width: number; align: 'left' | 'right' }[];
      bold?: boolean;
      size?: 'normal' | 'large';
    }
  | { type: 'divider'; char?: string }
  | { type: 'feed'; lines: number }
  | { type: 'cut' }
  | { type: 'cashbox' };

const WIDTH = 32;

function mkColumns(
  label: string,
  value: string,
  opts?: { bold?: boolean; size?: 'normal' | 'large' }
): PrintJob {
  return {
    type: 'columns',
    cols: [
      { text: label, width: Math.floor(WIDTH * 0.6), align: 'left' },
      { text: value, width: Math.floor(WIDTH * 0.4), align: 'right' },
    ],
    bold: opts?.bold,
    size: opts?.size,
  };
}

export function buildPrintJobs(r: ReceiptData): PrintJob[] {
  const jobs: PrintJob[] = [];

  // Cabecera
  jobs.push({ type: 'text', text: r.companyName, align: 'center', bold: true, size: 'large' });
  if (r.companyInfo) {
    jobs.push({ type: 'text', text: r.companyInfo, align: 'center' });
  }
  jobs.push({ type: 'divider' });

  // Datos generales
  if (r.clientName) jobs.push({ type: 'text', text: `Cliente: ${r.clientName}` });
  jobs.push({ type: 'text', text: `Fecha:   ${r.date}` });
  jobs.push({ type: 'text', text: `Tipo:    ${r.tipoVenta.toUpperCase()}` });
  jobs.push({ type: 'divider' });

  // Items
  for (const it of r.items) {
    jobs.push(mkColumns(it.label, it.value));
  }
  jobs.push({ type: 'divider' });

  // Totales
  for (const t of r.totals) {
    jobs.push(
      mkColumns(t.label, t.value, {
        bold: !!t.big,
        size: t.big ? 'large' : 'normal',
      })
    );
  }
  jobs.push({ type: 'divider' });

  // Footer
  if (r.footer) {
    jobs.push({ type: 'text', text: r.footer, align: 'center' });
  }

  // Espacio y corte
  jobs.push({ type: 'feed', lines: 3 });
  jobs.push({ type: 'cut' });

  return jobs;
}