"use client";

import React, { useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

/**
 * Componente de input de contraseña reutilizable con toggle show/hide.
 * Usa forwardRef para compatibilidad con react-hook-form.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ error, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    return (
      <div className="password-input-wrapper">
        <input
          ref={ref}
          type={showPassword ? "text" : "password"}
          className={`password-input ${error ? "input-error" : ""} ${className || ""}`}
          {...props}
        />
        <button
          type="button"
          className="toggle-password-btn"
          onClick={togglePasswordVisibility}
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          tabIndex={-1}
        >
          {showPassword ? (
            <Eye size={18} strokeWidth={2} />
          ) : (
            <EyeOff size={18} strokeWidth={2} />
          )}
        </button>

        <style jsx>{`
          .password-input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
          }

          .password-input {
            width: 100%;
            padding: 0.75rem 2.75rem 0.75rem 1rem;
            border: 1px solid var(--border-primary);
            border-radius: 0.5rem;
            background-color: var(--bg-secondary);
            color: var(--text-primary);
            font-size: var(--text-body);
            transition: all 0.15s ease;
          }

          .password-input:focus {
            outline: none;
            border-color: var(--accent-primary);
            box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.15);
          }

          .password-input.input-error {
            border-color: var(--error);
          }

          .password-input.input-error:focus {
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
          }

          .toggle-password-btn {
            position: absolute;
            right: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
            cursor: pointer;
            color: var(--text-tertiary);
            padding: 0.25rem;
            border-radius: 0.25rem;
            transition: color 0.15s ease;
          }

          .toggle-password-btn:hover {
            color: var(--text-secondary);
          }

          .toggle-password-btn:focus {
            outline: none;
          }
        `}</style>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;

