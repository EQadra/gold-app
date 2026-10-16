import type { AuthResponse, ProfileResponse } from '@/src/types/api';
import { api } from './client';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  company_name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    api.post<AuthResponse>('/register', payload).then((r) => r.data),

  login: (payload: LoginPayload) =>
    api.post<AuthResponse>('/login', payload).then((r) => r.data),

  logout: () => api.post('/logout').then((r) => r.data),

  profile: () =>
    api.get<ProfileResponse>('/profile').then((r) => r.data),
  
  changePassword: (payload: {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
  }) =>
    api
      .post('/change-password', payload)
      .then((r) => r.data),
};