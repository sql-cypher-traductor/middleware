"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  History,
  Trash2,
  Copy,
  ExternalLink,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { executionService } from "@/services/executionService";
import type { QueryHistoryItem, QueryStatus } from "@/types/execution";
import { toast } from "sonner";

interface QueryHistoryTableProps {
  onReuseQuery?: (sql: string, cypher: string | null) => void;
}

const STATUS_CONFIG: Record<
  QueryStatus,
  { icon: React.ReactNode; color: string; bgColor: string }
> = {
  Pendiente: {
    icon: <Clock size={14} />,
    color: "#f59e0b",
    bgColor: "rgba(245, 158, 11, 0.15)",
  },
  Traducida: {
    icon: <CheckCircle size={14} />,
    color: "#3b82f6",
    bgColor: "rgba(59, 130, 246, 0.15)",
  },
  Ejecutada: {
    icon: <CheckCircle size={14} />,
    color: "#22c55e",
    bgColor: "rgba(34, 197, 94, 0.15)",
  },
  Fallida: {
    icon: <XCircle size={14} />,
    color: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.15)",
  },
};

export function QueryHistoryTable({ onReuseQuery }: QueryHistoryTableProps) {
  const [queries, setQueries] = useState<QueryHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Cargar historial
  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await executionService.getHistory(
        page,
        pageSize,
        statusFilter || undefined
      );

      // Filtrar por búsqueda local si hay texto
      let filteredQueries = response.queries;
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        filteredQueries = response.queries.filter(
          (q) =>
            q.sql_query.toLowerCase().includes(searchLower) ||
            (q.cypher_query && q.cypher_query.toLowerCase().includes(searchLower))
        );
      }

      setQueries(filteredQueries);
      setTotalPages(response.total_pages);
      setTotal(response.total);
    } catch (error) {
      console.error("Error al cargar historial:", error);
      toast.error("Error al cargar el historial");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, statusFilter, debouncedSearch]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Eliminar consulta
  const handleDelete = async (queryId: string) => {
    setIsDeleting(queryId);
    try {
      await executionService.deleteQuery(queryId);
      toast.success("Consulta eliminada del historial");
      loadHistory();
    } catch (error) {
      toast.error("Error al eliminar la consulta");
      console.error(error);
    } finally {
      setIsDeleting(null);
    }
  };

  // Copiar al editor
  const handleReuse = (query: QueryHistoryItem) => {
    if (onReuseQuery) {
      onReuseQuery(query.sql_query, query.cypher_query);
      toast.success("Consulta cargada en el editor");
    } else {
      // Si no hay callback, copiar al portapapeles
      const text = query.cypher_query
        ? `-- SQL:\n${query.sql_query}\n\n-- Cypher:\n${query.cypher_query}`
        : query.sql_query;
      navigator.clipboard.writeText(text);
      toast.success("Consulta copiada al portapapeles");
    }
  };

  // Copiar consulta
  const handleCopy = async (query: QueryHistoryItem) => {
    const text = query.cypher_query
      ? `-- SQL:\n${query.sql_query}\n\n-- Cypher:\n${query.cypher_query}`
      : query.sql_query;
    await navigator.clipboard.writeText(text);
    toast.success("Consulta copiada al portapapeles");
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Formatear tiempo en ms
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "-";
    return `${(seconds * 1000).toFixed(2)} ms`;
  };

  // Truncar texto
  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="history-table-container">
      {/* Barra de filtros */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar consultas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <Filter size={16} />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="status-filter"
          >
            <option value="">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Traducida">Traducida</option>
            <option value="Ejecutada">Ejecutada</option>
            <option value="Fallida">Fallida</option>
          </select>
        </div>

        <button
          className="refresh-btn"
          onClick={loadHistory}
          disabled={isLoading}
          title="Actualizar"
        >
          <RefreshCw size={16} className={isLoading ? "spinning" : ""} />
        </button>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="loading-state">
          <Loader2 size={32} className="spinning" />
          <p>Cargando historial...</p>
        </div>
      ) : queries.length === 0 ? (
        <div className="empty-state">
          <History size={48} />
          <h4>No hay consultas en el historial</h4>
          <p>Las consultas que realices aparecerán aquí.</p>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Consulta SQL</th>
                  <th>Consulta Cypher</th>
                  <th>Estado</th>
                  <th>T. Traducción</th>
                  <th>T. Ejecución</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {queries.map((query) => {
                  const statusConfig = STATUS_CONFIG[query.query_status];
                  return (
                    <tr key={query.query_id}>
                      <td className="date-cell">
                        {formatDate(query.created_at)}
                      </td>
                      <td className="query-cell">
                        <code title={query.sql_query}>
                          {truncateText(query.sql_query)}
                        </code>
                      </td>
                      <td className="query-cell">
                        {query.cypher_query ? (
                          <code title={query.cypher_query}>
                            {truncateText(query.cypher_query)}
                          </code>
                        ) : (
                          <span className="no-data">-</span>
                        )}
                      </td>
                      <td>
                        <span
                          className="status-badge"
                          style={{
                            color: statusConfig.color,
                            backgroundColor: statusConfig.bgColor,
                          }}
                        >
                          {statusConfig.icon}
                          <span>{query.query_status}</span>
                        </span>
                        {query.error_message && (
                          <div
                            className="error-tooltip"
                            title={query.error_message}
                          >
                            <AlertCircle size={12} />
                          </div>
                        )}
                      </td>
                      <td className="time-cell">
                        {query.query_status !== "Fallida" ||
                        query.failure_stage !== "Traducción"
                          ? formatTime(query.translation_time)
                          : "-"}
                      </td>
                      <td className="time-cell">
                        {query.query_status === "Ejecutada"
                          ? formatTime(query.execution_time)
                          : "-"}
                      </td>
                      <td className="actions-cell">
                        <button
                          className="action-btn reuse-btn"
                          onClick={() => handleReuse(query)}
                          title="Cargar en editor"
                        >
                          <ExternalLink size={14} />
                        </button>
                        <button
                          className="action-btn copy-btn"
                          onClick={() => handleCopy(query)}
                          title="Copiar consulta"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(query.query_id)}
                          disabled={isDeleting === query.query_id}
                          title="Eliminar"
                        >
                          {isDeleting === query.query_id ? (
                            <Loader2 size={14} className="spinning" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="pagination">
            <span className="pagination-info">
              Mostrando {(page - 1) * pageSize + 1} -{" "}
              {Math.min(page * pageSize, total)} de {total} consultas
            </span>
            <div className="pagination-controls">
              <button
                className="page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="page-indicator">
                {page} / {totalPages}
              </span>
              <button
                className="page-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .history-table-container {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 0.75rem;
          overflow: hidden;
        }

        .filters-bar {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background-color: var(--bg-tertiary);
          border-bottom: 1px solid var(--border-primary);
          flex-wrap: wrap;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
          min-width: 200px;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 0.375rem;
          padding: 0.25rem 0.75rem;
        }

        :global(.search-icon) {
          color: var(--text-muted);
        }

        .search-input {
          flex: 1;
          border: none;
          background: transparent;
          color: var(--text-primary);
          font-size: var(--text-label);
          outline: none;
        }

        .search-input::placeholder {
          color: var(--text-muted);
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
        }

        .status-filter {
          padding: 1rem 0.5rem;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 0.375rem;
          color: var(--text-primary);
          font-size: var(--text-caption);
          cursor: pointer;
        }

        .refresh-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 0.375rem;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .refresh-btn:hover:not(:disabled) {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }

        .loading-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          color: var(--text-muted);
          text-align: center;
          gap: 1rem;
        }

        .empty-state h4 {
          color: var(--text-primary);
          margin: 0;
        }

        .empty-state p {
          margin: 0;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .history-table {
          width: 100%;
          border-collapse: collapse;
          font-size: var(--text-caption);
        }

        .history-table th,
        .history-table td {
          padding: 0.75rem 1rem;
          text-align: left;
          border-bottom: 1px solid var(--border-primary);
        }

        .history-table th {
          background-color: var(--bg-tertiary);
          font-weight: var(--font-semibold);
          color: var(--text-primary);
          white-space: nowrap;
        }

        .history-table tr:hover td {
          background-color: var(--bg-tertiary);
        }

        .date-cell {
          white-space: nowrap;
          color: var(--text-secondary);
          font-size: 0.75rem;
        }

        .query-cell code {
          display: block;
          padding: 0.25rem 0.5rem;
          background-color: var(--bg-tertiary);
          border-radius: 0.25rem;
          font-family: "Fira Code", monospace;
          font-size: 0.7rem;
          color: var(--text-primary);
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .no-data {
          color: var(--text-muted);
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.7rem;
          font-weight: var(--font-medium);
        }

        .error-tooltip {
          display: inline-flex;
          margin-left: 0.375rem;
          color: #ef4444;
          cursor: help;
        }

        .time-cell {
          font-family: monospace;
          font-size: 0.7rem;
          color: var(--text-secondary);
          white-space: nowrap;
        }

        .actions-cell {
          display: flex;
          gap: 0.25rem;
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: transparent;
          border: 1px solid var(--border-primary);
          border-radius: 0.25rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .reuse-btn {
          color: var(--accent-primary);
        }

        .reuse-btn:hover {
          background-color: var(--accent-primary);
          border-color: var(--accent-primary);
          color: white;
        }

        .copy-btn {
          color: var(--text-secondary);
        }

        .copy-btn:hover {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .delete-btn {
          color: #ef4444;
        }

        .delete-btn:hover:not(:disabled) {
          background-color: #ef4444;
          border-color: #ef4444;
          color: white;
        }

        .delete-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background-color: var(--bg-tertiary);
          border-top: 1px solid var(--border-primary);
        }

        .pagination-info {
          font-size: var(--text-caption);
          color: var(--text-secondary);
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .page-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 0.25rem;
          color: var(--text-secondary);
          cursor: pointer;
        }

        .page-btn:hover:not(:disabled) {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }

        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-indicator {
          font-size: var(--text-caption);
          color: var(--text-secondary);
          padding: 0 0.5rem;
        }

        :global(.spinning) {
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

        @media (max-width: 768px) {
          .filters-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .search-box {
            min-width: unset;
          }

          .filter-group {
            justify-content: space-between;
          }

          .status-filter {
            flex: 1;
          }

          .pagination {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}

