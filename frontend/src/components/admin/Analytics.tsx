"use client";

import React from "react";
import { BarChart3 } from "lucide-react";

export function Analytics() {
  return (
    <div className="analytics">
      <h3 className="section-title">Estadísticas de Uso</h3>
      <p className="section-description">
        Visualiza métricas y analíticas operativas del sistema.
      </p>

      <div className="empty-state">
        <BarChart3 size={48} className="empty-icon" />
        <h4 className="empty-title">Analíticas y estadísticas</h4>
        <p className="empty-description">
          Aquí podrás ver gráficas de eficiencia de consultas, usuarios registrados y otras métricas del sistema.
        </p>
        <span className="coming-soon">Próximamente disponible</span>
      </div>

      <style jsx>{`
        .analytics { }
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

export default Analytics;

