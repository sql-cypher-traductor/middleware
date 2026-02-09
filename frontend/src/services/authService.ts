/**
 * Servicio de autenticación
 * Maneja login, registro, logout y obtención del usuario actual
 */

import {api, ApiError} from "./api";
import type {LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, UserResponse,} from "@/types/auth";

/**
 * Endpoints de autenticación
 */
const AUTH_ENDPOINTS = {
  LOGIN: "/api/auth/login",
  REGISTER: "/api/auth/register",
  LOGOUT: "/api/auth/logout",
  ME: "/api/auth/me",
  REFRESH_CSRF: "/api/auth/refresh-csrf",
} as const;

/**
 * Servicio de autenticación
 */
export const authService = {
  /**
   * Inicia sesión con email y contraseña
   * El backend establece las cookies HttpOnly automáticamente
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return await api.post<LoginResponse>(
        AUTH_ENDPOINTS.LOGIN,
        credentials,
        {requiresCsrf: false} // Login no requiere CSRF (no hay sesión aún)
    );
  },

  /**
   * Registra un nuevo usuario
   */
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    return await api.post<RegisterResponse>(
        AUTH_ENDPOINTS.REGISTER,
        userData,
        {requiresCsrf: false} // Registro no requiere CSRF
    );
  },

  /**
   * Cierra la sesión actual
   * Elimina las cookies de autenticación
   */
  async logout(): Promise<void> {
    await api.post(AUTH_ENDPOINTS.LOGOUT, null, { requiresCsrf: true });
  },

  /**
   * Obtiene el usuario actual autenticado
   * Usa la cookie HttpOnly para autenticarse
   */
  async getCurrentUser(): Promise<UserResponse> {
    return await api.get<UserResponse>(AUTH_ENDPOINTS.ME);
  },

  /**
   * Refresca el token CSRF
   * Útil cuando el CSRF expira pero el JWT sigue siendo válido
   */
  async refreshCsrf(): Promise<void> {
    await api.post(AUTH_ENDPOINTS.REFRESH_CSRF, null, { requiresCsrf: false });
  },

  /**
   * Verifica si el usuario está autenticado
   * Intenta obtener el usuario actual, si falla no está autenticado
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  },
};

export { ApiError };
export default authService;

