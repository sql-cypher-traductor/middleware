/**
 * Tipos para la API de autenticación
 */

// Usuario
export interface UserResponse {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "Administrador" | "Desarrollador";
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

// Request de Login
export interface LoginRequest {
  email: string;
  password: string;
}

// Request de Registro
export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

// Response de Login
export interface LoginResponse {
  user: UserResponse;
  message: string;
}

// Response de Registro (igual que User)
export type RegisterResponse = UserResponse;

// Response de Error
export interface ApiError {
  detail: string;
  status?: number;
}

// Estado de autenticación
export interface AuthState {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

