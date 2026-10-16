import type { Transaction } from '@/src/types/api';
import { api } from './client';

export interface CreateTransactionPayload {
  grams: number;
  purity: number;         // 0.01–1 (0.75 = 75%)
  price_oz_usd: number;
  eur_usd_rate: number;
  discount_percentage?: number;
  is_investment?: boolean;
  client_name?: string;
  tipo_venta?: 'compra' | 'venta';
}

export interface TransactionCalcResponse {
  success: boolean;
  message: string;
  data: Transaction;
  calculo: {
    eur_per_gram: number;
    eur_per_gram_con_iva: number;
    iva_aplicado: boolean;
    iva_tasa: number;
    subtotal_eur: number;
    iva_eur: number;
    total_eur: number;
  };
}

export interface DayTotals {
  total_eur: number;
  total_usd: number;
  grams: number;
  count: number;
}

export interface PaginatedTransactions {
  success: boolean;
  data: {
    current_page: number;
    data: Transaction[];
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface DayResponse {
  success: boolean;
  data: Transaction[];
  totales: DayTotals;
}

export const transactionsApi = {
  list: (page = 1) =>
    api
      .get<PaginatedTransactions>('/transactions', { params: { page } })
      .then((r) => r.data),

  create: (payload: CreateTransactionPayload) =>
    api
      .post<TransactionCalcResponse>('/transactions', payload)
      .then((r) => r.data),

  day: () =>
    api.get<DayResponse>('/transactions/day').then((r) => r.data),
};