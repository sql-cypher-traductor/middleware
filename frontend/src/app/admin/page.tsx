"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/shared/Header";
import { authService } from "@/services/authService";
import type { UserResponse } from "@/types/auth";
import { Loader2, Shield, Users, Settings, Database } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    <div className="admin-page">
      <Header user={user} />
      <main className="admin-content">
        <div className="container">
          <div className="admin-header">
            <Shield size={32} className="admin-icon" />
            <div>
              <h1 className="text-h2">Administración del Sistema</h1>
              <p className="text-secondary">Gestiona usuarios, conexiones y configuración del sistema.</p>
            </div>
          </div>

          <div className="admin-grid">
            <Link href="/admin/users" className="admin-card">
              <Users size={32} />
              <h3>Gestión de Usuarios</h3>
              <p>Administrar usuarios, roles y permisos.</p>
            </Link>

            <div className="admin-card disabled">
              <Database size={32} />
              <h3>Conexiones</h3>
              <p>Administrar conexiones de bases de datos.</p>
              <span className="coming-soon">Próximamente</span>
            </div>

            <div className="admin-card disabled">
              <Settings size={32} />
              <h3>Configuración</h3>
              <p>Configuración general del sistema.</p>
              <span className="coming-soon">Próximamente</span>
            </div>
          </div>
        </div>
      </main>
      <style jsx>{`
        .admin-page { min-height: 100vh; background-color: var(--bg-primary); }
        .admin-content { padding: 2rem 0; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
        .admin-header { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 2rem; }
        .admin-icon { color: var(--purple-500); }
        .text-secondary { color: var(--text-secondary); margin-top: 0.25rem; }
        .admin-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
        .admin-card { display: flex; flex-direction: column; padding: 1.5rem; background-color: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 0.75rem; text-decoration: none; color: var(--text-primary); transition: all 0.15s ease; }
        .admin-card:hover:not(.disabled) { border-color: var(--accent-primary); transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .admin-card h3 { font-size: var(--text-body); font-weight: var(--font-semibold); margin: 1rem 0 0.5rem; }
        .admin-card p { font-size: var(--text-label); color: var(--text-secondary); }
        .admin-card.disabled { opacity: 0.6; cursor: not-allowed; }
        .coming-soon { font-size: var(--text-caption); color: var(--text-muted); font-style: italic; margin-top: auto; padding-top: 1rem; }
      `}</style>
    </div>
  );
}
