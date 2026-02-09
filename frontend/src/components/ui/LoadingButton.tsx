"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

/**
 * Componente de botón con estado de carga y spinner de Lucide React.
 */
export function LoadingButton({
  isLoading = false,
  loadingText,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      disabled={isLoading || disabled}
      className={`loading-button ${isLoading ? "is-loading" : ""} ${className || ""}`}
      {...props}
    >
      {isLoading && (
        <Loader2 size={18} className="spinner" strokeWidth={2.5} />
      )}
      <span className="button-text">
        {isLoading ? (loadingText || children) : children}
      </span>

      <style jsx>{`
        .loading-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          position: relative;
          transition: all 0.15s ease;
        }

        .loading-button:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .loading-button.is-loading {
          pointer-events: none;
        }

        .button-text {
          display: inline-flex;
          align-items: center;
        }

        .loading-button :global(.spinner) {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </button>
  );
}

export default LoadingButton;

