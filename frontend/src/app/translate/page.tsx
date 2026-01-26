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
import { Play, Loader2, ArrowRightLeft, LayoutDashboard } from "lucide-react";
import { GraphView } from "@/components/visualizer/graph-view";
import { AxiosError } from "axios";
import { DbConnection } from "@/types/db-connection";

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
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [activeTab, setActiveTab] = useState("cypher");
  const [isExecuting, setIsExecuting] = useState(false);

  // Cargar conexiones al inicio
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
    // Encontramos el motor de la conexión seleccionada
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
    } catch (error) {
      console.error(error);
      type ErrorResponse = {
        detail: string | { reason: string };
      };

      const err = error as AxiosError<ErrorResponse>;
      let msg = "Error en la traducción";

      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === "string") {
          msg = detail;
        } else if (typeof detail === "object" && detail.reason) {
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
      console.error("Error capturado:", error); // Para depurar en consola

      interface ValidationError {
        msg: string;
        loc?: (string | number)[];
      }

      interface ApiErrorResponse {
        detail?: string | { reason: string } | ValidationError[];
      }

      const err = error as AxiosError<ApiErrorResponse>;
      let msg = "Error desconocido de ejecución";

      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;

        // CASO 1: Error 422 de Pydantic (Lista de objetos) -> El que te causó el error
        if (Array.isArray(detail)) {
          // Tomamos el primer mensaje de error y le indicamos dónde falló
          msg = `${detail[0].msg} (Campo: ${detail[0].loc?.join(".")})`;
        }
        // CASO 2: Error estructurado { reason: "..." } (Tu formato custom)
        else if (typeof detail === "object" && detail.reason) {
          msg = detail.reason;
        }
        // CASO 3: String directo (Error 500 simple)
        else if (typeof detail === "string") {
          msg = detail;
        }
      }

      toast.error("Error de ejecución", {
        description: msg, // Ahora aseguramos que SIEMPRE es un string
      });
    } finally {
      setIsExecuting(false);
    }
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
                  <SelectItem key={c.id} value={c.id.toString()}>
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
        <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 bg-slate-50 dark:bg-slate-950">
          {/* SQL INPUT */}
          <div className="flex-1 flex flex-col gap-2 min-h-75">
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

          {/* CYPHER OUTPUT */}
          <div className="flex-1 flex flex-col gap-2 min-h-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 ml-1">
                Resultados
              </span>
              {/* Botón Mágico */}
              <Button
                size="sm"
                variant="secondary"
                onClick={handleExecute}
                disabled={isExecuting || !cypherCode}
                className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
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
                <TabsTrigger value="json">JSON</TabsTrigger>
              </TabsList>

              <TabsContent value="cypher" className="flex-1 h-full mt-2">
                <CodeEditor
                  language="plaintext"
                  value={cypherCode}
                  readOnly={true}
                />
              </TabsContent>

              <TabsContent
                value="graph"
                className="flex-1 h-full mt-2 border rounded-md min-h-100"
              >
                {graphData.nodes.length > 0 ? (
                  <GraphView data={graphData} />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Ejecuta una consulta para ver el grafo.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="json" className="flex-1 h-full mt-2">
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
