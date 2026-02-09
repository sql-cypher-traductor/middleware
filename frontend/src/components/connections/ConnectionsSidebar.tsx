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
  ChevronDown,
} from "lucide-react";
import { connectionService } from "@/services/connectionService";
import { ConnectionFormModal } from "@/components/connections/ConnectionFormModal";
import { SchemaTreeView } from "@/components/connections/SchemaTreeView";
import type {
  ConnectionResponse,
  DatabaseSchema,
  ConnectionTestResponse,
} from "@/types/connection";
import { toast } from "sonner";

type ConnectionTab = "sql" | "neo4j";

interface ConnectionsSidebarProps {
  onSqlConnectionChange?: (connection: ConnectionResponse | null) => void;
  onNeo4jConnectionChange?: (connection: ConnectionResponse | null) => void;
}

export function ConnectionsSidebar({
  onSqlConnectionChange,
  onNeo4jConnectionChange,
}: ConnectionsSidebarProps) {
  const [activeTab, setActiveTab] = useState<ConnectionTab>("sql");

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

  // Esquema de base de datos SQL
  const [sqlSchema, setSqlSchema] = useState<DatabaseSchema | null>(null);

  // Modal de formulario
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalEngineType, setModalEngineType] = useState<"SQL_SERVER" | "NEO4J">("SQL_SERVER");

  // Cargar conexiones
  const loadConnections = useCallback(async () => {
    setIsLoadingConnections(true);
    try {
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
        onSqlConnectionChange?.(activeSql);
      } else if (sqlResponse.connections.length > 0) {
        setSelectedSqlId(sqlResponse.connections[0].connection_id);
      }

      if (activeNeo4j) {
        setSelectedNeo4jId(activeNeo4j.connection_id);
        onNeo4jConnectionChange?.(activeNeo4j);
      } else if (neo4jResponse.connections.length > 0) {
        setSelectedNeo4jId(neo4jResponse.connections[0].connection_id);
      }
    } catch (error) {
      console.error("Error al cargar conexiones:", error);
    } finally {
      setIsLoadingConnections(false);
    }
  }, [onSqlConnectionChange, onNeo4jConnectionChange]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  // Probar y activar conexión SQL
  const handleTestSql = async () => {
    if (!selectedSqlId) return;

    setIsTestingSql(true);
    setSqlTestResult(null);

    try {
      // Primero activar la conexión
      await connectionService.activateConnection(selectedSqlId);

      const result = await connectionService.testSavedConnection(selectedSqlId);
      setSqlTestResult(result);

      if (result.success) {
        toast.success("Conexión SQL Server exitosa");
        loadSchema();

        // Actualizar conexión activa
        const connection = sqlConnections.find((c) => c.connection_id === selectedSqlId);
        if (connection) {
          onSqlConnectionChange?.(connection);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      setSqlTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Error al probar conexión",
        engine_type: "SQL_SERVER",
      });
      toast.error("Error al conectar");
    } finally {
      setIsTestingSql(false);
    }
  };

  // Probar y activar conexión Neo4j
  const handleTestNeo4j = async () => {
    if (!selectedNeo4jId) return;

    setIsTestingNeo4j(true);
    setNeo4jTestResult(null);

    try {
      // Primero activar la conexión
      await connectionService.activateConnection(selectedNeo4jId);

      const result = await connectionService.testSavedConnection(selectedNeo4jId);
      setNeo4jTestResult(result);

      if (result.success) {
        toast.success("Conexión Neo4j exitosa");

        // Actualizar conexión activa
        const connection = neo4jConnections.find((c) => c.connection_id === selectedNeo4jId);
        if (connection) {
          onNeo4jConnectionChange?.(connection);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      setNeo4jTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Error al probar conexión",
        engine_type: "NEO4J",
      });
      toast.error("Error al conectar");
    } finally {
      setIsTestingNeo4j(false);
    }
  };

  // Cargar esquema SQL
  const loadSchema = async () => {
    if (!selectedSqlId) return;

    setIsLoadingSchema(true);
    setSqlSchema(null);

    try {
      const schema = await connectionService.getDatabaseSchema(selectedSqlId);
      setSqlSchema(schema);
    } catch (error) {
      console.error("Error al cargar esquema:", error);
      toast.error("Error al cargar esquema");
    } finally {
      setIsLoadingSchema(false);
    }
  };

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
    toast.success("Conexión creada exitosamente");
  };

  // Abrir modal para crear conexión
  const openCreateModal = (type: "SQL_SERVER" | "NEO4J") => {
    setModalEngineType(type);
    setIsModalOpen(true);
  };

  const currentConnections = activeTab === "sql" ? sqlConnections : neo4jConnections;
  const currentSelectedId = activeTab === "sql" ? selectedSqlId : selectedNeo4jId;
  const currentTestResult = activeTab === "sql" ? sqlTestResult : neo4jTestResult;
  const isTesting = activeTab === "sql" ? isTestingSql : isTestingNeo4j;
  const handleTest = activeTab === "sql" ? handleTestSql : handleTestNeo4j;
  const setSelectedId = activeTab === "sql" ? setSelectedSqlId : setSelectedNeo4jId;

  return (
    <aside className="connections-sidebar">
      {/* Header con tabs */}
      <div className="sidebar-header">
        <div className="tabs">
          <button
            className={`tab ${activeTab === "sql" ? "active" : ""}`}
            onClick={() => setActiveTab("sql")}
          >
            <Database size={16} />
            <span>SQL Server</span>
          </button>
          <button
            className={`tab ${activeTab === "neo4j" ? "active" : ""}`}
            onClick={() => setActiveTab("neo4j")}
          >
            <Share2 size={16} />
            <span>Neo4j</span>
          </button>
        </div>
      </div>

      {/* Contenido de la tab */}
      <div className="sidebar-content">
        {isLoadingConnections ? (
          <div className="loading">
            <Loader2 className="spinner" size={24} />
            <span>Cargando conexiones...</span>
          </div>
        ) : (
          <>
            {/* Selector de conexión */}
            <div className="connection-selector">
              <label className="selector-label">Conexión</label>
              <div className="selector-row">
                <div className="select-wrapper">
                  <select
                    value={currentSelectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="connection-select"
                  >
                    {currentConnections.length === 0 ? (
                      <option value="">Sin conexiones</option>
                    ) : (
                      currentConnections.map((conn) => (
                        <option key={conn.connection_id} value={conn.connection_id}>
                          {conn.connection_name}
                          {conn.is_active ? " ✓" : ""}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="select-icon" size={16} />
                </div>
                <button
                  className="add-btn"
                  onClick={() => openCreateModal(activeTab === "sql" ? "SQL_SERVER" : "NEO4J")}
                  title="Nueva conexión"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Botón de conexión */}
            <button
              className={`connect-btn ${currentTestResult?.success ? "success" : ""}`}
              onClick={handleTest}
              disabled={isTesting || !currentSelectedId}
            >
              {isTesting ? (
                <Loader2 className="spinner" size={16} />
              ) : currentTestResult?.success ? (
                <CheckCircle size={16} />
              ) : currentTestResult ? (
                <XCircle size={16} />
              ) : (
                <RefreshCw size={16} />
              )}
              <span>
                {isTesting
                  ? "Conectando..."
                  : currentTestResult?.success
                  ? "Conectado"
                  : "Conectar"}
              </span>
            </button>

            {/* Resultado de test */}
            {currentTestResult && !currentTestResult.success && (
              <div className="test-error">
                <XCircle size={14} />
                <span>{currentTestResult.message}</span>
              </div>
            )}

            {/* Esquema SQL */}
            {activeTab === "sql" && sqlTestResult?.success && (
              <div className="schema-section">
                <div className="schema-header">
                  <span className="schema-title">Esquema de Base de Datos</span>
                  <button
                    className="refresh-btn"
                    onClick={loadSchema}
                    disabled={isLoadingSchema}
                    title="Recargar esquema"
                  >
                    <RefreshCw className={isLoadingSchema ? "spinner" : ""} size={14} />
                  </button>
                </div>

                {isLoadingSchema ? (
                  <div className="schema-loading">
                    <Loader2 className="spinner" size={20} />
                    <span>Cargando esquema...</span>
                  </div>
                ) : sqlSchema ? (
                  <SchemaTreeView schema={sqlSchema} />
                ) : (
                  <div className="schema-empty">
                    <p>Haz clic en &#34;Cargar Esquema&#34; para ver las tablas</p>
                  </div>
                )}
              </div>
            )}

            {/* Info Neo4j */}
            {activeTab === "neo4j" && neo4jTestResult?.success && (
              <div className="neo4j-info">
                <CheckCircle size={16} />
                <span>Conexión Neo4j activa y lista para ejecutar consultas</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de conexión */}
      <ConnectionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleConnectionSuccess}
        defaultEngineType={modalEngineType}
      />

      <style jsx>{`
        .connections-sidebar {
          width: 280px;
          min-width: 280px;
          background-color: var(--bg-secondary);
          border-right: 1px solid var(--border-primary);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .sidebar-header {
          padding: 0.75rem;
          border-bottom: 1px solid var(--border-primary);
          background-color: var(--bg-tertiary);
        }

        .tabs {
          display: flex;
          gap: 0.25rem;
          background-color: var(--bg-secondary);
          padding: 0.25rem;
          border-radius: 0.5rem;
        }

        .tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          padding: 0.5rem;
          background: transparent;
          border: none;
          border-radius: 0.375rem;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: var(--text-caption);
          font-weight: var(--font-medium);
          transition: all 0.15s ease;
        }

        .tab:hover {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .tab.active {
          background-color: var(--accent-primary);
          color: white;
        }

        .sidebar-content {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 2rem;
          color: var(--text-secondary);
          font-size: var(--text-caption);
        }

        .connection-selector {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .selector-label {
          font-size: var(--text-caption);
          font-weight: var(--font-medium);
          color: var(--text-primary);
        }

        .selector-row {
          display: flex;
          gap: 0.5rem;
        }

        .select-wrapper {
          flex: 1;
          position: relative;
        }

        .connection-select {
          width: 100%;
          padding: 0.5rem 2rem 0.5rem 0.75rem;
          background-color: var(--bg-tertiary);
          border: 1px solid var(--border-primary);
          border-radius: 0.375rem;
          color: var(--text-primary);
          font-size: var(--text-caption);
          cursor: pointer;
          appearance: none;
        }

        .connection-select:focus {
          outline: none;
          border-color: var(--accent-primary);
        }

        :global(.select-icon) {
          position: absolute;
          right: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: var(--text-muted);
        }

        .add-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background-color: var(--accent-primary);
          border: none;
          border-radius: 0.375rem;
          color: white;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .add-btn:hover {
          background-color: var(--cyan-600);
        }

        .connect-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.625rem;
          background-color: var(--bg-tertiary);
          border: 1px solid var(--border-primary);
          border-radius: 0.375rem;
          color: var(--text-primary);
          font-size: var(--text-caption);
          font-weight: var(--font-medium);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .connect-btn:hover:not(:disabled) {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }

        .connect-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .connect-btn.success {
          background-color: var(--green-500);
          border-color: var(--green-500);
          color: white;
        }

        .test-error {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.5rem;
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 0.375rem;
          color: #ef4444;
          font-size: var(--text-caption);
        }

        .schema-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
          min-height: 0;
        }

        .schema-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .schema-title {
          font-size: var(--text-caption);
          font-weight: var(--font-medium);
          color: var(--text-primary);
        }

        .refresh-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          border-radius: 0.25rem;
        }

        .refresh-btn:hover {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .schema-loading,
        .schema-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          color: var(--text-muted);
          font-size: var(--text-caption);
          text-align: center;
        }

        .neo4j-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background-color: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 0.375rem;
          color: #22c55e;
          font-size: var(--text-caption);
        }

        :global(.spinner) {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </aside>
  );
}

