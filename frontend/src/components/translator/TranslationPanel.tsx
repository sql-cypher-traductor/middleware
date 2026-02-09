"use client";

import React, {useState, useEffect} from "react";
import {ArrowRightLeft, Play, Loader2} from "lucide-react";
import {CodeEditor} from "./CodeEditor";
import {executionService} from "@/services/executionService";
import type {ExecutionResponse, TranslationResponse} from "@/types/execution";
import {toast} from "sonner";

interface TranslationPanelProps {
    activeNeo4jConnectionId?: string;
    onExecutionResult?: (result: ExecutionResponse) => void;
    initialSql?: string;
    initialCypher?: string;
}

export function TranslationPanel({
                                     activeNeo4jConnectionId,
                                     onExecutionResult,
                                     initialSql = "",
                                     initialCypher = "",
                                 }: TranslationPanelProps) {
    const [sqlQuery, setSqlQuery] = useState(initialSql);
    const [cypherQuery, setCypherQuery] = useState(initialCypher);
    const [isTranslating, setIsTranslating] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [translationTime, setTranslationTime] = useState<number | null>(null);
    const [statementType, setStatementType] = useState<string | null>(null);

    // Actualizar cuando cambian los valores iniciales (desde historial)
    useEffect(() => {
        if (initialSql) {
            setSqlQuery(initialSql);
        }
        if (initialCypher) {
            setCypherQuery(initialCypher);
        }
    }, [initialSql, initialCypher]);

    // Solo traducir
    const handleTranslate = async () => {
        if (!sqlQuery.trim()) {
            toast.error("Por favor, ingresa una consulta SQL");
            return;
        }

        setIsTranslating(true);
        setCypherQuery("");
        setTranslationTime(null);
        setStatementType(null);

        try {
            const result: TranslationResponse = await executionService.translate(sqlQuery);
            setCypherQuery(result.cypher);
            setTranslationTime(result.translation_time);
            setStatementType(result.statement_type);
            toast.success("Traducción exitosa");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Error al traducir";
            toast.error(message);
            setCypherQuery(`-- Error: ${message}`);
        } finally {
            setIsTranslating(false);
        }
    };

    // Traducir y ejecutar
    const handleTranslateAndExecute = async () => {
        if (!sqlQuery.trim()) {
            toast.error("Por favor, ingresa una consulta SQL");
            return;
        }

        if (!activeNeo4jConnectionId) {
            toast.error("No hay conexión Neo4j activa. Por favor, activa una conexión primero.");
            return;
        }

        setIsExecuting(true);
        setCypherQuery("");
        setTranslationTime(null);
        setStatementType(null);

        try {
            const result = await executionService.translateAndExecute({
                sql_query: sqlQuery,
                connection_id: activeNeo4jConnectionId,
            });

            if (result.cypher_query) {
                setCypherQuery(result.cypher_query);
            }

      if (result.status === "Ejecutada") {
        toast.success("Consulta ejecutada exitosamente");
        onExecutionResult?.(result);
      } else if (result.status === "Fallida") {
        // Mostrar error con más detalle
        const errorMsg = result.error_message || "Error en la ejecución";
        toast.error(errorMsg, { duration: 6000 });

        // Construir comentario descriptivo
        let errorComment = "";
        if (result.cypher_query) {
          errorComment = `${result.cypher_query}\n\n`;
        }
        errorComment += `-- ❌ ERROR: ${errorMsg}`;

        setCypherQuery(errorComment);
        onExecutionResult?.(result);
      }

      if (result.statistics?.execution_time) {
        setTranslationTime(result.statistics.execution_time);
      }
    } catch (error) {
      // Manejar errores estructurados del validador SQL
      let errorMessage = "Error al ejecutar";
      let errorComment = "";

      if (error && typeof error === "object") {
        const apiError = error as {
          detail?: string;
          errorType?: string;
          suggestion?: string;
          message?: string;
        };

        if (apiError.detail) {
          errorMessage = apiError.detail;
        } else if (apiError.message) {
          errorMessage = apiError.message;
        }

        // Construir comentario de error para el editor
        errorComment = `-- ❌ ERROR: ${errorMessage}`;
        if (apiError.errorType) {
          errorComment += `\n-- Tipo: ${apiError.errorType}`;
        }
        if (apiError.suggestion) {
          errorComment += `\n-- 💡 Sugerencia: ${apiError.suggestion}`;
        }

        // Mostrar toast con mensaje y sugerencia
        if (apiError.suggestion) {
          toast.error(errorMessage, {
            description: apiError.suggestion,
            duration: 6000,
          });
        } else {
          toast.error(errorMessage);
        }
      } else {
        errorComment = `-- ❌ ERROR: ${errorMessage}`;
        toast.error(errorMessage);
      }

      setCypherQuery(errorComment);
    } finally {
      setIsExecuting(false);
    }
  };

    const isLoading = isTranslating || isExecuting;

    return (
        <div className="translation-panel">
            {/* Área de editores */}
            <div className="editors-container">
                {/* Editor SQL */}
                <div className="editor-section">
                    <div className="editor-header">
                        <span className="editor-label">Sentencias SQL</span>
                        {statementType && (
                            <span className="statement-badge">{statementType}</span>
                        )}
                    </div>
                    <CodeEditor
                        value={sqlQuery}
                        onChange={setSqlQuery}
                        language="sql"
                        height="250px"
                        placeholder="-- Escribe tu consulta SQL aquí SELECT * FROM users WHERE active = 1"
                    />
                </div>

                {/* Editor Cypher (solo lectura) */}
                <div className="editor-section">
                    <div className="editor-header">
                        <span className="editor-label">Sentencias Cypher</span>
                        {translationTime !== null && (
                            <span className="time-badge">
                {(translationTime * 1000).toFixed(2)} ms
              </span>
                        )}
                    </div>
                    <CodeEditor
                        value={cypherQuery}
                        language="cypher"
                        readOnly
                        height="250px"
                        placeholder="// La traducción Cypher aparecerá aquí"
                    />
                </div>
            </div>

            {/* Botones de acción */}
            <div className="action-buttons">
                <button
                    className="action-btn translate-btn"
                    onClick={handleTranslate}
                    disabled={isLoading || !sqlQuery.trim()}
                >
                    {isTranslating ? (
                        <Loader2 className="spinner" size={18}/>
                    ) : (
                        <ArrowRightLeft size={18}/>
                    )}
                    <span>Traducir</span>
                </button>

                <button
                    className="action-btn execute-btn"
                    onClick={handleTranslateAndExecute}
                    disabled={isLoading || !sqlQuery.trim() || !activeNeo4jConnectionId}
                    title={!activeNeo4jConnectionId ? "Activa una conexión Neo4j primero" : ""}
                >
                    {isExecuting ? (
                        <Loader2 className="spinner" size={18}/>
                    ) : (
                        <Play size={18}/>
                    )}
                    <span>Traducir y Ejecutar</span>
                </button>
            </div>

            <style jsx>{`
                .translation-panel {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .editors-container {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                .editor-section {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .editor-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.5rem 0;
                }

                .editor-label {
                    font-size: var(--text-label);
                    font-weight: var(--font-semibold);
                    color: var(--text-primary);
                }

                .statement-badge {
                    padding: 0.25rem 0.5rem;
                    background-color: var(--accent-primary);
                    color: white;
                    border-radius: 0.25rem;
                    font-size: var(--text-caption);
                    font-weight: var(--font-medium);
                }

                .time-badge {
                    padding: 0.25rem 0.5rem;
                    background-color: var(--bg-tertiary);
                    color: var(--text-secondary);
                    border-radius: 0.25rem;
                    font-size: var(--text-caption);
                    font-family: monospace;
                }

                .action-buttons {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    padding: 0.5rem 0;
                }

                .action-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    font-size: var(--text-body);
                    font-weight: var(--font-medium);
                    transition: all 0.15s ease;
                }

                .action-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .translate-btn {
                    background-color: var(--accent-primary);
                    color: white;
                }

                .translate-btn:hover:not(:disabled) {
                    background-color: var(--cyan-600);
                    transform: translateY(-1px);
                }

                .execute-btn {
                    background-color: var(--green-500);
                    color: white;
                }

                .execute-btn:hover:not(:disabled) {
                    background-color: var(--green-600);
                    transform: translateY(-1px);
                }

                :global(.spinner) {
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
                    .editors-container {
                        grid-template-columns: 1fr;
                    }

                    .action-buttons {
                        flex-direction: column;
                    }

                    .action-btn {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
}

