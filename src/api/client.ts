import { storage } from '@/src/utils/storage';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.137:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// —— Request: adjunta token si existe ——
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// —— Response: normaliza errores ——
export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<any>) => {
    const status = error.response?.status;
    const data = error.response?.data;

    // Token expirado / inválido → limpiamos
    if (status === 401) {
      await storage.clear();
    }

    const apiError: ApiError = {
      message:
        data?.message ??
        (status === 422 ? 'Datos inválidos' : 'Error de conexión'),
      status,
      errors: data?.errors,
    };

    return Promise.reject(apiError);
  }
);