"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Info,
  AlertTriangle,
  XCircle,
  Calendar,
  FileText,
  FileJson,
} from "lucide-react";
import { adminService } from "@/services/adminService";
import type {
  LogItem,
  LogLevel,
  LogFilters,
} from "@/types/logs";
import { toast } from "sonner";

const LEVEL_ICONS: Record<LogLevel, React.ReactNode> = {
  INFO: <Info size={14} />,
  WARNING: <AlertTriangle size={14} />,
  ERROR: <XCircle size={14} />,
  CRITICAL: <AlertCircle size={14} />,
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  INFO: "#3b82f6",
  WARNING: "#f59e0b",
  ERROR: "#ef4444",
  CRITICAL: "#dc2626",
};

const LEVEL_BG_COLORS: Record<LogLevel, string> = {
  INFO: "rgba(59, 130, 246, 0.15)",
  WARNING: "rgba(245, 158, 11, 0.15)",
  ERROR: "rgba(239, 68, 68, 0.15)",
  CRITICAL: "rgba(220, 38, 38, 0.2)",
};

export function SystemLogs() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableActions, setAvailableActions] = useState<string[]>([]);

  // Paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 25;

  // Filtros
  const [filters, setFilters] = useState<LogFilters>({
    level: "",
    action: "",
    search: "",
    start_date: "",
    end_date: "",
  });

  // Expandir/contraer detalles de log
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Cargar logs
  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminService.getLogs({
        page,
        page_size: pageSize,
        ...filters,
      });

      setLogs(response.logs);
      setTotalPages(response.total_pages);
      setTotal(response.total);

      // Cargar estadísticas para obtener acciones disponibles (solo una vez)
      if (availableActions.length === 0) {
        try {
          const stats = await adminService.getStats();
          setAvailableActions(stats.available_actions);
        } catch {
          // Ignorar error si no hay stats
        }
      }
    } catch (error) {
      console.error("Error al cargar logs:", error);
      toast.error("Error al cargar los logs");
    } finally {
      setIsLoading(false);
    }
  }, [page, filters, availableActions.length]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Manejar cambio de filtros
  const handleFilterChange = (key: keyof LogFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  // Exportar logs
  const handleExport = (format: "csv" | "json") => {
    const url =
      format === "csv"
        ? adminService.getExportCsvUrl(filters)
        : adminService.getExportJsonUrl(filters);

    window.open(url, "_blank");
    toast.success(`Exportando logs a ${format.toUpperCase()}`);
  };

  return (
    <div className="system-logs">
      <div className="logs-header">
        <div className="header-info">
          <h3 className="section-title">Logs del Sistema</h3>
          <p className="section-description">
            Registro de actividades y eventos del sistema. Los logs son
            inmutables.
          </p>
        </div>
        <div className="header-actions">
          <button
            className="export-btn"
            onClick={() => handleExport("csv")}
            title="Exportar a CSV"
          >
            <FileText size={16} />
            <span>CSV</span>
          </button>
          <button
            className="export-btn"
            onClick={() => handleExport("json")}
            title="Exportar a JSON"
          >
            <FileJson size={16} />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar en logs..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <Filter size={16} />
          <select
            value={filters.level}
            onChange={(e) => handleFilterChange("level", e.target.value)}
            className="filter-select"
          >
            <option value="">Todos los niveles</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="ERROR">ERROR</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>

        <div className="filter-group">
          <select
            value={filters.action}
            onChange={(e) => handleFilterChange("action", e.target.value)}
            className="filter-select"
          >
            <option value="">Todas las acciones</option>
            {availableActions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group date-filter">
          <Calendar size={16} />
          <input
            type="date"
            value={filters.start_date?.split("T")[0] || ""}
            onChange={(e) =>
              handleFilterChange("start_date", e.target.value ? `${e.target.value}T00:00:00` : "")
            }
            className="date-input"
          />
          <span>-</span>
          <input
            type="date"
            value={filters.end_date?.split("T")[0] || ""}
            onChange={(e) =>
              handleFilterChange("end_date", e.target.value ? `${e.target.value}T23:59:59` : "")
            }
            className="date-input"
          />
        </div>

        <button
          className="refresh-btn"
          onClick={loadLogs}
          disabled={isLoading}
          title="Actualizar"
        >
          <RefreshCw size={16} className={isLoading ? "spinning" : ""} />
        </button>
      </div>

      {/* Tabla de logs */}
      {isLoading ? (
        <div className="loading-state">
          <Loader2 size={32} className="spinning" />
          <p>Cargando logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <h4>No hay logs para mostrar</h4>
          <p>Ajusta los filtros o espera a que se generen nuevos eventos.</p>
        </div>
      ) : (
        <>
          <div className="logs-table-wrapper">
            <table className="logs-table">
              <thead>
                <tr>
                  <th style={{ width: "150px" }}>Fecha</th>
                  <th style={{ width: "100px" }}>Nivel</th>
                  <th style={{ width: "140px" }}>Acción</th>
                  <th style={{ width: "150px" }}>Usuario</th>
                  <th>Mensaje</th>
                  <th style={{ width: "100px" }}>IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const levelColor = LEVEL_COLORS[log.level as LogLevel] || "#64748b";
                  const levelBg = LEVEL_BG_COLORS[log.level as LogLevel] || "transparent";

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        className={`log-row level-${log.level.toLowerCase()}`}
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        style={{
                          backgroundColor: log.level === "ERROR" || log.level === "CRITICAL"
                            ? levelBg
                            : undefined,
                          cursor: log.details ? "pointer" : "default",
                        }}
                      >
                        <td className="date-cell">{formatDate(log.created_at)}</td>
                        <td>
                          <span
                            className="level-badge"
                            style={{ color: levelColor, backgroundColor: levelBg }}
                          >
                            {LEVEL_ICONS[log.level as LogLevel]}
                            <span>{log.level}</span>
                          </span>
                        </td>
                        <td className="action-cell">{log.action}</td>
                        <td className="user-cell">
                          {log.user_name || (
                            <span className="system-user">Sistema</span>
                          )}
                        </td>
                        <td className="message-cell" title={log.message}>
                          {log.message.length > 80
                            ? `${log.message.substring(0, 80)}...`
                            : log.message}
                          {log.details && (
                            <span className="has-details" title="Ver detalles">
                              📋
                            </span>
                          )}
                        </td>
                        <td className="ip-cell">{log.ip_address || "-"}</td>
                      </tr>
                      {isExpanded && log.details && (
                        <tr className="details-row">
                          <td colSpan={6}>
                            <div className="details-content">
                              <strong>Detalles:</strong>
                              <pre>{JSON.stringify(log.details, null, 2)}</pre>
                              {log.user_agent && (
                                <div className="user-agent">
                                  <strong>User Agent:</strong> {log.user_agent}
                                </div>
                              )}
                              {log.resource && (
                                <div className="resource">
                                  <strong>Recurso:</strong> {log.resource}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="pagination">
            <span className="pagination-info">
              Mostrando {(page - 1) * pageSize + 1} -{" "}
              {Math.min(page * pageSize, total)} de {total} logs
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
        .system-logs { display: flex; flex-direction: column; gap: 1rem; }
        .logs-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
        .section-title { font-size: var(--text-h3); font-weight: var(--font-semibold); color: var(--text-primary); margin: 0 0 0.25rem 0; }
        .section-description { font-size: var(--text-label); color: var(--text-secondary); margin: 0; }
        .header-actions { display: flex; gap: 0.5rem; }
        .export-btn { display: flex; align-items: center; gap: 0.375rem; padding: 0.5rem 0.75rem; background-color: var(--bg-tertiary); border: 1px solid var(--border-primary); border-radius: 0.375rem; color: var(--text-secondary); font-size: var(--text-caption); cursor: pointer; transition: all 0.15s ease; }
        .export-btn:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
        .filters-bar { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background-color: var(--bg-tertiary); border-radius: 0.5rem; flex-wrap: wrap; }
        .search-box { display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 200px; background-color: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 0.375rem; padding: 0.5rem 0.75rem; }
        :global(.search-icon) { color: var(--text-muted); }
        .search-input { flex: 1; border: none; background: transparent; color: var(--text-primary); font-size: var(--text-caption); outline: none; }
        .filter-group { display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); }
        .filter-select, .date-input { padding: 0.5rem 0.75rem; background-color: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 0.375rem; color: var(--text-primary); font-size: var(--text-caption); cursor: pointer; }
        .date-filter { display: flex; align-items: center; gap: 0.5rem; }
        .date-filter span { color: var(--text-muted); }
        .date-input { width: 130px; }
        .refresh-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background-color: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 0.375rem; color: var(--text-secondary); cursor: pointer; transition: all 0.15s ease; }
        .refresh-btn:hover:not(:disabled) { border-color: var(--accent-primary); color: var(--accent-primary); }
        .loading-state, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; color: var(--text-muted); text-align: center; gap: 1rem; }
        .empty-state h4 { color: var(--text-primary); margin: 0; }
        .empty-state p { margin: 0; }
        .logs-table-wrapper { overflow-x: auto; border: 1px solid var(--border-primary); border-radius: 0.5rem; }
        .logs-table { width: 100%; border-collapse: collapse; font-size: var(--text-caption); }
        .logs-table th, .logs-table td { padding: 0.625rem 0.75rem; text-align: left; border-bottom: 1px solid var(--border-primary); }
        .logs-table th { background-color: var(--bg-tertiary); font-weight: var(--font-semibold); color: var(--text-primary); white-space: nowrap; position: sticky; top: 0; }
        .log-row:hover { background-color: var(--bg-tertiary) !important; }
        .date-cell { font-family: monospace; font-size: 0.7rem; color: var(--text-secondary); white-space: nowrap; }
        .level-badge { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.65rem; font-weight: var(--font-semibold); }
        .action-cell { font-family: monospace; font-size: 0.7rem; color: var(--accent-primary); }
        .user-cell { font-size: 0.75rem; }
        .system-user { color: var(--text-muted); font-style: italic; }
        .message-cell { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .has-details { margin-left: 0.5rem; cursor: pointer; }
        .ip-cell { font-family: monospace; font-size: 0.7rem; color: var(--text-muted); }
        .details-row td { background-color: var(--bg-tertiary); padding: 1rem; }
        .details-content { font-size: 0.75rem; }
        .details-content pre { background-color: var(--bg-primary); padding: 0.75rem; border-radius: 0.375rem; overflow-x: auto; margin: 0.5rem 0; font-size: 0.7rem; }
        .details-content .user-agent, .details-content .resource { margin-top: 0.5rem; color: var(--text-secondary); }
        .pagination { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background-color: var(--bg-tertiary); border-radius: 0.5rem; }
        .pagination-info { font-size: var(--text-caption); color: var(--text-secondary); }
        .pagination-controls { display: flex; align-items: center; gap: 0.5rem; }
        .page-btn { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background-color: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 0.25rem; color: var(--text-secondary); cursor: pointer; }
        .page-btn:hover:not(:disabled) { border-color: var(--accent-primary); color: var(--accent-primary); }
        .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .page-indicator { font-size: var(--text-caption); color: var(--text-secondary); padding: 0 0.5rem; }
        :global(.spinning) { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 1024px) { .filters-bar { flex-direction: column; align-items: stretch; } .search-box { min-width: unset; } .date-filter { flex-wrap: wrap; } }
      `}</style>
    </div>
  );
}

export default SystemLogs;

