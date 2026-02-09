"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerSchema,
  RegisterFormData,
  getPasswordStrength,
} from "@/lib/validations/auth";
import { PasswordInput, LoadingButton } from "@/components/ui";

interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function RegisterForm({ onSubmit, isLoading = false, error }: RegisterFormProps) {
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "",
    color: "",
  });
  const [passwordValue, setPasswordValue] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Manejar cambio de contraseña para calcular fortaleza
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPasswordValue(value);
    if (value) {
      setPasswordStrength(getPasswordStrength(value));
    } else {
      setPasswordStrength({ score: 0, label: "", color: "" });
    }
  };

  // Obtener el registro de password y agregar el onChange personalizado
  const passwordRegister = register("password");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
      {/* Error general */}
      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {/* Campo Nombre */}
      <div className="form-group">
        <label htmlFor="first_name">Nombre</label>
        <input
          id="first_name"
          type="text"
          placeholder="Tu nombre"
          autoComplete="given-name"
          {...register("first_name")}
          className={errors.first_name ? "input-error" : ""}
        />
        {errors.first_name && (
          <span className="error-message">{errors.first_name.message}</span>
        )}
      </div>

      {/* Campo Apellido */}
      <div className="form-group">
        <label htmlFor="last_name">Apellido</label>
        <input
          id="last_name"
          type="text"
          placeholder="Tu apellido"
          autoComplete="family-name"
          {...register("last_name")}
          className={errors.last_name ? "input-error" : ""}
        />
        {errors.last_name && (
          <span className="error-message">{errors.last_name.message}</span>
        )}
      </div>

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
          autoComplete="new-password"
          {...passwordRegister}
          onChange={(e) => {
            passwordRegister.onChange(e);
            handlePasswordChange(e);
          }}
          error={!!errors.password}
        />
        {/* Indicador de fortaleza */}
        {passwordValue && (
          <div className="password-strength">
            <div className="strength-bar">
              <div
                className="strength-fill"
                style={{
                  width: `${(passwordStrength.score / 6) * 100}%`,
                  backgroundColor: passwordStrength.color,
                }}
              />
            </div>
            <span
              className="strength-label"
              style={{ color: passwordStrength.color }}
            >
              {passwordStrength.label}
            </span>
          </div>
        )}
        {errors.password && (
          <span className="error-message">{errors.password.message}</span>
        )}
      </div>

      {/* Campo Confirmar Password */}
      <div className="form-group">
        <label htmlFor="confirmPassword">Confirmar contraseña</label>
        <PasswordInput
          id="confirmPassword"
          placeholder="••••••••"
          autoComplete="new-password"
          {...register("confirmPassword")}
          error={!!errors.confirmPassword}
        />
        {errors.confirmPassword && (
          <span className="error-message">{errors.confirmPassword.message}</span>
        )}
      </div>

      {/* Botón Submit */}
      <LoadingButton
        type="submit"
        className="btn btn-primary btn-submit"
        isLoading={isLoading}
        loadingText="Creando cuenta..."
      >
        Crear Cuenta
      </LoadingButton>

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

        .password-strength {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .strength-bar {
          flex: 1;
          height: 4px;
          background-color: var(--border-primary);
          border-radius: 2px;
          overflow: hidden;
        }

        .strength-fill {
          height: 100%;
          transition: all 0.3s ease;
          border-radius: 2px;
        }

        .strength-label {
          font-size: var(--text-caption);
          font-weight: var(--font-medium);
          min-width: 50px;
        }

        .btn-submit {
          width: 100%;
          padding: 0.875rem;
          font-size: var(--text-body);
          margin-top: 0.5rem;
        }
      `}</style>
    </form>
  );
}

export default RegisterForm;

