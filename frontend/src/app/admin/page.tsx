"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/shared/Header";
import { authService } from "@/services/authService";
import type { UserResponse } from "@/types/auth";
import { Loader2, Users, FileText, BarChart3, ChevronLeft } from "lucide-react";
import Link from "next/link";

// Componentes de cada sección
import { UserManagement } from "@/components/admin/UserManagement";
import { SystemLogs } from "@/components/admin/SystemLogs";
import { Analytics } from "@/components/admin/Analytics";

type AdminTab = "users" | "logs" | "analytics";

const TABS = [
  { id: "users" as const, label: "Gestión de Usuarios", icon: Users },
  { id: "logs" as const, label: "Logs del Sistema", icon: FileText },
  { id: "analytics" as const, label: "Estadísticas de Uso", icon: BarChart3 },
];

function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("users");

  useEffect(() => {
    const tab = searchParams.get("tab") as AdminTab;
    if (tab && TABS.some((t) => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser.role !== "Administrador") {
          router.push("/dashboard");
          return;
        }
        setUser(currentUser);
      } catch {
        router.push("/auth");
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [router]);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    router.push(`/admin?tab=${tab}`, { scroll: false });
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <Loader2 className="spinner" size={40} />
        <p>Cargando...</p>
        <style jsx>{`
          .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; gap: 1rem; color: var(--text-secondary); }
          .spinner { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="admin-page">
      <Header user={user} />
      <main className="admin-content">
        <div className="admin-container">
          <div className="admin-header">
            <Link href="/dashboard">
              <div className="back-link">
                <ChevronLeft size={20} />
                <span>Regresar</span>
              </div>
            </Link>
            <h1 className="text-h2">Administración del Sistema</h1>
          </div>

          <div className="admin-layout">
            <aside className="admin-sidebar">
              <nav className="admin-nav">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      className={`nav-item ${activeTab === tab.id ? "active" : ""}`}
                      onClick={() => handleTabChange(tab.id)}
                    >
                      <Icon size={18} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <section className="admin-panel">
              {activeTab === "users" && <UserManagement />}
              {activeTab === "logs" && <SystemLogs />}
              {activeTab === "analytics" && <Analytics />}
            </section>
          </div>
        </div>
      </main>

      <style jsx>{`
        .admin-page { min-height: 100vh; background-color: var(--bg-secondary); }
        .admin-content { padding: 2rem 0; }
        .admin-container { max-width: 1400px; margin: 0 auto; padding: 0 1.5rem; }
        .admin-header { margin-bottom: 2rem; }
        .back-link { display: inline-flex; align-items: center; gap: 0.25rem; color: var(--text-secondary); text-decoration: none; font-size: var(--text-label); margin-bottom: 0.75rem; transition: color 0.15s ease; }
        .back-link:hover { color: var(--accent-primary); }
        .admin-layout { display: grid; grid-template-columns: 260px 1fr; gap: 2rem; }
        .admin-sidebar { background-color: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 0.75rem; padding: 0.5rem; height: fit-content; position: sticky; top: 80px; }
        .admin-nav { display: flex; flex-direction: column; gap: 0.25rem; }
        .nav-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border: none; background: transparent; border-radius: 0.5rem; font-size: var(--text-label); font-weight: var(--font-medium); color: var(--text-secondary); cursor: pointer; transition: all 0.15s ease; text-align: left; width: 100%; }
        .nav-item:hover { background-color: var(--bg-tertiary); color: var(--text-primary); }
        .nav-item.active { background-color: var(--purple-500); color: white; }
        .admin-panel { background-color: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 0.75rem; padding: 1.5rem; min-height: 500px; }
        @media (max-width: 900px) { .admin-layout { grid-template-columns: 1fr; } .admin-sidebar { position: static; } .admin-nav { flex-direction: row; overflow-x: auto; } .nav-item span { display: none; } }
      `}</style>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="loading-container">
        <Loader2 className="spinner" size={40} />
        <style jsx>{`
          .loading-container { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .spinner { animation: spin 1s linear infinite; color: var(--accent-primary); }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    }>
      <AdminContent />
    </Suspense>
  );
}

