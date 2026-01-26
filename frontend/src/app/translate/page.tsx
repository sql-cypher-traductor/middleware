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
import { Play, Loader2, ArrowRightLeft, LayoutDashboard } from "lucide-react";
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
  const [refreshHistory, setRefreshHistory] = useState(0); // Trigger para actualizar sidebar

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
          <div className="flex-1 flex flex-col gap-2 min-h-75">
            <span className="text-sm font-medium text-slate-500 ml-1">
              Salida Cypher
            </span>
            <CodeEditor
              language="plaintext" // Monaco no tiene 'cypher' nativo por defecto, plaintext sirve por ahora
              value={cypherCode}
              readOnly={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
