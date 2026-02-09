"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/shared/Header";
import { authService } from "@/services/authService";
import type { UserResponse } from "@/types/auth";
import { Loader2 } from "lucide-react";

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

      <main className="dashboard-content">
        <div className="container">
          <div className="welcome-section">
            <h1 className="text-h1">
              ¡Bienvenido, {user.first_name}!
            </h1>
            <p className="text-body text-secondary">
              Comienza a traducir tus consultas SQL a Cypher para Neo4j.
            </p>
          </div>

          {/* Área de contenido vacía por ahora */}
          <div className="empty-state">
            <p className="text-muted">
              Selecciona una opción del menú para comenzar.
            </p>
          </div>
        </div>
      </main>

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background-color: var(--bg-secondary);
        }

        .dashboard-content {
          padding: 2rem 0;
        }

        .welcome-section {
          margin-bottom: 2rem;
        }

        .text-secondary {
          color: var(--text-secondary);
        }

        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          background-color: var(--bg-secondary);
          border: 1px dashed var(--border-primary);
          border-radius: 0.75rem;
        }

        .text-muted {
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}

