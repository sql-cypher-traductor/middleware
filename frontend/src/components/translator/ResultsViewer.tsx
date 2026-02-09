"use client";
/* eslint-disable react-hooks/incompatible-library */

import React, { useState, useRef, useMemo, useCallback } from "react";
import {
  Table,
  FileJson,
  Share2,
  Copy,
  Download,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { toPng } from "html-to-image";
import type {
  ExecutionResponse,
  TabularData,
  ForceGraphData,
  ForceGraphNode,
  ForceGraphLink,
} from "@/types/execution";
import { toast } from "sonner";

// Importación dinámica del grafo para evitar SSR issues
import dynamic from "next/dynamic";
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="graph-loading">Cargando visualización...</div>
  ),
});

type ResultTab = "table" | "json" | "graph";

interface ResultsViewerProps {
  result: ExecutionResponse | null;
}

export function ResultsViewer({ result }: ResultsViewerProps) {
  const [activeTab, setActiveTab] = useState<ResultTab>("table");
  const [copied, setCopied] = useState(false);
  const graphRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Convertir datos del grafo al formato de react-force-graph
  const forceGraphData = useMemo((): ForceGraphData => {
    if (!result?.graph_data) {
      return { nodes: [], links: [] };
    }

    const { nodes, relationships } = result.graph_data;

    // Colores para diferentes labels
    const labelColors: Record<string, string> = {};
    const colorPalette = [
      "#06b6d4",
      "#22c55e",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#ec4899",
      "#14b8a6",
      "#f97316",
    ];
    let colorIndex = 0;

    const graphNodes: ForceGraphNode[] = nodes.map((node) => {
      const primaryLabel = node.labels[0] || "Node";
      if (!labelColors[primaryLabel]) {
        labelColors[primaryLabel] = colorPalette[colorIndex % colorPalette.length];
        colorIndex++;
      }

      return {
        id: node.id.toString(),
        label: primaryLabel,
        labels: node.labels,
        properties: node.properties,
        color: labelColors[primaryLabel],
      };
    });

    const graphLinks: ForceGraphLink[] = relationships.map((rel) => ({
      source: rel.start_node_id.toString(),
      target: rel.end_node_id.toString(),
      type: rel.type,
      properties: rel.properties,
    }));

    return { nodes: graphNodes, links: graphLinks };
  }, [result?.graph_data]);

  // Copiar resultados al portapapeles
  const handleCopy = useCallback(async () => {
    try {
      if (activeTab === "table" && result?.tabular_data) {
        // Copiar como texto tabular
        const { columns, rows } = result.tabular_data;
        const header = columns.join("\t");
        const body = rows
          .map((row) => columns.map((col) => String(row[col] ?? "")).join("\t"))
          .join("\n");
        await navigator.clipboard.writeText(`${header}\n${body}`);
      } else if (activeTab === "json") {
        // Copiar como JSON
        const jsonData = {
          tabular_data: result?.tabular_data,
          graph_data: result?.graph_data,
          statistics: result?.statistics,
        };
        await navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
      } else if (activeTab === "graph" && graphRef.current) {
        // Copiar grafo como imagen
        const dataUrl = await toPng(graphRef.current);
        const blob = await (await fetch(dataUrl)).blob();
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
      }

      setCopied(true);
      toast.success("Copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Error al copiar");
      console.error(error);
    }
  }, [activeTab, result]);

  // Descargar resultados
  const handleDownload = useCallback(async () => {
    try {
      let content: string;
      let filename: string;
      let type: string;

      if (activeTab === "table" && result?.tabular_data) {
        // Descargar como CSV
        const { columns, rows } = result.tabular_data;
        const header = columns.join(",");
        const body = rows
          .map((row) =>
            columns
              .map((col) => {
                const val = row[col];
                const str = String(val ?? "");
                // Escapar comillas y valores con comas
                return str.includes(",") || str.includes('"')
                  ? `"${str.replace(/"/g, '""')}"`
                  : str;
              })
              .join(",")
          )
          .join("\n");
        content = `${header}\n${body}`;
        filename = `resultado_${Date.now()}.csv`;
        type = "text/csv";
      } else if (activeTab === "json") {
        // Descargar como JSON
        const jsonData = {
          tabular_data: result?.tabular_data,
          graph_data: result?.graph_data,
          statistics: result?.statistics,
        };
        content = JSON.stringify(jsonData, null, 2);
        filename = `resultado_${Date.now()}.json`;
        type = "application/json";
      } else if (activeTab === "graph" && graphRef.current) {
        // Descargar grafo como PNG
        const dataUrl = await toPng(graphRef.current, { quality: 1 });
        const link = document.createElement("a");
        link.download = `grafo_${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        toast.success("Imagen descargada");
        return;
      } else {
        return;
      }

      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Archivo descargado");
    } catch (error) {
      toast.error("Error al descargar");
      console.error(error);
    }
  }, [activeTab, result]);

  if (!result) {
    return (
      <div className="results-empty">
        <p>Ejecuta una consulta para ver los resultados aquí</p>
        <style jsx>{`
          .results-empty {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            color: var(--text-muted);
            font-size: var(--text-body);
            background-color: var(--bg-tertiary);
            border-radius: 0.5rem;
            border: 1px dashed var(--border-primary);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="results-viewer">
      {/* Header con tabs */}
      <div className="results-header">
        <div className="tabs">
          <button
            className={`tab ${activeTab === "table" ? "active" : ""}`}
            onClick={() => setActiveTab("table")}
          >
            <Table size={16} />
            <span>Tabla</span>
          </button>
          <button
            className={`tab ${activeTab === "json" ? "active" : ""}`}
            onClick={() => setActiveTab("json")}
          >
            <FileJson size={16} />
            <span>JSON</span>
          </button>
          <button
            className={`tab ${activeTab === "graph" ? "active" : ""}`}
            onClick={() => setActiveTab("graph")}
          >
            <Share2 size={16} />
            <span>Grafo</span>
          </button>
        </div>

        <div className="actions">
          <button className="action-btn" onClick={handleCopy} title="Copiar">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <button className="action-btn" onClick={handleDownload} title="Descargar">
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      {result.statistics && (
        <div className="statistics">
          <span className="stat">
            <strong>{result.statistics.rows_affected}</strong> filas
          </span>
          <span className="stat">
            <strong>{(result.statistics.execution_time * 1000).toFixed(2)}</strong> ms
          </span>
          {result.statistics.nodes_created > 0 && (
            <span className="stat">
              <strong>{result.statistics.nodes_created}</strong> nodos creados
            </span>
          )}
          {result.statistics.relationships_created > 0 && (
            <span className="stat">
              <strong>{result.statistics.relationships_created}</strong> relaciones creadas
            </span>
          )}
        </div>
      )}

      {/* Contenido de la tab */}
      <div className="tab-content">
        {activeTab === "table" && (
          <div ref={tableRef}>
            <TableView data={result.tabular_data} />
          </div>
        )}
        {activeTab === "json" && <JsonView result={result} />}
        {activeTab === "graph" && (
          <div ref={graphRef} className="graph-container">
            <GraphView data={forceGraphData} />
          </div>
        )}
      </div>

      <style jsx>{`
        .results-viewer {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 0.75rem;
          overflow: hidden;
        }

        .results-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 1rem;
          background-color: var(--bg-tertiary);
          border-bottom: 1px solid var(--border-primary);
        }

        .tabs {
          display: flex;
          gap: 0.25rem;
        }

        .tab {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 0.75rem;
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
          background-color: var(--bg-secondary);
          color: var(--text-primary);
        }

        .tab.active {
          background-color: var(--accent-primary);
          color: white;
        }

        .actions {
          display: flex;
          gap: 0.25rem;
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: transparent;
          border: 1px solid var(--border-primary);
          border-radius: 0.375rem;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .action-btn:hover {
          background-color: var(--bg-secondary);
          color: var(--text-primary);
          border-color: var(--accent-primary);
        }

        .statistics {
          display: flex;
          gap: 1rem;
          padding: 0.5rem 1rem;
          background-color: var(--bg-tertiary);
          border-bottom: 1px solid var(--border-primary);
          font-size: var(--text-caption);
          color: var(--text-secondary);
        }

        .stat strong {
          color: var(--text-primary);
        }

        .tab-content {
          min-height: 300px;
          max-height: 500px;
          overflow: auto;
        }

        .graph-container {
          height: 400px;
          background-color: var(--bg-primary);
        }

        :global(.graph-loading) {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}

// Componente de vista de tabla
function TableView({ data }: { data: TabularData | null }) {
  "use no memo";
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    if (!data?.columns) return [];
    return data.columns.map((col) => ({
      accessorKey: col,
      header: col,
      cell: ({ getValue }) => {
        const value = getValue();
        if (value === null || value === undefined) {
          return <span className="null-value">NULL</span>;
        }
        if (typeof value === "object") {
          return (
            <span className="object-value" title={JSON.stringify(value)}>
              {JSON.stringify(value).substring(0, 50)}...
            </span>
          );
        }
        return String(value);
      },
    }));
  }, [data?.columns]);

  const tableData = useMemo(() => data?.rows || [], [data?.rows]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  if (!data || data.rows.length === 0) {
    return (
      <div className="empty-table">
        <p>No hay datos para mostrar</p>
        <style jsx>{`
          .empty-table {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            color: var(--text-muted);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  style={{ cursor: "pointer" }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === "asc" && " ↑"}
                  {header.column.getIsSorted() === "desc" && " ↓"}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Paginación */}
      <div className="pagination">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft size={16} />
        </button>
        <span>
          Página {table.getState().pagination.pageIndex + 1} de{" "}
          {table.getPageCount()}
        </span>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <style jsx>{`
        .table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: var(--text-caption);
        }

        th,
        td {
          padding: 0.5rem 0.75rem;
          text-align: left;
          border-bottom: 1px solid var(--border-primary);
        }

        th {
          background-color: var(--bg-tertiary);
          font-weight: var(--font-semibold);
          color: var(--text-primary);
          white-space: nowrap;
        }

        td {
          color: var(--text-secondary);
          font-family: monospace;
        }

        tr:hover td {
          background-color: var(--bg-tertiary);
        }

        :global(.null-value) {
          color: var(--text-muted);
          font-style: italic;
        }

        :global(.object-value) {
          color: var(--accent-primary);
          cursor: help;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 0.75rem;
          border-top: 1px solid var(--border-primary);
          background-color: var(--bg-tertiary);
        }

        .pagination button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 0.25rem;
          color: var(--text-secondary);
          cursor: pointer;
        }

        .pagination button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination button:hover:not(:disabled) {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }

        .pagination span {
          font-size: var(--text-caption);
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}

// Componente de vista JSON
function JsonView({ result }: { result: ExecutionResponse }) {
  const jsonData = useMemo(
    () => ({
      tabular_data: result.tabular_data,
      graph_data: result.graph_data,
      statistics: result.statistics,
    }),
    [result]
  );

  return (
    <div className="json-container">
      <pre>{JSON.stringify(jsonData, null, 2)}</pre>
      <style jsx>{`
        .json-container {
          padding: 1rem;
          background-color: var(--bg-primary);
          overflow: auto;
        }

        pre {
          margin: 0;
          font-family: "Fira Code", "Consolas", monospace;
          font-size: 12px;
          color: var(--text-secondary);
          white-space: pre-wrap;
          word-break: break-word;
        }
      `}</style>
    </div>
  );
}

// Componente de vista de grafo
function GraphView({ data }: { data: ForceGraphData }) {
  if (data.nodes.length === 0) {
    return (
      <div className="empty-graph">
        <Share2 size={48} strokeWidth={1} />
        <p>No hay nodos para visualizar</p>
        <style jsx>{`
          .empty-graph {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: 1rem;
            color: var(--text-muted);
          }
        `}</style>
      </div>
    );
  }

  return (
    <ForceGraph2D
      graphData={data as { nodes: object[]; links: object[] }}
      nodeLabel={(node: unknown) => {
        const n = node as ForceGraphNode;
        const props = Object.entries(n.properties || {})
          .slice(0, 3)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n");
        return `${n.label}\n${props}`;
      }}
      nodeColor={(node: unknown) => (node as ForceGraphNode).color || "#06b6d4"}
      nodeRelSize={8}
      linkLabel={(link: unknown) => (link as ForceGraphLink).type}
      linkDirectionalArrowLength={6}
      linkDirectionalArrowRelPos={1}
      linkColor={() => "#64748b"}
      linkWidth={2}
      backgroundColor="transparent"
      nodeCanvasObject={(node: unknown, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const n = node as ForceGraphNode & { x: number; y: number };
        const label = n.label || "";
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = n.color || "#06b6d4";

        // Dibujar círculo
        ctx.beginPath();
        ctx.arc(n.x, n.y, 8, 0, 2 * Math.PI);
        ctx.fill();

        // Dibujar etiqueta
        ctx.fillStyle = "#ffffff";
        ctx.fillText(label.substring(0, 10), n.x, n.y + 15);
      }}
    />
  );
}



