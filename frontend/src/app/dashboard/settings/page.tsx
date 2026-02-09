"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/shared/Header";
import { authService } from "@/services/authService";
import type { UserResponse } from "@/types/auth";
import { Loader2, Settings, UserCircle, Lock, Database, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { PasswordSettings } from "@/components/settings/PasswordSettings";
import { ConnectionSettings } from "@/components/settings/ConnectionSettings";

type SettingsTab = "config" | "profile" | "password" | "connections";

const TABS = [
  { id: "config" as const, label: "Configuración", icon: Settings },
  { id: "profile" as const, label: "Perfil", icon: UserCircle },
  { id: "password" as const, label: "Cambiar Contraseña", icon: Lock },
  { id: "connections" as const, label: "Conexiones", icon: Database },
];

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SettingsTab>("config");

  useEffect(() => {
    const tab = searchParams.get("tab") as SettingsTab;
    if (tab && TABS.some((t) => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

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

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    router.push(`/dashboard/settings?tab=${tab}`, { scroll: false });
  };

  const handleUserUpdate = (updatedUser: UserResponse) => {
    setUser(updatedUser);
  };

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
    <div className="settings-page">
      <Header user={user} />
      <main className="settings-content">
        <div className="settings-container">
          <div className="settings-header">
            <Link href="/dashboard" className="">
              <div className="back-link">
                <ChevronLeft size={20} />
                <span>Regresar</span>
              </div>
            </Link>
            <h1 className="text-h2">Preferencias del Sistema</h1>
          </div>
          <div className="settings-layout">
            <aside className="settings-sidebar">
              <nav className="settings-nav">
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
            <section className="settings-panel">
              {activeTab === "config" && <ThemeSettings />}
              {activeTab === "profile" && <ProfileSettings user={user} onUpdate={handleUserUpdate} />}
              {activeTab === "password" && <PasswordSettings />}
              {activeTab === "connections" && <ConnectionSettings />}
            </section>
          </div>
        </div>
      </main>
      <style jsx>{`
        .settings-page { min-height: 100vh; background-color: var(--bg-secondary); }
        .settings-content { padding: 1rem 0; }
        .settings-container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
        .settings-header { margin: 1rem 0; }
        .back-link { display: inline-flex; flex-direction: row; align-items: center; gap: 0.25rem; color: var(--text-secondary); text-decoration: none; font-size: var(--text-label); margin-bottom: 0.75rem; transition: color 0.15s ease; }
        .back-link:hover { color: var(--accent-primary); }
        .settings-layout { display: grid; grid-template-columns: 240px 1fr; gap: 2rem; }
        .settings-sidebar { background-color: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 0.75rem; padding: 0.5rem; height: fit-content; position: sticky; top: 80px; }
        .settings-nav { display: flex; flex-direction: column; gap: 0.25rem; }
        .nav-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border: none; background: transparent; border-radius: 0.5rem; font-size: var(--text-label); font-weight: var(--font-medium); color: var(--text-secondary); cursor: pointer; transition: all 0.15s ease; text-align: left; width: 100%; }
        .nav-item:hover { background-color: var(--bg-tertiary); color: var(--text-primary); }
        .nav-item.active { background-color: var(--accent-primary); color: white; }
        .settings-panel { background-color: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 0.75rem; padding: 1.5rem; min-height: 400px; }
        @media (max-width: 768px) { .settings-layout { grid-template-columns: 1fr; } .settings-sidebar { position: static; } .settings-nav { flex-direction: row; overflow-x: auto; } .nav-item span { display: none; } }
      `}</style>
    </div>
  );
}
