/**
 * Tipos para el módulo de conexiones a bases de datos
 */

// Tipos de motor de base de datos
export type EngineType = "SQL_SERVER" | "NEO4J";

// Conexión base
export interface ConnectionBase {
  connection_name: string;
  engine_type: EngineType;
  host: string;
  port: number;
  database_name: string;
  username_db: string;
}

// Request para crear conexión
export interface ConnectionCreateRequest extends ConnectionBase {
  password_db: string;
}

// Request para actualizar conexión
export interface ConnectionUpdateRequest {
  connection_name?: string;
  host?: string;
  port?: number;
  database_name?: string;
  username_db?: string;
  password_db?: string;
}

// Respuesta de conexión
export interface ConnectionResponse extends ConnectionBase {
  connection_id: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

// Request para probar conexión
export interface ConnectionTestRequest extends ConnectionBase {
  password_db: string;
}

// Respuesta de test de conexión
export interface ConnectionTestResponse {
  success: boolean;
  message: string;
  engine_type: EngineType;
}

// Columna de tabla
export interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  character_maximum_length: number | null;
}

// Tabla con columnas
export interface TableSchema {
  table_name: string;
  table_schema: string;
  columns: TableColumn[];
}

// Esquema de base de datos
export interface DatabaseSchema {
  database_name: string;
  tables: TableSchema[];
}

// Lista paginada de conexiones
export interface ConnectionListResponse {
  connections: ConnectionResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Conexiones activas
export interface ActiveConnections {
  sql_server: ConnectionResponse | null;
  neo4j: ConnectionResponse | null;
}

// Estado de conexión para UI
export interface ConnectionState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

