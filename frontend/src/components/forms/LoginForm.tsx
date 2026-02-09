"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormData } from "@/lib/validations/auth";
import { PasswordInput, LoadingButton } from "@/components/ui";

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function LoginForm({ onSubmit, isLoading = false, error }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
      {/* Error general de la API */}
      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {/* Campo Email */}
      <div className="form-group">
        <label htmlFor="email">Correo electrónico</label>
        <input
          id="email"
          type="email"
          placeholder="tu@email.com"
          autoComplete="email"
          {...register("email")}
          className={errors.email ? "input-error" : ""}
        />
        {errors.email && (
          <span className="error-message">{errors.email.message}</span>
        )}
      </div>

      {/* Campo Password */}
      <div className="form-group">
        <label htmlFor="password">Contraseña</label>
        <PasswordInput
          id="password"
          placeholder="••••••••"
          autoComplete="current-password"
          {...register("password")}
          error={!!errors.password}
        />
        {errors.password && (
          <span className="error-message">{errors.password.message}</span>
        )}
      </div>

      {/* Botón Submit */}
      <LoadingButton
        type="submit"
        className="btn btn-primary btn-submit"
        isLoading={isLoading}
        loadingText="Iniciando sesión..."
      >
        Iniciar Sesión
      </LoadingButton>

      {/* Enlace Olvidaste contraseña */}
      <div className="forgot-password">
        <a href="/forgot-password">¿Olvidaste tu contraseña?</a>
      </div>

      <style jsx>{`
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .form-group label {
          font-size: var(--text-label);
          font-weight: var(--font-medium);
          color: var(--text-secondary);
        }

        .form-group input {
          padding: 0.75rem 1rem;
          border: 1px solid var(--border-primary);
          border-radius: 0.5rem;
          background-color: var(--bg-secondary);
          color: var(--text-primary);
          font-size: var(--text-body);
          transition: all 0.15s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.15);
        }

        .form-group input.input-error {
          border-color: var(--error);
        }

        .form-group input.input-error:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
        }

        .error-message {
          font-size: var(--text-caption);
          color: var(--error);
          margin-top: 0.25rem;
        }

        .btn-submit {
          width: 100%;
          padding: 0.875rem;
          font-size: var(--text-body);
          margin-top: 0.5rem;
        }

        .forgot-password {
          text-align: center;
          margin-top: 0.5rem;
        }

        .forgot-password a {
          font-size: var(--text-label);
          color: var(--accent-primary);
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .forgot-password a:hover {
          color: var(--accent-secondary);
          text-decoration: underline;
        }
      `}</style>
    </form>
  );
}

export default LoginForm;

