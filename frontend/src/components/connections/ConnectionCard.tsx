"use client";

import React, { useState } from "react";
import { Database, Share2, MoreVertical, Edit2, Trash2, Power, PowerOff, Loader2, CheckCircle } from "lucide-react";
import type { ConnectionResponse } from "@/types/connection";

interface ConnectionCardProps {
  connection: ConnectionResponse;
  onEdit: (connection: ConnectionResponse) => void;
  onDelete: (connectionId: string) => void;
  onToggleActive: (connectionId: string, isActive: boolean) => Promise<void>;
}

export function ConnectionCard({
  connection,
  onEdit,
  onDelete,
  onToggleActive,
}: ConnectionCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const isSqlServer = connection.engine_type === "SQL_SERVER";

  const handleToggleActive = async () => {
    setIsToggling(true);
    try {
      await onToggleActive(connection.connection_id, connection.is_active);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className={`connection-card ${connection.is_active ? "active" : ""}`}>
      <div className="card-header">
        <div className="card-icon-wrapper">
          {isSqlServer ? (
            <Database size={24} className="card-icon sql" />
          ) : (
            <Share2 size={24} className="card-icon neo4j" />
          )}
        </div>
        <div className="card-info">
          <h4 className="card-title">{connection.connection_name}</h4>
          <span className="card-type">
            {isSqlServer ? "SQL Server" : "Neo4j"}
          </span>
        </div>
        <div className="card-actions">
          {connection.is_active && (
            <span className="active-badge">
              <CheckCircle size={12} />
              Activa
            </span>
          )}
          <div className="dropdown-container">
            <button
              className="menu-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Opciones"
            >
              <MoreVertical size={18} />
            </button>
            {isMenuOpen && (
              <>
                <div className="dropdown-backdrop" onClick={() => setIsMenuOpen(false)} />
                <div className="dropdown-menu">
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      onEdit(connection);
                      setIsMenuOpen(false);
                    }}
                  >
                    <Edit2 size={14} />
                    Editar
                  </button>
                  <button
                    className="dropdown-item danger"
                    onClick={() => {
                      onDelete(connection.connection_id);
                      setIsMenuOpen(false);
                    }}
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="card-body">
        <div className="card-detail">
          <span className="detail-label">Host:</span>
          <span className="detail-value">{connection.host}:{connection.port}</span>
        </div>
        <div className="card-detail">
          <span className="detail-label">Base de datos:</span>
          <span className="detail-value">{connection.database_name}</span>
        </div>
        <div className="card-detail">
          <span className="detail-label">Usuario:</span>
          <span className="detail-value">{connection.username_db}</span>
        </div>
      </div>

      <div className="card-footer">
        <button
          className={`toggle-button ${connection.is_active ? "deactivate" : "activate"}`}
          onClick={handleToggleActive}
          disabled={isToggling}
        >
          {isToggling ? (
            <Loader2 size={16} className="spinner" />
          ) : connection.is_active ? (
            <PowerOff size={16} />
          ) : (
            <Power size={16} />
          )}
          <span>{connection.is_active ? "Desactivar" : "Activar"}</span>
        </button>
      </div>

      <style jsx>{`
        .connection-card {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 0.75rem;
          overflow: hidden;
          transition: all 0.15s ease;
        }

        .connection-card:hover {
          border-color: var(--border-secondary);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .connection-card.active {
          border-color: var(--accent-primary);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-bottom: 1px solid var(--border-primary);
        }

        .card-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 0.5rem;
          background-color: var(--bg-tertiary);
        }

        .card-icon.sql {
          color: var(--blue-700);
        }

        .card-icon.neo4j {
          color: var(--graph-node-b);
        }

        .card-info {
          flex: 1;
          min-width: 0;
        }

        .card-title {
          font-size: var(--text-body);
          font-weight: var(--font-semibold);
          color: var(--text-primary);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-type {
          font-size: var(--text-caption);
          color: var(--text-muted);
        }

        .card-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .active-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background-color: rgba(34, 197, 94, 0.1);
          color: var(--green-500);
          border-radius: 9999px;
          font-size: var(--text-caption);
          font-weight: var(--font-medium);
        }

        .dropdown-container {
          position: relative;
        }

        .menu-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          border-radius: 0.375rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .menu-button:hover {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .dropdown-backdrop {
          position: fixed;
          inset: 0;
          z-index: 10;
        }

        .dropdown-menu {
          position: absolute;
          right: 0;
          top: 100%;
          margin-top: 0.25rem;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 0.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 20;
          min-width: 140px;
          overflow: hidden;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.625rem 1rem;
          border: none;
          background: transparent;
          color: var(--text-primary);
          font-size: var(--text-label);
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }

        .dropdown-item:hover {
          background-color: var(--bg-tertiary);
        }

        .dropdown-item.danger {
          color: var(--red-500);
        }

        .dropdown-item.danger:hover {
          background-color: rgba(239, 68, 68, 0.1);
        }

        .card-body {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .card-detail {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: var(--text-label);
        }

        .detail-label {
          color: var(--text-muted);
        }

        .detail-value {
          color: var(--text-secondary);
          font-family: monospace;
        }

        .card-footer {
          padding: 0.75rem 1rem;
          border-top: 1px solid var(--border-primary);
        }

        .toggle-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.5rem;
          border: none;
          border-radius: 0.5rem;
          font-size: var(--text-label);
          font-weight: var(--font-medium);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .toggle-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .toggle-button.activate {
          background-color: rgba(34, 197, 94, 0.1);
          color: var(--green-500);
        }

        .toggle-button.activate:hover:not(:disabled) {
          background-color: rgba(34, 197, 94, 0.2);
        }

        .toggle-button.deactivate {
          background-color: var(--bg-tertiary);
          color: var(--text-secondary);
        }

        .toggle-button.deactivate:hover:not(:disabled) {
          background-color: rgba(239, 68, 68, 0.1);
          color: var(--red-500);
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default ConnectionCard;

