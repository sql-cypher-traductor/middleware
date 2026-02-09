/**
 * Servicio para gestionar conexiones a bases de datos
 */

import { api } from "./api";
import type {
  ConnectionCreateRequest,
  ConnectionUpdateRequest,
  ConnectionResponse,
  ConnectionTestRequest,
  ConnectionTestResponse,
  ConnectionListResponse,
  DatabaseSchema,
  ActiveConnections,
  EngineType,
} from "@/types/connection";

/**
 * Servicio de conexiones a bases de datos
 */
export const connectionService = {
  /**
   * Obtener lista de conexiones paginada
   */
  async getConnections(
    page: number = 1,
    pageSize: number = 10,
    engineType?: EngineType
  ): Promise<ConnectionListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (engineType) {
      params.append("engine_type", engineType);
    }
    return api.get<ConnectionListResponse>(`/connections?${params.toString()}`);
  },

  /**
   * Obtener conexiones activas
   */
  async getActiveConnections(): Promise<ActiveConnections> {
    return api.get<ActiveConnections>("/connections/active");
  },

  /**
   * Obtener una conexión por ID
   */
  async getConnection(connectionId: string): Promise<ConnectionResponse> {
    return api.get<ConnectionResponse>(`/connections/${connectionId}`);
  },

  /**
   * Crear una nueva conexión
   */
  async createConnection(
    data: ConnectionCreateRequest
  ): Promise<ConnectionResponse> {
    return api.post<ConnectionResponse>("/connections", data);
  },

  /**
   * Actualizar una conexión existente
   */
  async updateConnection(
    connectionId: string,
    data: ConnectionUpdateRequest
  ): Promise<ConnectionResponse> {
    return api.put<ConnectionResponse>(`/connections/${connectionId}`, data);
  },

  /**
   * Eliminar una conexión
   */
  async deleteConnection(connectionId: string): Promise<{ message: string }> {
    return api.delete<{ message: string }>(`/connections/${connectionId}`);
  },

  /**
   * Activar una conexión
   */
  async activateConnection(connectionId: string): Promise<ConnectionResponse> {
    return api.post<ConnectionResponse>(`/connections/${connectionId}/activate`);
  },

  /**
   * Desactivar una conexión
   */
  async deactivateConnection(connectionId: string): Promise<ConnectionResponse> {
    return api.post<ConnectionResponse>(`/connections/${connectionId}/deactivate`);
  },

  /**
   * Probar una conexión volátil (sin guardar)
   */
  async testConnection(data: ConnectionTestRequest): Promise<ConnectionTestResponse> {
    return api.post<ConnectionTestResponse>("/connections/test", data);
  },

  /**
   * Probar una conexión guardada
   */
  async testSavedConnection(connectionId: string): Promise<ConnectionTestResponse> {
    return api.post<ConnectionTestResponse>(`/connections/${connectionId}/test`);
  },

  /**
   * Obtener el esquema de una base de datos SQL Server
   */
  async getDatabaseSchema(connectionId: string): Promise<DatabaseSchema> {
    return api.get<DatabaseSchema>(`/connections/${connectionId}/schema`);
  },
};

export default connectionService;

