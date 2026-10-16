/* ============================================================
   FORMATO — utilidades centralizadas
   ============================================================ */

/**
 * Formatea un número con separadores de miles en formato español.
 * @param v - Valor a formatear (number, string, null, undefined)
 * @param digits - Decimales a mostrar (default 2)
 * @returns Ej: "1.234,56"
 */
export const fmt = (
  v: number | string | null | undefined,
  digits = 2
): string => {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('es-ES', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

/**
 * Formato compacto (sin decimales forzados). Ideal para listas.
 * Ej: "1.234,56" o "1.234"
 */
export const fmtCompact = (
  v: number | string | null | undefined
): string => {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('es-ES', { maximumFractionDigits: 3 });
};

/** Euros con símbolo. */
export const fmtEur = (
  v: number | string | null | undefined,
  digits = 2
): string => `${fmt(v, digits)} €`;

/** Dólares con símbolo. */
export const fmtUsd = (
  v: number | string | null | undefined,
  digits = 2
): string => `${fmt(v, digits)} $`;

/** Gramos con símbolo. */
export const fmtGrams = (
  v: number | string | null | undefined,
  digits = 3
): string => `${fmt(v, digits)} g`;

/**
 * Convierte string con coma o punto a number.
 * Ej: "1.234,56" → 1234.56 | "12,5" → 12.5
 */
export const toNum = (s: string | number | null | undefined): number => {
  if (typeof s === 'number') return Number.isFinite(s) ? s : 0;
  if (!s) return 0;
  const n = parseFloat(String(s).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

/** Fecha ISO → "7 oct 2025". */
export const fmtDate = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/** Fecha ISO → "7 oct 2025, 14:30". */
export const fmtDateTime = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** Hora actual "14:30:22". */
export const nowTime = (): string =>
  new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

/** Fecha actual "7 oct 2025". */
export const today = (): string =>
  new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });