"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/shared/Header";
import { ConnectionsSidebar } from "@/components/connections/ConnectionsSidebar";
import { TranslationPanel } from "@/components/translator/TranslationPanel";
import { ResultsViewer } from "@/components/translator/ResultsViewer";
import { authService } from "@/services/authService";
import type { UserResponse } from "@/types/auth";
import type { ConnectionResponse } from "@/types/connection";
import type { ExecutionResponse } from "@/types/execution";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Estado de conexiones activas
  const [activeSqlConnection, setActiveSqlConnection] = useState<ConnectionResponse | null>(null);
  const [activeNeo4jConnection, setActiveNeo4jConnection] = useState<ConnectionResponse | null>(null);

  // Resultado de ejecución
  const [executionResult, setExecutionResult] = useState<ExecutionResponse | null>(null);

  // Consultas reutilizadas desde el historial
  const [reusedSql, setReusedSql] = useState("");
  const [reusedCypher, setReusedCypher] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch {
        router.push("/auth");
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [router]);

  // Verificar si hay una consulta reutilizada desde el historial
  useEffect(() => {
    const stored = sessionStorage.getItem("reuseQuery");
    if (stored) {
      try {
        const { sql, cypher } = JSON.parse(stored);
        setReusedSql(sql || "");
        setReusedCypher(cypher || "");
        sessionStorage.removeItem("reuseQuery");
        toast.success("Consulta cargada desde el historial");
      } catch {
        console.error("Error parsing reused query");
      }
    }
  }, []);

  const handleExecutionResult = (result: ExecutionResponse) => {
    setExecutionResult(result);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <Loader2 className="spinner" size={40} />
        <p>Cargando...</p>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            gap: 1rem;
            color: var(--text-secondary);
          }
          .spinner {
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
        `}</style>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard">
      <Header user={user} />

      <div className="dashboard-layout">
        {/* Panel lateral de conexiones */}
        <ConnectionsSidebar
          onSqlConnectionChange={setActiveSqlConnection}
          onNeo4jConnectionChange={setActiveNeo4jConnection}
        />

        {/* Área principal */}
        <main className="main-content">
          {/* Header del traductor */}
          <div className="translator-header">
            <div className="header-info">
              <h2 className="section-title">Traductor SQL → Cypher</h2>
              <p className="section-description">
                Escribe tu consulta SQL y tradúcela a Cypher para Neo4j
              </p>
            </div>
            <div className="connection-status">
              {activeSqlConnection && (
                <span className="status-badge sql">
                  SQL: {activeSqlConnection.connection_name}
                </span>
              )}
              {activeNeo4jConnection && (
                <span className="status-badge neo4j">
                  Neo4j: {activeNeo4jConnection.connection_name}
                </span>
              )}
            </div>
          </div>

          {/* Panel de traducción */}
          <TranslationPanel
            activeNeo4jConnectionId={activeNeo4jConnection?.connection_id}
            onExecutionResult={handleExecutionResult}
            initialSql={reusedSql}
            initialCypher={reusedCypher}
          />

          {/* Panel de resultados - Solo visible después de ejecutar */}
          {executionResult && (
            <div className="results-section">
              <h3 className="results-title">Resultados de la Ejecución</h3>
              <ResultsViewer result={executionResult} />
            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: var(--bg-primary);
        }

        .dashboard-layout {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .main-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .translator-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .header-info {
          flex: 1;
        }

        .section-title {
          font-size: var(--text-h2);
          font-weight: var(--font-semibold);
          color: var(--text-primary);
          margin: 0 0 0.25rem 0;
        }

        .section-description {
          font-size: var(--text-body);
          color: var(--text-secondary);
          margin: 0;
        }

        .connection-status {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: var(--text-caption);
          font-weight: var(--font-medium);
        }

        .status-badge.sql {
          background-color: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .status-badge.neo4j {
          background-color: rgba(34, 197, 94, 0.15);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .results-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .results-title {
          font-size: var(--text-label);
          font-weight: var(--font-semibold);
          color: var(--text-primary);
          margin: 0;
        }

        @media (max-width: 1024px) {
          .dashboard-layout {
            flex-direction: column;
          }

          .main-content {
            padding: 1rem;
          }
        }

        @media (max-width: 768px) {
          .translator-header {
            flex-direction: column;
          }

          .connection-status {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
