"use client";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-(--bg-primary) p-8">
      <div className="container">
        {/* Header con Toggle de Tema */}
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-h1">SQ2Graph System</h1>
          <div className="flex items-center gap-4">
            <Link href="/auth" className="btn btn-primary">
              Iniciar Sesión
            </Link>
            <ThemeToggle showLabel />
          </div>
        </header>

        {/* Sección de Tipografía */}
        <section className="card mb-8">
          <h2 className="text-h2 mb-6">Tipografía</h2>
          <div className="flex flex-col gap-4">
            <div>
              <span className="text-label">H1 - Inter Bold 32px (tracking: -0.02em)</span>
              <h1 className="text-h1">Título Principal</h1>
            </div>
            <div>
              <span className="text-label">H2 - Inter Semi Bold 24px</span>
              <h2 className="text-h2">Subtítulo</h2>
            </div>
            <div>
              <span className="text-label">H3 - Inter Medium 20px</span>
              <h3 className="text-h3">Encabezado de Sección</h3>
            </div>
            <div>
              <span className="text-label">Body - Inter Regular 16px</span>
              <p className="text-body">Este es el texto de cuerpo regular para contenido general.</p>
            </div>
            <div>
              <span className="text-label">Label - Inter Medium 14px</span>
              <span className="text-label block">Etiqueta de formulario o botón</span>
            </div>
            <div>
              <span className="text-label">Code - JetBrains Mono 14px</span>
              <code className="text-code block mt-2">SELECT * FROM users WHERE id = 1;</code>
            </div>
          </div>
        </section>

        {/* Sección de Colores */}
        <section className="card mb-8">
          <h2 className="text-h2 mb-6">Paleta de Colores</h2>

          {/* Colores de Estructura */}
          <h3 className="text-h3 mb-4">Estructura (Superficies y Bordes)</h3>
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-lg bg-(--slate-50) border border-(--border-primary)"></div>
              <span className="text-caption mt-2">Slate-50</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-lg bg-(--slate-200)"></div>
              <span className="text-caption mt-2">Slate-200</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-lg bg-(--slate-800)"></div>
              <span className="text-caption mt-2">Slate-800</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-lg bg-(--slate-950)"></div>
              <span className="text-caption mt-2">Slate-950</span>
            </div>
          </div>

          {/* Colores de Acción */}
          <h3 className="text-h3 mb-4">Acción y Estado</h3>
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-lg bg-(--cyan-500)"></div>
              <span className="text-caption mt-2">Primary (Cyan)</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-lg bg-(--green-500)"></div>
              <span className="text-caption mt-2">Éxito (Green)</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-lg bg-(--red-500)"></div>
              <span className="text-caption mt-2">Error (Red)</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-lg bg-(--amber-500)"></div>
              <span className="text-caption mt-2">Warning (Amber)</span>
            </div>
          </div>

          {/* Colores para Grafos */}
          <h3 className="text-h3 mb-4">Paleta Categórica para Grafos</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full graph-node-a"></div>
              <span className="text-caption mt-2">Nodo A (Cyan)</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full graph-node-b"></div>
              <span className="text-caption mt-2">Nodo B (Purple)</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full graph-node-c"></div>
              <span className="text-caption mt-2">Nodo C (Pink)</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full graph-node-d"></div>
              <span className="text-caption mt-2">Nodo D (Indigo)</span>
            </div>
          </div>
        </section>

        {/* Sección de Componentes */}
        <section className="card mb-8">
          <h2 className="text-h2 mb-6">Componentes</h2>

          {/* Botones */}
          <h3 className="text-h3 mb-4">Botones</h3>
          <div className="flex gap-4 flex-wrap mb-8">
            <button className="btn btn-primary">Primary</button>
            <button className="btn btn-secondary">Secondary</button>
            <button className="btn btn-success">Success</button>
            <button className="btn btn-danger">Danger</button>
            <button className="btn btn-warning">Warning</button>
            <button className="btn btn-primary" disabled>Disabled</button>
          </div>

          {/* Badges */}
          <h3 className="text-h3 mb-4">Badges</h3>
          <div className="flex gap-4 flex-wrap mb-8">
            <span className="badge badge-primary">Primary</span>
            <span className="badge badge-success">Success</span>
            <span className="badge badge-error">Error</span>
            <span className="badge badge-warning">Warning</span>
          </div>

          {/* Alertas */}
          <h3 className="text-h3 mb-4">Alertas</h3>
          <div className="flex flex-col gap-4 mb-8">
            <div className="alert alert-success">✓ Operación completada exitosamente</div>
            <div className="alert alert-error">✕ Error al procesar la solicitud</div>
            <div className="alert alert-warning">⚠ Advertencia: Revise los datos</div>
            <div className="alert alert-info">ℹ Información adicional disponible</div>
          </div>

          {/* Inputs */}
          <h3 className="text-h3 mb-4">Formularios</h3>
          <div className="flex flex-col gap-4 max-w-md">
            <div>
              <label>Nombre de tabla</label>
              <input type="text" placeholder="Ej: usuarios" />
            </div>
            <div>
              <label>Consulta SQL</label>
              <textarea className="code" placeholder="SELECT * FROM ..." rows={4}></textarea>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-caption mt-12">
          <p>SQ2Graph System - Paleta de Colores y Tipografía v1.0</p>
        </footer>
      </div>
    </main>
  );
}
