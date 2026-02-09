"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/shared/Header";
import { authService } from "@/services/authService";
import type { UserResponse } from "@/types/auth";
import {Loader2, History, ChevronLeft} from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="animate-spin" size={40} />
        <p className="text-secondary">Cargando...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="history-page">
      <Header user={user} />
      <main className="history-content">
        <div className="container">
          <Link href="/dashboard" className="">
            <div className="back-link">
              <ChevronLeft size={20} />
              <span>Regresar</span>
            </div>
          </Link>
          <h1 className="text-h2">Historial de Consultas</h1>
          <div className="empty-state">
            <History size={48} className="empty-icon" />
            <h4>No hay consultas en el historial</h4>
            <p>Las consultas que realices aparecerán aquí.</p>
          </div>
        </div>
      </main>
      <style jsx>{`
        .history-page { min-height: 100vh; background-color: var(--bg-secondary); }
        .history-content { padding: 2rem 0; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
        .back-link { display: inline-flex; flex-direction: row; align-items: center; gap: 0.25rem; color: var(--text-secondary); text-decoration: none; font-size: var(--text-label); margin-bottom: 0.75rem; transition: color 0.15s ease; }
        .back-link:hover { color: var(--accent-primary); }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; background-color: var(--bg-secondary); border: 1px dashed var(--border-primary); border-radius: 0.75rem; text-align: center; margin-top: 2rem; color: var(--text-muted); }
        .empty-icon { margin-bottom: 1rem; }
      `}</style>
    </div>
  );
}
