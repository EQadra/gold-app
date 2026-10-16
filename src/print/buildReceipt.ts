import type { ReceiptData } from './types';

const fmt = (n: number, d = 2) =>
  Number(n).toLocaleString('es-ES', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });

interface BuildInput {
  companyName: string;
  companyInfo?: string;
  form: {
    client_name: string;
    price_oz_usd: string;
    eur_usd_rate: string;
    purity: string;
    grams: string;
    discount_percentage: string;
    is_investment: boolean;
    tipo_venta: 'compra' | 'venta';
  };
  calc: {
    eurPerGram: number;
    usdPerGram: number;
    subtotalEur: number;
    discountEur: number;
    vatApplied: boolean;
    vatEur: number;
    vatRate: number;
    totalEur: number;
    totalUsd: number;
  };
}

export function buildReceiptData({
  companyName,
  companyInfo,
  form,
  calc,
}: BuildInput): ReceiptData {
  const items = [
    { label: 'Precio onza', value: `${form.price_oz_usd} $` },
    { label: 'Tipo cambio', value: form.eur_usd_rate },
    { label: 'Ley', value: form.purity },
    { label: 'Gramos', value: `${form.grams} g` },
    ...(Number(form.discount_percentage) > 0
      ? [{ label: 'Descuento', value: `${form.discount_percentage}%` }]
      : []),
    { label: '€/gramo', value: `${fmt(calc.eurPerGram)} €` },
  ];

  const totals = [
    { label: 'Subtotal', value: `${fmt(calc.subtotalEur)} €` },
    ...(calc.discountEur > 0
      ? [{ label: 'Descuento', value: `-${fmt(calc.discountEur)} €` }]
      : []),
    ...(calc.vatApplied
      ? [
          {
            label: `IVA (${(calc.vatRate * 100).toFixed(0)}%)`,
            value: `${fmt(calc.vatEur)} €`,
          },
        ]
      : []),
    { label: 'TOTAL EUR', value: `${fmt(calc.totalEur)} €`, big: true },
    { label: 'TOTAL USD', value: `${fmt(calc.totalUsd)} $`, big: true },
  ];

  return {
    companyName,
    companyInfo,
    clientName: form.client_name || undefined,
    date: new Date().toLocaleString('es-ES'),
    tipoVenta: form.tipo_venta,
    items,
    totals,
    footer: 'Gracias por su preferencia',
  };
}