"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Database,
  Share2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { connectionService } from "@/services/connectionService";
import { ConnectionFormModal } from "@/components/connections/ConnectionFormModal";
import { SchemaTreeView } from "@/components/connections/SchemaTreeView";
import type {
  ConnectionResponse,
  DatabaseSchema,
  ConnectionTestResponse,
} from "@/types/connection";

export function ConnectionsPanel() {
  // Lista de conexiones
  const [sqlConnections, setSqlConnections] = useState<ConnectionResponse[]>([]);
  const [neo4jConnections, setNeo4jConnections] = useState<ConnectionResponse[]>([]);

  // Conexiones seleccionadas
  const [selectedSqlId, setSelectedSqlId] = useState<string>("");
  const [selectedNeo4jId, setSelectedNeo4jId] = useState<string>("");

  // Estados de carga
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);
  const [isTestingSql, setIsTestingSql] = useState(false);
  const [isTestingNeo4j, setIsTestingNeo4j] = useState(false);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);

  // Resultados de tests
  const [sqlTestResult, setSqlTestResult] = useState<ConnectionTestResponse | null>(null);
  const [neo4jTestResult, setNeo4jTestResult] = useState<ConnectionTestResponse | null>(null);

  // Esquema de base de datos
  const [databaseSchema, setDatabaseSchema] = useState<DatabaseSchema | null>(null);

  // Modal de formulario
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cargar conexiones
  const loadConnections = useCallback(async () => {
    setIsLoadingConnections(true);
    try {
      // Cargar ambos tipos de conexiones
      const [sqlResponse, neo4jResponse] = await Promise.all([
        connectionService.getConnections(1, 50, "SQL_SERVER"),
        connectionService.getConnections(1, 50, "NEO4J"),
      ]);

      setSqlConnections(sqlResponse.connections);
      setNeo4jConnections(neo4jResponse.connections);

      // Seleccionar automáticamente conexiones activas
      const activeSql = sqlResponse.connections.find((c) => c.is_active);
      const activeNeo4j = neo4jResponse.connections.find((c) => c.is_active);

      if (activeSql) {
        setSelectedSqlId(activeSql.connection_id);
      } else if (sqlResponse.connections.length > 0) {
        setSelectedSqlId(sqlResponse.connections[0].connection_id);
      }

      if (activeNeo4j) {
        setSelectedNeo4jId(activeNeo4j.connection_id);
      } else if (neo4jResponse.connections.length > 0) {
        setSelectedNeo4jId(neo4jResponse.connections[0].connection_id);
      }
    } catch (error) {
      console.error("Error al cargar conexiones:", error);
    } finally {
      setIsLoadingConnections(false);
    }
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  // Probar conexión SQL
  const handleTestSql = async () => {
    if (!selectedSqlId) return;

    setIsTestingSql(true);
    setSqlTestResult(null);

    try {
      const result = await connectionService.testSavedConnection(selectedSqlId);
      setSqlTestResult(result);

      // Si la conexión es exitosa, cargar el esquema
      if (result.success) {
        loadSchema();
      }
    } catch (error) {
      setSqlTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Error al probar conexión",
        engine_type: "SQL_SERVER",
      });
    } finally {
      setIsTestingSql(false);
    }
  };

  // Probar conexión Neo4j
  const handleTestNeo4j = async () => {
    if (!selectedNeo4jId) return;

    setIsTestingNeo4j(true);
    setNeo4jTestResult(null);

    try {
      const result = await connectionService.testSavedConnection(selectedNeo4jId);
      setNeo4jTestResult(result);
    } catch (error) {
      setNeo4jTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Error al probar conexión",
        engine_type: "NEO4J",
      });
    } finally {
      setIsTestingNeo4j(false);
    }
  };

  // Cargar esquema de base de datos
  const loadSchema = async () => {
    if (!selectedSqlId) return;

    setIsLoadingSchema(true);
    setDatabaseSchema(null);

    try {
      const schema = await connectionService.getDatabaseSchema(selectedSqlId);
      setDatabaseSchema(schema);
    } catch (error) {
      console.error("Error al cargar esquema:", error);
    } finally {
      setIsLoadingSchema(false);
    }
  };

  // Cuando cambia la conexión SQL seleccionada
  useEffect(() => {
    if (selectedSqlId) {
      // Limpiar estados anteriores
      setSqlTestResult(null);
      setDatabaseSchema(null);
    }
  }, [selectedSqlId]);

  // Cuando cambia la conexión Neo4j seleccionada
  useEffect(() => {
    if (selectedNeo4jId) {
      setNeo4jTestResult(null);
    }
  }, [selectedNeo4jId]);

  // Manejar éxito al crear conexión
  const handleConnectionSuccess = (connection: ConnectionResponse) => {
    if (connection.engine_type === "SQL_SERVER") {
      setSqlConnections((prev) => {
        const exists = prev.find((c) => c.connection_id === connection.connection_id);
        if (exists) {
          return prev.map((c) =>
            c.connection_id === connection.connection_id ? connection : c
          );
        }
        return [...prev, connection];
      });
      setSelectedSqlId(connection.connection_id);
    } else {
      setNeo4jConnections((prev) => {
        const exists = prev.find((c) => c.connection_id === connection.connection_id);
        if (exists) {
          return prev.map((c) =>
            c.connection_id === connection.connection_id ? connection : c
          );
        }
        return [...prev, connection];
      });
      setSelectedNeo4jId(connection.connection_id);
    }
  };

  const selectedNeo4j = neo4jConnections.find((c) => c.connection_id === selectedNeo4jId);

  return (
    <aside className="connections-panel">
      {/* Header */}
      <div className="panel-header">
        <h3 className="panel-title">Conexiones</h3>
        <button
          className="btn-icon"
          onClick={() => setIsModalOpen(true)}
          title="Agregar conexión"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="panel-content">
        {isLoadingConnections ? (
          <div className="loading-state">
            <Loader2 size={24} className="spinner" />
            <span>Cargando conexiones...</span>
          </div>
        ) : (
          <>
            {/* Sección SQL Server */}
            <section className="connection-section">
              <div className="section-header">
                <Database size={16} className="sql-icon" />
                <span>SQL Server</span>
              </div>

              <div className="select-wrapper">
                <select
                  className="connection-select"
                  value={selectedSqlId}
                  onChange={(e) => setSelectedSqlId(e.target.value)}
                  disabled={sqlConnections.length === 0}
                >
                  {sqlConnections.length === 0 ? (
                    <option value="">Sin conexiones</option>
                  ) : (
                    sqlConnections.map((conn) => (
                      <option key={conn.connection_id} value={conn.connection_id}>
                        {conn.connection_name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <button
                className="test-button"
                onClick={handleTestSql}
                disabled={!selectedSqlId || isTestingSql}
              >
                {isTestingSql ? (
                  <>
                    <Loader2 size={14} className="spinner" />
                    <span>Probando...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    <span>Probar conexión</span>
                  </>
                )}
              </button>

              {sqlTestResult && (
                <div className={`test-result ${sqlTestResult.success ? "success" : "error"}`}>
                  {sqlTestResult.success ? (
                    <CheckCircle size={14} />
                  ) : (
                    <XCircle size={14} />
                  )}
                  <span>{sqlTestResult.message}</span>
                </div>
              )}

              {/* Esquema de base de datos */}
              {(sqlTestResult?.success || databaseSchema) && (
                <div className="schema-section">
                  <div className="schema-header">
                    <span>Esquema de Base de Datos</span>
                    <button
                      className="btn-icon-small"
                      onClick={loadSchema}
                      disabled={isLoadingSchema}
                      title="Recargar esquema"
                    >
                      <RefreshCw size={12} className={isLoadingSchema ? "spinner" : ""} />
                    </button>
                  </div>
                  <div className="schema-container">
                    {isLoadingSchema ? (
                      <SchemaTreeView schema={{ database_name: "", tables: [] }} isLoading />
                    ) : databaseSchema ? (
                      <SchemaTreeView schema={databaseSchema} />
                    ) : (
                      <p className="schema-placeholder">
                        Prueba la conexión para ver el esquema
                      </p>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Divisor */}
            <div className="section-divider" />

            {/* Sección Neo4j */}
            <section className="connection-section">
              <div className="section-header">
                <Share2 size={16} className="neo4j-icon" />
                <span>Neo4j</span>
              </div>

              <div className="select-wrapper">
                <select
                  className="connection-select"
                  value={selectedNeo4jId}
                  onChange={(e) => setSelectedNeo4jId(e.target.value)}
                  disabled={neo4jConnections.length === 0}
                >
                  {neo4jConnections.length === 0 ? (
                    <option value="">Sin conexiones</option>
                  ) : (
                    neo4jConnections.map((conn) => (
                      <option key={conn.connection_id} value={conn.connection_id}>
                        {conn.connection_name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <button
                className="test-button"
                onClick={handleTestNeo4j}
                disabled={!selectedNeo4jId || isTestingNeo4j}
              >
                {isTestingNeo4j ? (
                  <>
                    <Loader2 size={14} className="spinner" />
                    <span>Probando...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    <span>Probar conexión</span>
                  </>
                )}
              </button>

              {neo4jTestResult && (
                <div className={`test-result ${neo4jTestResult.success ? "success" : "error"}`}>
                  {neo4jTestResult.success ? (
                    <CheckCircle size={14} />
                  ) : (
                    <XCircle size={14} />
                  )}
                  <span>{neo4jTestResult.message}</span>
                </div>
              )}

              {selectedNeo4j && neo4jTestResult?.success && (
                <div className="connection-info">
                  <p>
                    <strong>Base de datos:</strong> {selectedNeo4j.database_name}
                  </p>
                  <p>
                    <strong>Host:</strong> {selectedNeo4j.host}:{selectedNeo4j.port}
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Modal de formulario */}
      <ConnectionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleConnectionSuccess}
      />

      <style jsx>{`
        .connections-panel {
          display: flex;
          flex-direction: column;
          width: 280px;
          min-width: 280px;
          background-color: var(--bg-secondary);
          border-right: 1px solid var(--border-primary);
          height: 100%;
          overflow: hidden;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border-bottom: 1px solid var(--border-primary);
        }

        .panel-title {
          font-size: var(--text-body);
          font-weight: var(--font-semibold);
          color: var(--text-primary);
          margin: 0;
        }

        .btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background-color: var(--accent-primary);
          color: white;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-icon:hover {
          background-color: var(--cyan-600);
        }

        .btn-icon-small {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          border-radius: 0.25rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-icon-small:hover {
          color: var(--text-primary);
          background-color: var(--bg-tertiary);
        }

        .btn-icon-small:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 2rem 1rem;
          color: var(--text-muted);
          font-size: var(--text-label);
        }

        .connection-section {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: var(--text-label);
          font-weight: var(--font-medium);
          color: var(--text-primary);
        }

        .sql-icon {
          color: var(--blue-700);
        }

        .neo4j-icon {
          color: var(--graph-node-b);
        }

        .select-wrapper {
          position: relative;
          display: flex;
          
        }

        .connection-select {
          width: 100%;
          padding: 0.5rem 2rem 0.5rem 0.75rem;
          background-color: var(--bg-tertiary);
          border: 1px solid var(--border-primary);
          border-radius: 0.5rem;
          font-size: var(--text-label);
          color: var(--text-primary);
          cursor: pointer;
          appearance: base;
        }

        .connection-select:focus {
          outline: none;
          border-color: var(--accent-primary);
        }

        .connection-select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .select-icon {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }

        .test-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          padding: 0.5rem;
          background-color: var(--bg-tertiary);
          border: 1px solid var(--border-primary);
          border-radius: 0.5rem;
          font-size: var(--text-caption);
          font-weight: var(--font-medium);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .test-button:hover:not(:disabled) {
          background-color: var(--bg-primary);
          border-color: var(--accent-primary);
        }

        .test-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .test-result {
          display: flex;
          align-items: flex-start;
          gap: 0.375rem;
          padding: 0.5rem;
          border-radius: 0.375rem;
          font-size: var(--text-caption);
          line-height: 1.3;
        }

        .test-result.success {
          background-color: rgba(34, 197, 94, 0.1);
          color: var(--green-500);
        }

        .test-result.error {
          background-color: rgba(239, 68, 68, 0.1);
          color: var(--red-500);
        }

        .schema-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 0.25rem;
        }

        .schema-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: var(--text-caption);
          font-weight: var(--font-medium);
          color: var(--text-secondary);
        }

        .schema-container {
          background-color: var(--bg-tertiary);
          border: 1px solid var(--border-primary);
          border-radius: 0.5rem;
          max-height: 300px;
          overflow-y: auto;
        }

        .schema-placeholder {
          padding: 1rem;
          text-align: center;
          color: var(--text-muted);
          font-size: var(--text-caption);
        }

        .section-divider {
          height: 1px;
          background-color: var(--border-primary);
          margin: 0.5rem 0;
        }

        .connection-info {
          background-color: var(--bg-tertiary);
          border-radius: 0.5rem;
          padding: 0.625rem;
        }

        .connection-info p {
          margin: 0;
          margin-bottom: 0.25rem;
          font-size: var(--text-caption);
          color: var(--text-secondary);
        }

        .connection-info p:last-child {
          margin-bottom: 0;
        }

        .connection-info strong {
          color: var(--text-primary);
          font-weight: var(--font-medium);
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </aside>
  );
}

export default ConnectionsPanel;


