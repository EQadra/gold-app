import { api } from './client';

/* ============================================================
   TIPOS
   ============================================================ */

export interface UserWithRoles {
  id: number;
  name: string;
  email: string;
  telefono?: string | null;
  genero?: 'masculino' | 'femenino' | 'otro' | null;
  avatar?: string | null;
  roles: string[];
  created_at?: string;
}

export interface UserResponse {
  success: boolean;
  message?: string;
  data: UserWithRoles;
}

export interface UserListResponse {
  success: boolean;
  data: UserWithRoles[];
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  telefono?: string;
  genero?: 'masculino' | 'femenino' | 'otro';
  role: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  telefono?: string;
  genero?: 'masculino' | 'femenino' | 'otro';
  role?: string;
}

export interface DeleteUserResponse {
  success: boolean;
  message: string;
}

/* ============================================================
   API
   ============================================================ */

export const usersApi = {
  /**
   * GET /api/users
   * Lista los usuarios de la empresa del usuario autenticado.
   */
  list: () =>
    api.get<UserListResponse>('/users').then((r) => r.data),

  /**
   * GET /api/users/{id}
   */
  show: (id: number) =>
    api.get<UserResponse>(`/users/${id}`).then((r) => r.data),

  /**
   * POST /api/users
   * Crea un usuario. No puede asignarse el rol "owner".
   */
  create: (payload: CreateUserPayload) =>
    api.post<UserResponse>('/users', payload).then((r) => r.data),

  /**
   * PUT /api/users/{id}
   */
  update: (id: number, payload: UpdateUserPayload) =>
    api.put<UserResponse>(`/users/${id}`, payload).then((r) => r.data),

  /**
   * DELETE /api/users/{id}
   * No puedes eliminar tu propio usuario ni al owner.
   */
  destroy: (id: number) =>
    api.delete<DeleteUserResponse>(`/users/${id}`).then((r) => r.data),
};