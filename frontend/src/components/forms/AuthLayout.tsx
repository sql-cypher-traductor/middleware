"use client";

import React, { useSyncExternalStore } from "react";
import Image from "next/image";
import { useTheme } from "@/hooks/useTheme";

// Hook para detectar si estamos en el cliente (evita error de hidratación)
function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,  // En cliente, siempre true
    () => false  // En servidor, siempre false
  );
}

interface AuthLayoutProps {
  children: React.ReactNode;
  mode: "login" | "register";
  onToggleMode: () => void;
}

export function AuthLayout({ children, mode, onToggleMode }: AuthLayoutProps) {
  const { resolvedTheme } = useTheme();
  const isMounted = useIsMounted();

  const isLogin = mode === "login";

  // Usar un valor por defecto durante SSR, luego el valor real del tema
  const logoSrc = isMounted
    ? resolvedTheme === "dark"
      ? "/logo1.png"
      : "/logo2.png"
    : "/logo2.png"; // Valor por defecto durante SSR

  return (
    <div className="auth-container">
      {/* Panel Izquierdo - Información */}
      <div className="auth-left-panel">
        <div className="auth-left-content">
          {/* Mensaje de bienvenida */}
          <div className="auth-welcome">
            <h1 className="auth-welcome-title">
              {isLogin ? "¡BIENVENIDO DE VUELTA!" : "¡EMPIEZA YA!"}
            </h1>
            <p className="auth-welcome-subtitle">
              {isLogin
                ? "Nos alegra verte de nuevo. Inicia sesión para continuar."
                : "Comienza a transformar tus bases de datos SQL a Neo4j."}
            </p>
          </div>

          {/* Logo */}
          <div className="auth-logo">
            <Image
              src={logoSrc}
              alt="SQL2Graph Logo"
              width={300}
              height={300}
              priority
            />
          </div>

          {/* Pregunta y botón de cambio */}
          <div className="auth-switch">
            <p className="auth-switch-text">
              {isLogin ? "¿No tienes una cuenta?" : "¿Ya tienes una cuenta?"}
            </p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onToggleMode}
            >
              {isLogin ? "Crear cuenta" : "Iniciar sesión"}
            </button>
          </div>
        </div>
      </div>

      {/* Panel Derecho - Formulario */}
      <div className="auth-right-panel">
        <div className="auth-form-container">
          <h2 className="auth-form-title">
            {isLogin ? "INICIAR SESIÓN" : "REGISTRARSE"}
          </h2>
          {children}
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          display: flex;
          min-height: 100vh;
          width: 100%;
        }

        /* Panel Izquierdo */
        .auth-left-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
          padding: 2rem;
        }

        .auth-left-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          height: 100%;
          max-height: 600px;
          text-align: center;
          color: var(--white);
        }

        .auth-welcome {
          margin: 1rem;
        }

        .auth-welcome-title {
          font-size: var(--text-h1);
          font-weight: var(--font-bold);
          letter-spacing: var(--tracking-tight);
          margin-bottom: 1rem;
          color: var(--text-primary);
        }

        .auth-welcome-subtitle {
          font-size: var(--text-h3);
          opacity: 0.9;
          //max-width: 300px;
          line-height: var(--leading-relaxed);
        }

        .auth-logo {
          margin: 1rem;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .auth-switch {
          margin: 1rem;
        }

        .auth-switch-text {
          font-size: var(--text-body);
          margin: 0.5rem;
          opacity: 0.9;
        }

        .auth-switch-btn {
          background-color: transparent;
          border: 2px solid var(--white);
          margin: 0.5rem;
          color: var(--white);
          min-width: 160px;
        }

        .auth-switch-btn:hover {
          background-color: rgba(255, 255, 255, 0.1);
          border-color: var(--white);
        }

        /* Panel Derecho */
        .auth-right-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg-secondary);
          padding: 2rem;
        }

        .auth-form-container {
          width: 100%;
          max-width: 400px;
        }

        .auth-form-title {
          font-size: var(--text-h1);
          font-weight: var(--font-semibold);
          color: var(--text-primary);
          margin: 1.5rem;
          text-align: center;
        }

        /* Responsive para pantallas más pequeñas */
        @media (max-width: 1024px) {
          .auth-container {
            flex-direction: column;
          }

          .auth-left-panel {
            padding: 2rem 1.5rem;
            min-height: auto;
          }

          .auth-left-content {
            max-height: none;
            gap: 1.5rem;
          }

          .auth-welcome-title {
            font-size: 28px;
          }

          .auth-logo {
            margin: 1rem 0;
          }

          .auth-right-panel {
            padding: 2rem 1.5rem;
          }
        }

        @media (max-width: 768px) {
          .auth-left-panel {
            padding: 1.5rem 1rem;
          }

          .auth-welcome-title {
            font-size: 24px;
          }

          .auth-welcome-subtitle {
            font-size: 14px;
          }

          .auth-right-panel {
            padding: 1.5rem 1rem;
          }

          .auth-form-container {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default AuthLayout;

