import type { CashRegister } from '@/src/types/api';
import { api } from './client';

export interface OpenCashPayload {
  opening_cash_eur: number;
  opening_gold?: number;
}

export interface CloseCashPayload {
  closing_cash_eur: number;
  closing_gold?: number;
}

export interface CashResponse<T = CashRegister> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedCash {
  success: boolean;
  data: {
    current_page: number;
    data: CashRegister[];
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const cashApi = {
  open: (payload: OpenCashPayload) =>
    api.post<CashResponse>('/cash-register/open', payload).then((r) => r.data),

  close: (payload: CloseCashPayload) =>
    api.post<CashResponse>('/cash-register/close', payload).then((r) => r.data),

  current: () =>
    api
      .get<CashResponse<CashRegister | null>>('/cash-register/current')
      .then((r) => r.data),

  today: () =>
    api
      .get<CashResponse<CashRegister | null>>('/cash-register/today')
      .then((r) => r.data),

  history: (page = 1) =>
    api
      .get<PaginatedCash>('/cash-register/history', { params: { page } })
      .then((r) => r.data),
};