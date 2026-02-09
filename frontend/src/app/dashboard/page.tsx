"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/shared/Header";
import { ConnectionsPanel } from "@/components/dashboard/ConnectionsPanel";
import { authService } from "@/services/authService";
import type { UserResponse } from "@/types/auth";
import { Loader2, ArrowRightLeft, Play } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch {
        // Si no está autenticado, redirigir al login
        router.push("/auth");
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [router]);

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
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
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
        <ConnectionsPanel />

        {/* Área principal de traducción */}
        <main className="main-content">
          <div className="content-wrapper">
            {/* Header del área de traducción */}
            <div className="translation-header">
              <h2 className="section-title">Traductor SQL → Cypher</h2>
              <p className="section-description">
                Escribe tu consulta SQL y tradúcela a Cypher para Neo4j.
              </p>
            </div>

            {/* Área de traducción - Placeholder */}
            <div className="translation-area">
              <div className="editor-panel">
                <div className="editor-header">
                  <span className="editor-label">SQL Query</span>
                </div>
                <div className="editor-placeholder">
                  <p>Editor SQL próximamente...</p>
                </div>
              </div>

              <div className="translation-controls">
                <button className="translate-button" disabled>
                  <ArrowRightLeft size={20} />
                  <span>Traducir</span>
                </button>
              </div>

              <div className="editor-panel">
                <div className="editor-header">
                  <span className="editor-label">Cypher Query</span>
                </div>
                <div className="editor-placeholder">
                  <p>Resultado Cypher próximamente...</p>
                </div>
              </div>
            </div>

            {/* Área de resultados - Placeholder */}
            <div className="results-area">
              <div className="results-header">
                <h3 className="results-title">Resultados</h3>
                <button className="execute-button" disabled>
                  <Play size={16} />
                  <span>Ejecutar</span>
                </button>
              </div>
              <div className="results-placeholder">
                <p>Los resultados de la ejecución aparecerán aquí...</p>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: var(--bg-secondary);
          position: relative;
        }

        .dashboard-layout {
          display: flex;
          flex: 1;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }

        .main-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .content-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .translation-header {
          margin-bottom: 0.5rem;
        }

        .section-title {
          font-size: var(--text-h2);
          font-weight: var(--font-semibold);
          color: var(--text-primary);
          margin: 0 0 0.5rem 0;
        }

        .section-description {
          font-size: var(--text-body);
          color: var(--text-secondary);
          margin: 0;
        }

        .translation-area {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 1rem;
          align-items: stretch;
        }

        .editor-panel {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 0.75rem;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .editor-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background-color: var(--bg-tertiary);
          border-bottom: 1px solid var(--border-primary);
        }

        .editor-label {
          font-size: var(--text-label);
          font-weight: var(--font-medium);
          color: var(--text-primary);
        }

        .editor-placeholder {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          color: var(--text-muted);
          font-size: var(--text-body);
        }

        .translation-controls {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .translate-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.375rem;
          padding: 1rem;
          background-color: var(--accent-primary);
          color: white;
          border: none;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.15s ease;
          font-size: var(--text-label);
          font-weight: var(--font-medium);
        }

        .translate-button:hover:not(:disabled) {
          background-color: var(--cyan-600);
          transform: scale(1.05);
        }

        .translate-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .results-area {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 0.75rem;
          overflow: hidden;
        }

        .results-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background-color: var(--bg-tertiary);
          border-bottom: 1px solid var(--border-primary);
        }

        .results-title {
          font-size: var(--text-label);
          font-weight: var(--font-medium);
          color: var(--text-primary);
          margin: 0;
        }

        .execute-button {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          background-color: var(--green-500);
          color: white;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: var(--text-caption);
          font-weight: var(--font-medium);
          transition: all 0.15s ease;
        }

        .execute-button:hover:not(:disabled) {
          background-color: var(--green-600);
        }

        .execute-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .results-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 150px;
          color: var(--text-muted);
          font-size: var(--text-body);
        }

        @media (max-width: 1024px) {
          .translation-area {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto auto;
          }

          .translation-controls {
            padding: 0.5rem;
          }

          .translate-button {
            flex-direction: row;
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 768px) {
          .dashboard-layout {
            flex-direction: column;
          }

          .main-content {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}

