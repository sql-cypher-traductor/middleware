"use client";

import { useTheme } from "@/hooks/useTheme";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle ${className}`}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
    >
      {/* Icono de Sol (Modo Claro) */}
      <svg
        className={`theme-icon ${isDark ? "hidden" : "block"}`}
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>

      {/* Icono de Luna (Modo Oscuro) */}
      <svg
        className={`theme-icon ${isDark ? "block" : "hidden"}`}
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>

      {showLabel && (
        <span className="theme-label">
          {isDark ? "Oscuro" : "Claro"}
        </span>
      )}

      <style jsx>{`
        .theme-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border-radius: 0.5rem;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .theme-toggle:hover {
          background-color: var(--bg-tertiary);
          border-color: var(--accent-primary);
        }

        .theme-toggle:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.15);
          border-color: var(--accent-primary);
        }

        .theme-icon {
          width: 20px;
          height: 20px;
        }

        .hidden {
          display: none;
        }

        .block {
          display: block;
        }

        .theme-label {
          font-size: var(--text-label);
          font-weight: var(--font-medium);
        }
      `}</style>
    </button>
  );
}

export default ThemeToggle;

