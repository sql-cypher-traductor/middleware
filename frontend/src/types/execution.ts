/**
 * Tipos para el módulo de ejecución de consultas
 */

// Estado de la consulta
export type QueryStatus = "Pendiente" | "Traducida" | "Ejecutada" | "Fallida";

// Nodo del grafo
export interface GraphNode {
  id: number;
  labels: string[];
  properties: Record<string, unknown>;
}

// Relación del grafo
export interface GraphRelationship {
  id: number;
  type: string;
  start_node_id: number;
  end_node_id: number;
  properties: Record<string, unknown>;
}

// Datos del grafo para visualización
export interface GraphData {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
}

// Datos tabulares
export interface TabularData {
  columns: string[];
  rows: Record<string, unknown>[];
}

// Estadísticas de ejecución
export interface ExecutionStatistics {
  execution_time: number;
  nodes_created: number;
  nodes_deleted: number;
  relationships_created: number;
  relationships_deleted: number;
  properties_set: number;
  labels_added: number;
  labels_removed: number;
  rows_affected: number;
}

// Request para ejecutar Cypher
export interface ExecutionRequest {
  cypher_query: string;
  connection_id?: string;
  sql_query?: string;
}

// Request para traducir y ejecutar
export interface TranslateAndExecuteRequest {
  sql_query: string;
  connection_id?: string;
}

// Respuesta de ejecución
export interface ExecutionResponse {
  query_id: string;
  cypher_query: string | null;
  sql_query: string | null;
  status: QueryStatus;
  graph_data: GraphData | null;
  tabular_data: TabularData | null;
  statistics: ExecutionStatistics | null;
  error_message: string | null;
  executed_at: string;
}

// Respuesta de traducción
export interface TranslationResponse {
  sql: string;
  cypher: string;
  statement_type: string;
  translation_time: number;
}

// Historial de consulta
export interface QueryHistoryItem {
  query_id: string;
  user_id: string;
  connection_id: string | null;
  sql_query: string;
  cypher_query: string | null;
  query_status: QueryStatus;
  failure_stage: string | null;
  error_message: string | null;
  translation_time: number | null;
  execution_time: number | null;
  result_details: Record<string, unknown> | null;
  created_at: string;
}

// Lista paginada de historial
export interface QueryHistoryListResponse {
  queries: QueryHistoryItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Formato del grafo para react-force-graph
export interface ForceGraphData {
  nodes: ForceGraphNode[];
  links: ForceGraphLink[];
}

export interface ForceGraphNode {
  id: string;
  label: string;
  labels: string[];
  properties: Record<string, unknown>;
  color?: string;
}

export interface ForceGraphLink {
  source: string;
  target: string;
  type: string;
  properties: Record<string, unknown>;
}

