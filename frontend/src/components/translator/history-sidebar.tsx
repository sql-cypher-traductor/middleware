"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import api from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History } from "lucide-react";

// Tipo para el historial
interface TranslationEntry {
  id: number;
  sql_query: string;
  cypher_query?: string;
  error_message?: string;
  created_at: string;
}

interface HistorySidebarProps {
  onSelect: (sql: string, cypher?: string) => void;
  refreshTrigger: number; // Prop truco para recargar
}

export function HistorySidebar({
  onSelect,
  refreshTrigger,
}: HistorySidebarProps) {
  const [history, setHistory] = useState<TranslationEntry[]>([]);

  useEffect(() => {
    // Cargar historial
    api
      .get("/translate/history")
      .then((res) => setHistory(res.data))
      .catch((err) => console.error("Error cargando historial", err));
  }, [refreshTrigger]);

  return (
    <div className="w-80 border-r bg-slate-50 dark:bg-slate-950 flex flex-col h-full">
      <div className="p-4 border-b flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
        <History className="w-4 h-4" />
        Historial de Consultas
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {history.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin traducciones aún.
            </p>
          )}

          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.sql_query, item.cypher_query)}
              className="w-full text-left p-3 rounded-lg border bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group relative overflow-hidden"
            >
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 ${item.error_message ? "bg-red-500" : "bg-green-500"}`}
              />

              <div className="flex items-center justify-between mb-1 pl-2">
                <span className="text-xs font-mono text-muted-foreground truncate max-w-30">
                  {item.error_message ? "Error" : "Exitoso"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(item.created_at), {
                    addSuffix: true,
                    locale: es,
                  })}
                </span>
              </div>

              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2 pl-2">
                {item.sql_query}
              </p>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
