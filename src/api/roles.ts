import { api } from './client';

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  permissions?: { id: number; name: string }[];
  created_at?: string;
}

export interface RoleListResponse {
  success: boolean;
  data: Role[];
}

export interface RoleResponse {
  success: boolean;
  data: Role;
}

export const rolesApi = {
  /**
   * GET /api/roles
   * Devuelve los roles asignables (excluye "owner").
   */
  list: () =>
    api.get<RoleListResponse>('/roles').then((r) => r.data),

  /**
   * GET /api/roles/{id}
   */
  show: (id: number) =>
    api.get<RoleResponse>(`/roles/${id}`).then((r) => r.data),
};