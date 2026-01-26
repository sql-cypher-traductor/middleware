"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";
import { CodeEditor } from "@/components/editor/code-editor";
import { HistorySidebar } from "@/components/translator/history-sidebar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Play, Loader2, ArrowRightLeft, LayoutDashboard } from "lucide-react";
import { GraphView } from "@/components/visualizer/graph-view";
import { AxiosError } from "axios";
import { DbConnection } from "@/types/db-connection";

interface GraphNode {
  id: string | number;
  labels?: string[];
  properties?: Record<string, unknown>;
  [key: string]: unknown;
}

interface GraphLink {
  source: string | number | GraphNode;
  target: string | number | GraphNode;
  type?: string;
  properties?: Record<string, unknown>;
}

// Estructura posible del error del backend (Pydantic o Custom)
type ApiErrorDetail =
  | string
  | { reason: string }
  | { msg: string; loc?: (string | number)[] }[];

interface ApiErrorResponse {
  detail: ApiErrorDetail;
}

export default function TranslatorPage() {
  const router = useRouter();

  // Estados
  const [sqlCode, setSqlCode] = useState(
    "-- Escribe tu consulta SQL aquí\nSELECT * FROM usuarios;",
  );
  const [cypherCode, setCypherCode] = useState(
    "// Aquí aparecerá el resultado Cypher\n",
  );
  const [connections, setConnections] = useState<DbConnection[]>([]);
  const [selectedConnId, setSelectedConnId] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [refreshHistory, setRefreshHistory] = useState(0);

  const [graphData, setGraphData] = useState<{
    nodes: GraphNode[];
    links: GraphLink[];
  }>({
    nodes: [],
    links: [],
  });

  const [activeTab, setActiveTab] = useState("cypher");
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    api.get("/connections").then((res) => {
      setConnections(res.data);
      if (res.data.length > 0) setSelectedConnId(res.data[0].id.toString());
    });
  }, []);

  const handleTranslate = async () => {
    if (!selectedConnId) {
      toast.error("Selecciona una conexión origen");
      return;
    }

    setIsTranslating(true);
    const conn = connections.find((c) => c.id.toString() === selectedConnId);
    const dialect = conn?.engine || "sqlserver";

    try {
      const res = await api.post("/translate", {
        sql_query: sqlCode,
        source_db_type: dialect,
      });

      setCypherCode(res.data.cypher_query || "// No se generó código");
      toast.success("Traducción completada");
      setRefreshHistory((prev) => prev + 1);
      setActiveTab("cypher");
    } catch (error) {
      console.error(error);

      const err = error as AxiosError<ApiErrorResponse>;
      let msg = "Error en la traducción";

      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === "string") {
          msg = detail;
        } else if (
          !Array.isArray(detail) &&
          typeof detail === "object" &&
          detail.reason
        ) {
          msg = detail.reason;
        }
      }
      toast.error("Falló la traducción", { description: msg });
      setCypherCode(`// ERROR:\n// ${msg}`);
      setRefreshHistory((prev) => prev + 1);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleHistorySelect = (sql: string, cypher?: string) => {
    setSqlCode(sql);
    if (cypher) setCypherCode(cypher);
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      const res = await api.post("/execute", {
        connection_id: selectedConnId,
        cypher_query: cypherCode,
      });
      setGraphData(res.data);
      setActiveTab("graph");
      toast.success("Consulta ejecutada con éxito");
    } catch (error) {
      console.error("Error capturado:", error);

      const err = error as AxiosError<ApiErrorResponse>;
      let msg = "Error desconocido de ejecución";

      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          // Error de validación de Pydantic (lista)
          msg = `${detail[0].msg} (Campo: ${detail[0].loc?.join(".")})`;
        } else if (typeof detail === "object" && "reason" in detail) {
          // Error custom { reason: ... }
          msg = detail.reason;
        } else if (typeof detail === "string") {
          // Error simple 500
          msg = detail;
        }
      }

      toast.error("Error de ejecución", { description: msg });
    } finally {
      setIsExecuting(false);
    }
  };

  const renderResultsTable = () => {
    if (!graphData.nodes || graphData.nodes.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground p-10">
          No hay datos para mostrar en la tabla.
        </div>
      );
    }

    const sampleNode = graphData.nodes[0];
    const properties = sampleNode.properties || {};
    const columns = ["ID", "Labels", ...Object.keys(properties)];

    return (
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col}
                  className="font-bold bg-slate-100 dark:bg-slate-900"
                >
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {graphData.nodes.map((node: GraphNode, idx) => (
              <TableRow key={node.id || idx}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {node.id}
                </TableCell>
                <TableCell>
                  {node.labels?.map((l: string) => (
                    <span
                      key={l}
                      className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-[10px] font-medium mr-1"
                    >
                      {l}
                    </span>
                  ))}
                </TableCell>
                {Object.keys(properties).map((key) => (
                  <TableCell key={key} className="text-sm">
                    {String(node.properties?.[key] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* SIDEBAR */}
      <HistorySidebar
        onSelect={handleHistorySelect}
        refreshTrigger={refreshHistory}
      />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOOLBAR */}
        <header className="h-16 border-b flex items-center justify-between px-6 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard")}
              title="Volver al Dashboard"
            >
              <LayoutDashboard className="h-5 w-5 text-slate-500" />
            </Button>

            <h1 className="font-bold text-lg">Espacio de Trabajo</h1>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

            <Select value={selectedConnId} onValueChange={setSelectedConnId}>
              <SelectTrigger className="w-50">
                <SelectValue placeholder="Conexión Origen" />
              </SelectTrigger>
              <SelectContent>
                {connections.map((c) => (
                  <SelectItem key={c.id.toString()} value={c.id.toString()}>
                    {c.alias} ({c.engine})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleTranslate}
            disabled={isTranslating}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isTranslating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Traducir
          </Button>
        </header>

        {/* EDITORS SPLIT VIEW */}
        <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 bg-slate-50 dark:bg-slate-950 overflow-hidden">
          {/* SQL INPUT */}
          <div className="flex-1 flex flex-col gap-2 h-full min-h-75">
            <span className="text-sm font-medium text-slate-500 ml-1">
              Entrada SQL
            </span>
            <CodeEditor
              language="sql"
              value={sqlCode}
              onChange={(val) => setSqlCode(val || "")}
            />
          </div>

          {/* DIVIDER ICON (Visual) */}
          <div className="flex items-center justify-center text-slate-300 dark:text-slate-700">
            <ArrowRightLeft className="w-6 h-6 rotate-90 md:rotate-0" />
          </div>

          {/* CYPHER OUTPUT & RESULTS */}
          <div className="flex-1 flex flex-col gap-2 h-full min-h-75">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 ml-1">
                Resultados
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleExecute}
                disabled={isExecuting || !cypherCode}
                className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800 dark:text-indigo-400"
              >
                {isExecuting ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                ) : (
                  <Play className="h-3 w-3 mr-2" />
                )}
                Ejecutar en Neo4j
              </Button>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full h-full flex flex-col"
            >
              <TabsList className="w-full justify-start">
                <TabsTrigger value="cypher">Código Cypher</TabsTrigger>
                <TabsTrigger value="graph">Grafo Visual</TabsTrigger>
                <TabsTrigger value="table">Tabla de Datos</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
              </TabsList>

              <TabsContent
                value="cypher"
                className="flex-1 h-full mt-2 overflow-hidden"
              >
                <CodeEditor
                  language="plaintext"
                  value={cypherCode}
                  readOnly={true}
                />
              </TabsContent>

              <TabsContent
                value="graph"
                className="flex-1 h-full mt-2 border rounded-md bg-slate-50 dark:bg-slate-950 overflow-hidden"
              >
                {graphData.nodes.length > 0 ? (
                  <GraphView data={graphData} />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground p-10 text-sm">
                    Ejecuta una consulta para ver el grafo.
                  </div>
                )}
              </TabsContent>

              <TabsContent
                value="table"
                className="flex-1 mt-2 overflow-auto border rounded-md bg-white dark:bg-slate-950 p-2"
              >
                {renderResultsTable()}
              </TabsContent>

              <TabsContent
                value="json"
                className="flex-1 h-full mt-2 overflow-hidden"
              >
                <CodeEditor
                  language="json"
                  value={JSON.stringify(graphData, null, 2)}
                  readOnly={true}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
