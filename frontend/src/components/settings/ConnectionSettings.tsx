"use client";

import React from "react";
import { Database, Plus } from "lucide-react";

export function ConnectionSettings() {
  return (
    <div className="connection-settings">
      <h3 className="section-title">Conexiones de Base de Datos</h3>
      <p className="section-description">
        Administra tus conexiones a bases de datos SQL y Neo4j.
      </p>

      <div className="empty-state">
        <Database size={48} className="empty-icon" />
        <h4 className="empty-title">No hay conexiones configuradas</h4>
        <p className="empty-description">
          Añade una conexión para comenzar a traducir consultas.
        </p>
        <button className="btn btn-primary" disabled>
          <Plus size={16} />
          <span>Añadir Conexión</span>
        </button>
        <p className="coming-soon">Próximamente disponible</p>
      </div>

      <style jsx>{`
        .connection-settings { max-width: 600px; }
        .section-title { font-size: var(--text-h3); font-weight: var(--font-semibold); color: var(--text-primary); margin-bottom: 0.5rem; }
        .section-description { font-size: var(--text-body); color: var(--text-secondary); margin-bottom: 1.5rem; }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 2rem; background-color: var(--bg-tertiary); border: 1px dashed var(--border-primary); border-radius: 0.75rem; text-align: center; }
        .empty-icon { color: var(--text-muted); margin-bottom: 1rem; }
        .empty-title { font-size: var(--text-body); font-weight: var(--font-semibold); color: var(--text-primary); margin-bottom: 0.5rem; }
        .empty-description { font-size: var(--text-label); color: var(--text-secondary); margin-bottom: 1.5rem; }
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-size: var(--text-label); font-weight: var(--font-medium); cursor: pointer; transition: all 0.15s ease; border: none; }
        .btn-primary { background-color: var(--accent-primary); color: white; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .coming-soon { font-size: var(--text-caption); color: var(--text-muted); margin-top: 0.75rem; font-style: italic; }
      `}</style>
    </div>
  );
}

export default ConnectionSettings;
