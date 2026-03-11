/**
 * Tipos para el módulo de logs y estadísticas
 */

// Niveles de log
export type LogLevel = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

// Log individual
export interface LogItem {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  level: LogLevel;
  action: string;
  resource: string | null;
  message: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// Respuesta paginada de logs
export interface LogListResponse {
  logs: LogItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Conteo por nivel
export interface LogCountByLevel {
  level: string;
  count: number;
  color: string;
}

// Conteo por acción
export interface LogCountByAction {
  action: string;
  count: number;
}

// Conteo por día
export interface LogCountByDay {
  date: string;
  count: number;
}

// Estadísticas del sistema
export interface SystemStats {
  total_users: number;
  active_users: number;
  total_queries: number;
  successful_queries: number;
  failed_queries: number;
  success_rate: number;
  avg_translation_time: number | null;
  avg_execution_time: number | null;
  errors_today: number;
  logs_today: number;
}

// Respuesta completa de estadísticas
export interface LogStatsResponse {
  system_stats: SystemStats;
  logs_by_level: LogCountByLevel[];
  logs_by_action: LogCountByAction[];
  logs_by_day: LogCountByDay[];
  recent_errors: LogItem[];
  available_actions: string[];
}

export interface QueryCountByDay {
  date: string;
  total: number;
  translated: number;
  executed: number;
  failed: number;
}

export interface QueryStatusDistribution {
  status: string;
  count: number;
  color: string;
}

export interface UsageStats {
  total_users: number;
  active_users: number;
  users_logged_in_today: number;
  new_users_this_week: number;
  total_queries: number;
  queries_today: number;
  queries_this_week: number;
  translated_queries: number;
  executed_queries: number;
  failed_queries: number;
  success_rate: number;
  avg_translation_time_ms: number | null;
  avg_execution_time_ms: number | null;
  total_connections: number;
  active_connections: number;
}

export interface UsageStatsResponse {
  stats: UsageStats;
  queries_by_day: QueryCountByDay[];
  query_status_distribution: QueryStatusDistribution[];
}

export interface LogFilters {
  page?: number;
  page_size?: number;
  level?: LogLevel | "";
  action?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  INFO: "#3b82f6",
  WARNING: "#f59e0b",
  ERROR: "#ef4444",
  CRITICAL: "#dc2626",
};

export const LOG_LEVEL_BG_COLORS: Record<LogLevel, string> = {
  INFO: "rgba(59, 130, 246, 0.15)",
  WARNING: "rgba(245, 158, 11, 0.15)",
  ERROR: "rgba(239, 68, 68, 0.15)",
  CRITICAL: "rgba(220, 38, 38, 0.2)",
};

