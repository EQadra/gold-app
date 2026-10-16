/**
 * Fórmula España:
 *  - Precio por gramo puro = (price_oz_usd / 31.1034768) * eur_usd_rate
 *  - Precio por gramo ajustado a ley = precio_gramo_puro * purity
 *  - Descuento = subtotal * (discount_pct / 100)
 *  - IVA:
 *      - Si is_investment = true → 0% (exento)
 *      - Si is_investment = false → 21% (España)
 *  - Total = (subtotal - descuento) + IVA
 */

const GRAMS_PER_OUNCE = 31.1034768;
const VAT_RATE = 0.21; // 21% España

export interface GoldCalcInput {
  grams: number;
  purity: number;
  priceOzUsd: number;
  eurUsdRate: number;
  discountPct?: number;
  isInvestment?: boolean;
}

export interface GoldCalcResult {
  // Precios por gramo
  eurPerGramPure: number;      // gramo puro 24k
  eurPerGram: number;          // ajustado a ley
  usdPerGram: number;

  // Subtotal / IVA / Total
  subtotalEur: number;
  discountEur: number;
  vatRate: number;             // 0 o 0.21
  vatApplied: boolean;
  vatEur: number;
  totalEur: number;
  totalUsd: number;

  // Derivados
  eurPerGramVat: number;       // con IVA incluido (solo informativo)
}

export function calculateGold(input: GoldCalcInput): GoldCalcResult {
  const {
    grams = 0,
    purity = 0,
    priceOzUsd = 0,
    eurUsdRate = 0,
    discountPct = 0,
    isInvestment = true,
  } = input;

  // Guardamos contra NaN
  const g = Number.isFinite(grams) ? grams : 0;
  const p = Number.isFinite(purity) ? purity : 0;
  const oz = Number.isFinite(priceOzUsd) ? priceOzUsd : 0;
  const rate = Number.isFinite(eurUsdRate) ? eurUsdRate : 0;
  const dct = Number.isFinite(discountPct) ? discountPct : 0;

  // Precio por gramo puro
  const usdPerGramPure = oz / GRAMS_PER_OUNCE;
  const eurPerGramPure = usdPerGramPure * rate;

  // Precio por gramo ajustado a ley
  const eurPerGram = eurPerGramPure * p;
  const usdPerGram = usdPerGramPure * p;

  // Subtotal
  const subtotalEur = eurPerGram * g;

  // Descuento
  const discountEur = subtotalEur * (dct / 100);
  const afterDiscount = subtotalEur - discountEur;

  // IVA
  const vatApplied = !isInvestment;
  const vatRate = vatApplied ? VAT_RATE : 0;
  const vatEur = afterDiscount * vatRate;

  const totalEur = afterDiscount + vatEur;
  const totalUsd = rate > 0 ? totalEur / rate : 0;

  // Precio por gramo con IVA
  const eurPerGramVat = g > 0 ? totalEur / g : eurPerGram;

  return {
    eurPerGramPure,
    eurPerGram,
    usdPerGram,
    subtotalEur,
    discountEur,
    vatRate,
    vatApplied,
    vatEur,
    totalEur,
    totalUsd,
    eurPerGramVat,
  };
}