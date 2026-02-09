/**
 * Servicio para operaciones de administración
 */

import { api } from "./api";

export interface AdminUser {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "Desarrollador" | "Administrador";
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  deleted_at: string | null;
}

export interface UsersListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  role?: "Desarrollador" | "Administrador";
  is_active?: boolean;
}

export interface UsersQueryParams {
  search?: string;
  role?: string;
  page?: number;
  page_size?: number;
}

const ADMIN_ENDPOINTS = {
  USERS: "/api/admin/users",
} as const;

export const adminService = {
  /**
   * Obtiene la lista de usuarios con paginación y filtros
   */
  async getUsers(params?: UsersQueryParams): Promise<UsersListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append("search", params.search);
    if (params?.role) queryParams.append("role", params.role);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.page_size) queryParams.append("page_size", params.page_size.toString());

    const query = queryParams.toString();
    const url = query ? `${ADMIN_ENDPOINTS.USERS}?${query}` : ADMIN_ENDPOINTS.USERS;
    return api.get<UsersListResponse>(url);
  },

  /**
   * Actualiza un usuario (rol, estado, datos básicos)
   */
  async updateUser(userId: string, data: UpdateUserData): Promise<AdminUser> {
    return api.patch<AdminUser>(`${ADMIN_ENDPOINTS.USERS}/${userId}`, data);
  },

  /**
   * Elimina un usuario (soft delete)
   */
  async deleteUser(userId: string): Promise<{ message: string }> {
    return api.delete<{ message: string }>(`${ADMIN_ENDPOINTS.USERS}/${userId}`);
  },
};

export default adminService;


