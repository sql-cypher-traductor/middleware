/**
 * Servicio para restablecimiento de contraseña
 */

import { api } from "./api";

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  new_password: string;
}

const PASSWORD_ENDPOINTS = {
  FORGOT: "/api/auth/forgot-password",
  RESET: "/api/auth/reset-password",
} as const;

export const passwordService = {
  /**
   * Solicita un enlace de restablecimiento de contraseña
   */
  async forgotPassword(data: ForgotPasswordData): Promise<{ message: string }> {
    return api.post<{ message: string }>(PASSWORD_ENDPOINTS.FORGOT, data, {
      requiresCsrf: false,
    });
  },

  /**
   * Restablece la contraseña con el token recibido
   */
  async resetPassword(data: ResetPasswordData): Promise<{ message: string }> {
    return api.post<{ message: string }>(PASSWORD_ENDPOINTS.RESET, data, {
      requiresCsrf: false,
    });
  },
};

export default passwordService;
