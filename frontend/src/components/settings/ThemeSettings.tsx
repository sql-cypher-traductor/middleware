"use client";

import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

type ThemeOption = "light" | "dark" | "system";

const THEME_OPTIONS: { id: ThemeOption; label: string; icon: React.ElementType }[] = [
  { id: "light", label: "Claro", icon: Sun },
  { id: "dark", label: "Oscuro", icon: Moon },
  { id: "system", label: "Sistema", icon: Monitor },
];

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-settings">
      <h3 className="section-title">Tema del Sistema</h3>

      <div className="theme-options">
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = theme === option.id;
          return (
            <button
              key={option.id}
              className={`theme-option ${isActive ? "active" : ""}`}
              onClick={() => setTheme(option.id)}
              aria-pressed={isActive}
            >
              <div className="option-icon">
                <Icon size={24} />
              </div>
              <span className="option-label">{option.label}</span>
            </button>
          );
        })}
      </div>

      <style jsx>{`
          .theme-settings {
              max-width: 500px;
          }

          .section-title {
              font-size: var(--text-h3);
              font-weight: var(--font-semibold);
              color: var(--text-primary);
              margin: 0.5rem 0;
          }

          .theme-options {
              display: flex;
              gap: 2rem;
          }

          .theme-option {
              flex: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 0.75rem;
              margin: 0.5rem 0;
              padding: 1.5rem 1rem;
              background-color: var(--bg-tertiary);
              border: 2px solid var(--border-primary);
              border-radius: 0.75rem;
              cursor: pointer;
              transition: all 0.15s ease;
          }

          .theme-option:hover {
              border-color: var(--accent-primary);
          }

          .theme-option.active {
              border-color: var(--accent-primary);
              background-color: rgba(6, 182, 212, 0.1);
          }

          .option-icon {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 48px;
              height: 48px;
              border-radius: 50%;
              background-color: var(--bg-secondary);
              color: var(--text-secondary);
              transition: all 0.15s ease;
          }

          .theme-option.active .option-icon {
              background-color: var(--accent-primary);
              color: white;
          }

          .option-label {
              font-size: var(--text-label);
              font-weight: var(--font-medium);
              color: var(--text-primary);
          }
      `}</style>
    </div>
  );
}

export default ThemeSettings;
