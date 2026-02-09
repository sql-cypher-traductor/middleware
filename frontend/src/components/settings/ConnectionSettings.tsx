"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Database,
  Share2,
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { connectionService } from "@/services/connectionService";
import { ConnectionCard } from "@/components/connections/ConnectionCard";
import { ConnectionFormModal } from "@/components/connections/ConnectionFormModal";
import type { ConnectionResponse, EngineType } from "@/types/connection";
import { toast } from "sonner";

type ConnectionTab = "SQL_SERVER" | "NEO4J";

export function ConnectionSettings() {
  const [activeTab, setActiveTab] = useState<ConnectionTab>("SQL_SERVER");
  const [connections, setConnections] = useState<ConnectionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<ConnectionResponse | null>(null);

  // Confirm delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await connectionService.getConnections(1, 50, activeTab as EngineType);
      setConnections(response.connections);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar conexiones");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleTabChange = (tab: ConnectionTab) => {
    setActiveTab(tab);
    setConnections([]);
  };

  const handleAddConnection = () => {
    setEditingConnection(null);
    setIsModalOpen(true);
  };

  const handleEditConnection = (connection: ConnectionResponse) => {
    setEditingConnection(connection);
    setIsModalOpen(true);
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (deletingId === connectionId) {
      // Confirmar eliminación
      try {
        await connectionService.deleteConnection(connectionId);
        setConnections((prev) => prev.filter((c) => c.connection_id !== connectionId));
        toast.success("Conexión eliminada correctamente");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al eliminar conexión");
      } finally {
        setDeletingId(null);
      }
    } else {
      // Primer click - pedir confirmación
      setDeletingId(connectionId);
      // Reset después de 3 segundos
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  const handleToggleActive = async (connectionId: string, isActive: boolean) => {
    try {
      let updatedConnection: ConnectionResponse;
      if (isActive) {
        updatedConnection = await connectionService.deactivateConnection(connectionId);
        toast.success("Conexión desactivada");
      } else {
        updatedConnection = await connectionService.activateConnection(connectionId);
        toast.success("Conexión activada");
      }
      // Actualizar la lista
      setConnections((prev) =>
        prev.map((c) => {
          if (c.connection_id === connectionId) {
            return updatedConnection;
          }
          // Si activamos una, desactivar las demás del mismo tipo
          if (!isActive && c.is_active && c.engine_type === updatedConnection.engine_type) {
            return { ...c, is_active: false };
          }
          return c;
        })
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar estado");
    }
  };

  const handleConnectionSuccess = (connection: ConnectionResponse) => {
    const isSameType = connection.engine_type === activeTab;

    if (isSameType) {
      setConnections((prev) => {
        const exists = prev.find((c) => c.connection_id === connection.connection_id);
        if (exists) {
          return prev.map((c) =>
            c.connection_id === connection.connection_id ? connection : c
          );
        }
        return [...prev, connection];
      });
    }

    toast.success(editingConnection ? "Conexión actualizada" : "Conexión creada");
    setIsModalOpen(false);
    setEditingConnection(null);
  };

  const filteredConnections = connections.filter(
    (c) => c.engine_type === activeTab
  );

  return (
    <div className="connection-settings">
      <div className="settings-header">
        <div className="header-content">
          <h3 className="section-title">Conexiones de Base de Datos</h3>
          <p className="section-description">
            Administra tus conexiones a bases de datos SQL Server y Neo4j.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleAddConnection}>
          <Plus size={16} />
          <span>Añadir Conexión</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === "SQL_SERVER" ? "active" : ""}`}
          onClick={() => handleTabChange("SQL_SERVER")}
        >
          <Database size={16} className="tab-icon sql" />
          <span>SQL Server</span>
        </button>
        <button
          className={`tab ${activeTab === "NEO4J" ? "active" : ""}`}
          onClick={() => handleTabChange("NEO4J")}
        >
          <Share2 size={16} className="tab-icon neo4j" />
          <span>Neo4j</span>
        </button>
      </div>

      {/* Content */}
      <div className="tab-content">
        {isLoading ? (
          <div className="loading-state">
            <Loader2 size={32} className="spinner" />
            <p>Cargando conexiones...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertCircle size={32} />
            <p>{error}</p>
            <button className="btn btn-secondary" onClick={loadConnections}>
              <RefreshCw size={14} />
              Reintentar
            </button>
          </div>
        ) : filteredConnections.length === 0 ? (
          <div className="empty-state">
            {activeTab === "SQL_SERVER" ? (
              <Database size={48} className="empty-icon sql" />
            ) : (
              <Share2 size={48} className="empty-icon neo4j" />
            )}
            <h4 className="empty-title">
              No hay conexiones {activeTab === "SQL_SERVER" ? "SQL Server" : "Neo4j"}
            </h4>
            <p className="empty-description">
              Añade una conexión para comenzar a trabajar.
            </p>
            <button className="btn btn-primary" onClick={handleAddConnection}>
              <Plus size={16} />
              <span>Añadir Conexión</span>
            </button>
          </div>
        ) : (
          <div className="connections-grid">
            {filteredConnections.map((connection) => (
              <ConnectionCard
                key={connection.connection_id}
                connection={connection}
                onEdit={handleEditConnection}
                onDelete={handleDeleteConnection}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <ConnectionFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingConnection(null);
        }}
        onSuccess={handleConnectionSuccess}
        editConnection={editingConnection}
      />

      <style jsx>{`
        .connection-settings {
          max-width: 100%;
        }

        .settings-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .header-content {
          flex: 1;
        }

        .section-title {
          font-size: var(--text-h3);
          font-weight: var(--font-semibold);
          color: var(--text-primary);
          margin: 0 0 0.5rem 0;
        }

        .section-description {
          font-size: var(--text-body);
          color: var(--text-secondary);
          margin: 0;
        }

        .tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-primary);
          padding-bottom: 0;
        }

        .tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: var(--text-label);
          font-weight: var(--font-medium);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: all 0.15s ease;
        }

        .tab:hover {
          color: var(--text-primary);
        }

        .tab.active {
          color: var(--accent-primary);
          border-bottom-color: var(--accent-primary);
        }

        .tab-icon.sql {
          color: var(--blue-700);
        }

        .tab-icon.neo4j {
          color: var(--graph-node-b);
        }

        .tab.active .tab-icon {
          color: var(--accent-primary);
        }

        .tab-content {
          min-height: 300px;
        }

        .loading-state,
        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          gap: 1rem;
          color: var(--text-muted);
        }

        .error-state {
          color: var(--red-500);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          background-color: var(--bg-tertiary);
          border: 1px dashed var(--border-primary);
          border-radius: 0.75rem;
          text-align: center;
        }

        .empty-icon {
          margin-bottom: 1rem;
        }

        .empty-icon.sql {
          color: var(--blue-700);
        }

        .empty-icon.neo4j {
          color: var(--graph-node-b);
        }

        .empty-title {
          font-size: var(--text-body);
          font-weight: var(--font-semibold);
          color: var(--text-primary);
          margin: 0 0 0.5rem 0;
        }

        .empty-description {
          font-size: var(--text-label);
          color: var(--text-secondary);
          margin: 0 0 1.5rem 0;
        }

        .connections-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          border-radius: 0.5rem;
          font-size: var(--text-label);
          font-weight: var(--font-medium);
          cursor: pointer;
          transition: all 0.15s ease;
          border: none;
        }

        .btn-primary {
          background-color: var(--accent-primary);
          color: white;
        }

        .btn-primary:hover {
          background-color: var(--cyan-600);
        }

        .btn-secondary {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
          border: 1px solid var(--border-primary);
        }

        .btn-secondary:hover {
          background-color: var(--bg-primary);
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .settings-header {
            flex-direction: column;
            align-items: stretch;
          }

          .tabs {
            overflow-x: auto;
          }

          .connections-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default ConnectionSettings;
