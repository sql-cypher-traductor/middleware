"use client";

import React, { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { passwordService } from "@/services/passwordService";
import { ApiError } from "@/services/api";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { getPasswordStrength } from "@/lib/validations/auth";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const resetPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(1, "La nueva contraseña es requerida")
      .regex(
        passwordRegex,
        "Debe tener mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial"
      ),
    confirm_password: z.string().min(1, "Confirma la nueva contraseña"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Las contraseñas no coinciden",
    path: ["confirm_password"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { resolvedTheme } = useTheme();

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordValue, setPasswordValue] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "",
    color: "",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { new_password: "", confirm_password: "" },
  });

  const newPasswordRegister = register("new_password");

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPasswordValue(value);
    if (value) {
      setPasswordStrength(getPasswordStrength(value));
    } else {
      setPasswordStrength({ score: 0, label: "", color: "" });
    }
  };

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError("Token de recuperación no válido");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await passwordService.resetPassword({
        token,
        new_password: data.new_password,
      });
      setIsSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError("Error al restablecer la contraseña. Intenta de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Si no hay token, mostrar error
  if (!token) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="logo-container">
            <Image
              src={resolvedTheme === "dark" ? "/logo2.png" : "/logo1.png"}
              alt="SQL2Graph Logo"
              width={100}
              height={100}
              priority
            />
          </div>
          <div className="error-state">
            <div className="error-icon">
              <XCircle size={48} />
            </div>
            <h1 className="title">Enlace inválido</h1>
            <p className="description">
              El enlace de recuperación no es válido o ha expirado. Por favor,
              solicita uno nuevo.
            </p>
            <Link href="/auth/forgot-password" className="btn btn-primary">
              Solicitar nuevo enlace
            </Link>
          </div>
        </div>
        <style jsx>{`
          .reset-password-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%); padding: 2rem; }
          .reset-password-container { width: 100%; max-width: 420px; background-color: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: 1rem; padding: 2.5rem; text-align: center; }
          .logo-container { display: flex; justify-content: center; margin-bottom: 1rem; }
          .title { font-size: var(--text-h2); font-weight: var(--font-semibold); color: var(--text-primary); margin-bottom: 0.75rem; }
          .description { font-size: var(--text-body); color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.5; }
          .error-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
          .error-icon { color: var(--error); margin-bottom: 0.5rem; }
          .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.875rem 1.5rem; border-radius: 0.5rem; font-size: var(--text-label); font-weight: var(--font-medium); cursor: pointer; transition: all 0.15s ease; border: none; text-decoration: none; }
          .btn-primary { background-color: var(--accent-primary); color: white; }
          .btn-primary:hover { background-color: var(--cyan-600); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="logo-container">
          <Image
            src={resolvedTheme === "dark" ? "/logo1.png" : "/logo2.png"}
            alt="SQL2Graph Logo"
            width={100}
            height={100}
            priority
          />
        </div>

        {isSuccess ? (
          <div className="success-state">
            <div className="success-icon">
              <CheckCircle size={48} />
            </div>
            <h1 className="title">¡Contraseña actualizada!</h1>
            <p className="description">
              Tu contraseña ha sido restablecida correctamente. Dirígete al inicio de sesión
            </p>
            <Link href="/auth">
              <span className="btn btn-primary">Iniciar sesión</span>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="title">Restablecer Contraseña</h1>
            <p className="description">
              Ingresa tu nueva contraseña. Asegúrate de que sea segura.
            </p>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit(onSubmit)} className="form">
              {/* Campo Nueva Contraseña */}
              <div className="form-group">
                <label htmlFor="new_password">Nueva contraseña</label>
                <PasswordInput
                  id="new_password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...newPasswordRegister}
                  onChange={(e) => {
                    newPasswordRegister.onChange(e);
                    handlePasswordChange(e);
                  }}
                  error={!!errors.new_password}
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
                    <span className="strength-label" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
                {errors.new_password && (
                  <span className="error-message">{errors.new_password.message}</span>
                )}
              </div>

              {/* Campo Confirmar Contraseña */}
              <div className="form-group">
                <label htmlFor="confirm_password">Confirmar contraseña</label>
                <PasswordInput
                  id="confirm_password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register("confirm_password")}
                  error={!!errors.confirm_password}
                />
                {errors.confirm_password && (
                  <span className="error-message">{errors.confirm_password.message}</span>
                )}
              </div>

              {/* Requisitos de contraseña */}
              <div className="password-requirements">
                <p className="requirements-title">La contraseña debe tener:</p>
                <ul className="requirements-list">
                  <li className={passwordValue.length >= 8 ? "valid" : ""}>
                    Mínimo 8 caracteres
                  </li>
                  <li className={/[A-Z]/.test(passwordValue) ? "valid" : ""}>
                    Una letra mayúscula
                  </li>
                  <li className={/[a-z]/.test(passwordValue) ? "valid" : ""}>
                    Una letra minúscula
                  </li>
                  <li className={/\d/.test(passwordValue) ? "valid" : ""}>
                    Un número
                  </li>
                  <li className={/[@$!%*?&]/.test(passwordValue) ? "valid" : ""}>
                    Un carácter especial (@$!%*?&)
                  </li>
                </ul>
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="spinner" />
                    Restableciendo...
                  </>
                ) : (
                  "Restablecer contraseña"
                )}
              </button>
            </form>
          </>
        )}
      </div>

      <style jsx>{`
        .reset-password-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
          padding: 2rem;
        }

        .reset-password-container {
          width: 100%;
          max-width: 420px;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 1rem;
          padding: 2.5rem;
          text-align: center;
        }

        .logo-container {
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .title {
          font-size: var(--text-h2);
          font-weight: var(--font-semibold);
          color: var(--text-primary);
          margin-bottom: 0.75rem;
        }

        .description {
          font-size: var(--text-body);
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          text-align: left;
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

        .error-message {
          font-size: var(--text-caption);
          color: var(--error);
        }

        .password-strength {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .strength-bar {
          flex: 1;
          height: 6px;
          background-color: var(--border-primary);
          border-radius: 3px;
          overflow: hidden;
        }

        .strength-fill {
          height: 100%;
          transition: all 0.3s ease;
          border-radius: 3px;
        }

        .strength-label {
          font-size: var(--text-caption);
          font-weight: var(--font-semibold);
          min-width: 50px;
        }

        .password-requirements {
          background-color: var(--bg-tertiary);
          border: 1px solid var(--border-primary);
          border-radius: 0.5rem;
          padding: 1rem;
        }

        .requirements-title {
          font-size: var(--text-caption);
          font-weight: var(--font-medium);
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }

        .requirements-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .requirements-list li {
          font-size: var(--text-caption);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .requirements-list li::before {
          content: "○";
          font-size: 10px;
        }

        .requirements-list li.valid {
          color: var(--success);
        }

        .requirements-list li.valid::before {
          content: "●";
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border-radius: 0.5rem;
          font-size: var(--text-label);
          font-weight: var(--font-medium);
          cursor: pointer;
          transition: all 0.15s ease;
          border: none;
          text-decoration: none;
        }

        .btn-primary {
          background-color: var(--accent-primary);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: var(--cyan-600);
        }

        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-full {
          width: 100%;
        }

        .spinner {
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

        .success-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .success-icon {
          color: var(--success);
          margin-bottom: 0.5rem;
        }

        .alert-error {
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid var(--error);
          color: var(--error);
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          font-size: var(--text-label);
          margin-bottom: 0.5rem;
          text-align: left;
        }
      `}</style>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="loading-page">
          <Loader2 className="spinner" size={40} />
          <style jsx>{`
            .loading-page {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: var(--bg-primary);
            }
            .spinner {
              animation: spin 1s linear infinite;
              color: var(--accent-primary);
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
