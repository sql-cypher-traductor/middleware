"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { passwordService } from "@/services/passwordService";
import { ApiError } from "@/services/api";

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "El correo electrónico es requerido")
    .regex(emailRegex, "Ingresa un correo electrónico válido"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { resolvedTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await passwordService.forgotPassword({ email: data.email });
      setIsSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError("Error al enviar el correo. Intenta de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        {/* Logo */}
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
          /* Vista de éxito */
          <div className="success-state">
            <div className="success-icon">
              <CheckCircle size={48} />
            </div>
            <h1 className="title">¡Correo enviado!</h1>
            <p className="description">
              Si el correo existe en nuestro sistema, recibirás un enlace para
              restablecer tu contraseña. Revisa tu bandeja de entrada y spam.
            </p>
            <Link href="/auth" className="">
              <span className="btn btn-primary">Volver al inicio de sesión</span>
            </Link>
          </div>
        ) : (
          /* Formulario */
          <>
            <h1 className="title">¿Olvidaste tu contraseña?</h1>
            <p className="description">
              Ingresa tu correo electrónico y te enviaremos un enlace para
              restablecer tu contraseña.
            </p>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit(onSubmit)} className="form">
              <div className="form-group">
                <label htmlFor="email">Correo electrónico</label>
                <div className="input-with-icon">
                  <input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    autoComplete="email"
                    {...register("email")}
                    className={errors.email ? "input-error" : ""}
                  />
                </div>
                {errors.email && (
                  <span className="error-message">{errors.email.message}</span>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="spinner" />
                    Enviando...
                  </>
                ) : (
                  "Enviar enlace de recuperación"
                )}
              </button>
            </form>

            <Link href="/auth" className="">
              <div className="back-link">
                <ArrowLeft size={16} />
                <span>Volver al inicio de sesión</span>
              </div>
            </Link>
          </>
        )}
      </div>

      <style jsx>{`
        .forgot-password-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
          padding: 2rem;
        }

        .forgot-password-container {
          width: 100%;
          max-width: 420px;
          background-color: var(--bg-primary);
          border: 1px solid var(--border-primary);
          border-radius: 1rem;
          padding: 2.5rem;
          text-align: center;
        }

        .logo-container {
          display: flex;
          justify-content: center;
          margin: 1rem;
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

        .input-with-icon {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .input-with-icon input {
          width: 100%;
          padding: 0.5rem 1rem;
          border: 1px solid var(--border-primary);
          border-radius: 0.5rem;
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
          font-size: var(--text-body);
          transition: all 0.15s ease;
        }

        .input-with-icon input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.15);
        }

        .input-with-icon input.input-error {
          border-color: var(--error);
        }

        .error-message {
          font-size: var(--text-caption);
          color: var(--error);
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.875rem 1.5rem;
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
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1.5rem;
          color: var(--text-secondary);
          font-size: var(--text-label);
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .back-link:hover {
          color: var(--accent-primary);
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
        }
      `}</style>
    </div>
  );
}
