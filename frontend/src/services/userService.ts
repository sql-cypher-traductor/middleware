/**
 * Servicio para operaciones de usuario
 */

import { api } from "./api";
import type { UserResponse } from "@/types/auth";

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

const USER_ENDPOINTS = {
  PROFILE: "/api/users/me",
  CHANGE_PASSWORD: "/api/users/me/change-password",
} as const;

export const userService = {
  async getProfile(): Promise<UserResponse> {
    return api.get<UserResponse>(USER_ENDPOINTS.PROFILE);
  },

  async updateProfile(data: UpdateProfileData): Promise<UserResponse> {
    return api.patch<UserResponse>(USER_ENDPOINTS.PROFILE, data);
  },

  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    return api.post<{ message: string }>(USER_ENDPOINTS.CHANGE_PASSWORD, data);
  },
};

export default userService;
