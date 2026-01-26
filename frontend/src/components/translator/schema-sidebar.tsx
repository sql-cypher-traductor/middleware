//
"use client";

import { useState, useEffect } from "react";
import {
  Database,
  Table as TableIcon,
  Columns,
  ChevronRight,
  ChevronDown,
  Plus,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";

interface ColumnInfo {
  name: string;
  type: string;
}

interface SchemaData {
  [tableName: string]: ColumnInfo[];
}

interface SchemaSidebarProps {
  connectionId: string;
  onInsert: (text: string) => void;
}

export function SchemaSidebar({ connectionId, onInsert }: SchemaSidebarProps) {
  const [schema, setSchema] = useState<SchemaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    if (!connectionId) return;

    setLoading(true);
    api
      .get(`/connections/${connectionId}/schema`)
      .then((res) => setSchema(res.data))
      .catch((err) => console.error("Error cargando esquema", err))
      .finally(() => setLoading(false));
  }, [connectionId]);

  const toggleTable = (table: string) => {
    setExpandedTables((prev) => ({ ...prev, [table]: !prev[table] }));
  };

  if (!connectionId) {
    return (
      <div className="p-4 text-xs text-muted-foreground">
        Selecciona una conexión para ver su esquema.
      </div>
    );
  }

  return (
    <div className="w-64 border-l bg-slate-50 dark:bg-slate-950 flex flex-col h-full">
      <div className="p-3 border-b flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200 text-sm">
        <Database className="w-4 h-4" />
        Explorador de Esquema
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          )}

          {!loading && schema && Object.keys(schema).length === 0 && (
            <div className="text-xs text-center p-4 text-muted-foreground">
              No se encontraron tablas.
            </div>
          )}

          {!loading &&
            schema &&
            Object.entries(schema).map(([table, columns]) => (
              <div
                key={table}
                className="border rounded-md bg-white dark:bg-slate-900 overflow-hidden"
              >
                {/* Header de la Tabla */}
                <div
                  className="flex items-center justify-between p-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer group"
                  onClick={() => toggleTable(table)}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {expandedTables[table] ? (
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    )}
                    <TableIcon className="w-3 h-3 text-indigo-500" />
                    <span
                      className="text-xs font-medium truncate"
                      title={table}
                    >
                      {table}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onInsert(table);
                    }}
                    title="Insertar nombre de tabla"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>

                {/* Lista de Columnas */}
                {expandedTables[table] && (
                  <div className="bg-slate-50 dark:bg-slate-950 p-1 pl-6 space-y-0.5 border-t">
                    {columns.map((col) => (
                      <div
                        key={col.name}
                        className="flex items-center justify-between group hover:bg-slate-200 dark:hover:bg-slate-800 rounded px-1 py-0.5 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Columns className="w-3 h-3 text-slate-400" />
                          <span
                            className="text-[10px] text-slate-600 dark:text-slate-300 truncate"
                            title={col.name}
                          >
                            {col.name}
                          </span>
                          <span className="text-[9px] text-slate-400 italic">
                            {col.type}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 opacity-0 group-hover:opacity-100"
                          onClick={() => onInsert(col.name)}
                        >
                          <Plus className="w-2 h-2" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      </ScrollArea>
    </div>
  );
}
