/**
 * Servicio para operaciones de administración
 */

import { api } from "./api";
import type {
  LogListResponse,
  LogStatsResponse,
  LogFilters,
  UsageStatsResponse,
} from "@/types/logs";

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
  LOGS: "/api/admin/logs",
  STATS: "/api/admin/stats",
  USAGE_STATS: "/api/admin/usage-stats",
  EXPORT_CSV: "/api/admin/logs/export/csv",
  EXPORT_JSON: "/api/admin/logs/export/json",
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

  // ==================== LOGS ====================

  /**
   * Obtiene logs del sistema con paginación y filtros
   */
  async getLogs(filters?: LogFilters): Promise<LogListResponse> {
    const queryParams = new URLSearchParams();
    if (filters?.page) queryParams.append("page", filters.page.toString());
    if (filters?.page_size) queryParams.append("page_size", filters.page_size.toString());
    if (filters?.level) queryParams.append("level", filters.level);
    if (filters?.action) queryParams.append("action", filters.action);
    if (filters?.user_id) queryParams.append("user_id", filters.user_id);
    if (filters?.start_date) queryParams.append("start_date", filters.start_date);
    if (filters?.end_date) queryParams.append("end_date", filters.end_date);
    if (filters?.search) queryParams.append("search", filters.search);

    const query = queryParams.toString();
    const url = query ? `${ADMIN_ENDPOINTS.LOGS}?${query}` : ADMIN_ENDPOINTS.LOGS;
    return api.get<LogListResponse>(url);
  },

  // ==================== ESTADÍSTICAS ====================

  /**
   * Obtiene estadísticas de logs del sistema
   */
  async getStats(days: number = 30): Promise<LogStatsResponse> {
    return api.get<LogStatsResponse>(`${ADMIN_ENDPOINTS.STATS}?days=${days}`);
  },

  /**
   * Obtiene estadísticas de uso del sistema (usuarios, consultas, conexiones)
   */
  async getUsageStats(days: number = 30): Promise<UsageStatsResponse> {
    return api.get<UsageStatsResponse>(`${ADMIN_ENDPOINTS.USAGE_STATS}?days=${days}`);
  },

  // ==================== EXPORTACIÓN ====================

  /**
   * Obtiene URL para exportar logs a CSV
   */
  getExportCsvUrl(filters?: Partial<LogFilters>): string {
    const baseUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const queryParams = new URLSearchParams();
    if (filters?.level) queryParams.append("level", filters.level);
    if (filters?.action) queryParams.append("action", filters.action);
    if (filters?.start_date) queryParams.append("start_date", filters.start_date);
    if (filters?.end_date) queryParams.append("end_date", filters.end_date);

    const query = queryParams.toString();
    return query ? `${baseUrl}${ADMIN_ENDPOINTS.EXPORT_CSV}?${query}` : `${baseUrl}${ADMIN_ENDPOINTS.EXPORT_CSV}`;
  },

  /**
   * Obtiene URL para exportar logs a JSON
   */
  getExportJsonUrl(filters?: Partial<LogFilters>): string {
    const baseUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const queryParams = new URLSearchParams();
    if (filters?.level) queryParams.append("level", filters.level);
    if (filters?.action) queryParams.append("action", filters.action);
    if (filters?.start_date) queryParams.append("start_date", filters.start_date);
    if (filters?.end_date) queryParams.append("end_date", filters.end_date);

    const query = queryParams.toString();
    return query ? `${baseUrl}${ADMIN_ENDPOINTS.EXPORT_JSON}?${query}` : `${baseUrl}${ADMIN_ENDPOINTS.EXPORT_JSON}`;
  },
};

export default adminService;


