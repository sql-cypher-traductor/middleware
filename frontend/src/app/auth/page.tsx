"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/forms/AuthLayout";
import { LoginForm } from "@/components/forms/LoginForm";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { LoginFormData, RegisterFormData } from "@/lib/validations/auth";
import { authService, ApiError } from "@/services/authService";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleMode = () => {
    setMode((prev) => (prev === "login" ? "register" : "login"));
    setError(null); // Limpiar errores al cambiar de modo
  };

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login({
        email: data.email,
        password: data.password,
      });

      console.log("Login exitoso:", response.user);

      // Redirigir al dashboard
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError("Error al iniciar sesión. Intenta de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.register({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: data.password,
      });

      // Registro exitoso, cambiar a login
      setMode("login");
      setError(null);

      // Opcionalmente, auto-login después del registro
      // await handleLogin({ email: data.email, password: data.password });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError("Error al crear la cuenta. Intenta de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout mode={mode} onToggleMode={handleToggleMode}>
      {mode === "login" ? (
        <LoginForm
          onSubmit={handleLogin}
          isLoading={isLoading}
          error={error}
        />
      ) : (
        <RegisterForm
          onSubmit={handleRegister}
          isLoading={isLoading}
          error={error}
        />
      )}
    </AuthLayout>
  );
}

