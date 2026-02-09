"use client";

import React from "react";
import { FileText } from "lucide-react";

export function SystemLogs() {
  return (
    <div className="system-logs">
      <h3 className="section-title">Logs del Sistema</h3>
      <p className="section-description">
        Visualiza el registro de actividades y acciones realizadas en el sistema.
      </p>

      <div className="empty-state">
        <FileText size={48} className="empty-icon" />
        <h4 className="empty-title">Logs del sistema</h4>
        <p className="empty-description">
          Aquí podrás ver un historial de todas las acciones realizadas por los usuarios.
        </p>
        <span className="coming-soon">Próximamente disponible</span>
      </div>

      <style jsx>{`
        .system-logs { }
        .section-title { font-size: var(--text-h3); font-weight: var(--font-semibold); color: var(--text-primary); margin-bottom: 0.25rem; }
        .section-description { font-size: var(--text-label); color: var(--text-secondary); margin-bottom: 1.5rem; }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          background-color: var(--bg-tertiary);
          border: 1px dashed var(--border-primary);
          border-radius: 0.75rem;
          text-align: center;
        }
        .empty-icon { color: var(--text-muted); margin-bottom: 1rem; }
        .empty-title { font-size: var(--text-body); font-weight: var(--font-semibold); color: var(--text-primary); margin-bottom: 0.5rem; }
        .empty-description { font-size: var(--text-label); color: var(--text-secondary); margin-bottom: 1rem; max-width: 300px; }
        .coming-soon { font-size: var(--text-caption); color: var(--text-muted); font-style: italic; padding: 0.5rem 1rem; background-color: var(--bg-secondary); border-radius: 9999px; }
      `}</style>
    </div>
  );
}

export default SystemLogs;

