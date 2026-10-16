import type { News } from '@/src/types/api';
import { api } from './client';

export interface NewsResponse {
  success: boolean;
  message?: string;
  data: News;
}

export interface NewsListResponse {
  success: boolean;
  data: News[];
}

export interface CreateNewsPayload {
  titulo: string;
  descripcion: string;
  url?: string | null;
  fecha_publicacion?: string; // YYYY-MM-DD
}

export const newsApi = {
  list: () =>
    api.get<NewsListResponse>('/news').then((r) => r.data),

  show: (id: number) =>
    api.get<NewsResponse>(`/news/${id}`).then((r) => r.data),

  create: (payload: CreateNewsPayload) =>
    api.post<NewsResponse>('/news', payload).then((r) => r.data),

  update: (id: number, payload: Partial<CreateNewsPayload>) =>
    api.put<NewsResponse>(`/news/${id}`, payload).then((r) => r.data),

  destroy: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/news/${id}`).then((r) => r.data),
};