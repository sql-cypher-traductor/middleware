/**
 * Servicio para ejecutar consultas y obtener traducciones
 */

import { api } from "./api";
import type {
  ExecutionRequest,
  ExecutionResponse,
  TranslateAndExecuteRequest,
  TranslationResponse,
  QueryHistoryListResponse,
  QueryHistoryItem,
} from "@/types/execution";

/**
 * Servicio de traducción y ejecución
 */
export const executionService = {
  /**
   * Traducir SQL a Cypher
   */
  async translate(sql: string): Promise<TranslationResponse> {
    return api.post<TranslationResponse>("/translator/translate", { sql });
  },

  /**
   * Ejecutar consulta Cypher directamente
   */
  async executeCypher(request: ExecutionRequest): Promise<ExecutionResponse> {
    return api.post<ExecutionResponse>("/execution/cypher", request);
  },

  /**
   * Traducir SQL y ejecutar en Neo4j
   */
  async translateAndExecute(
    request: TranslateAndExecuteRequest
  ): Promise<ExecutionResponse> {
    return api.post<ExecutionResponse>(
      "/execution/translate-and-execute",
      request
    );
  },

  /**
   * Obtener historial de consultas
   */
  async getHistory(
    page: number = 1,
    pageSize: number = 10,
    status?: string,
    connectionId?: string
  ): Promise<QueryHistoryListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (status) {
      params.append("status", status);
    }
    if (connectionId) {
      params.append("connection_id", connectionId);
    }
    return api.get<QueryHistoryListResponse>(
      `/execution/history?${params.toString()}`
    );
  },

  /**
   * Obtener una consulta del historial
   */
  async getQueryById(queryId: string): Promise<QueryHistoryItem> {
    return api.get<QueryHistoryItem>(`/execution/history/${queryId}`);
  },

  /**
   * Eliminar una consulta del historial
   */
  async deleteQuery(queryId: string): Promise<{ message: string }> {
    return api.delete<{ message: string }>(`/execution/history/${queryId}`);
  },

  /**
   * Limpiar todo el historial
   */
  async clearHistory(): Promise<{ message: string; deleted_count: number }> {
    return api.delete<{ message: string; deleted_count: number }>(
      "/execution/history"
    );
  },
};

