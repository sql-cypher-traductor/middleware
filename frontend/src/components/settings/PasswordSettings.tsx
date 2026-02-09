"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { userService } from "@/services/userService";
import { ApiError } from "@/services/api";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { getPasswordStrength } from "@/lib/validations/auth";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const passwordSchema = z.object({
  current_password: z.string().min(1, "La contraseña actual es requerida"),
  new_password: z.string().min(1, "La nueva contraseña es requerida").regex(passwordRegex, "Debe tener mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial"),
  confirm_password: z.string().min(1, "Confirma la nueva contraseña"),
}).refine((data) => data.new_password === data.confirm_password, { message: "Las contraseñas no coinciden", path: ["confirm_password"] });

type PasswordFormData = z.infer<typeof passwordSchema>;

export function PasswordSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: "", color: "" });
  const [newPasswordValue, setNewPasswordValue] = useState("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: "", new_password: "", confirm_password: "" },
  });

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPasswordValue(value);
    setPasswordStrength(value ? getPasswordStrength(value) : { score: 0, label: "", color: "" });
  };

  const newPasswordRegister = register("new_password");

  const onSubmit = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      await userService.changePassword({ current_password: data.current_password, new_password: data.new_password });
      reset();
      setNewPasswordValue("");
      setPasswordStrength({ score: 0, label: "", color: "" });
      toast.success("Contraseña actualizada correctamente");
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.detail);
      } else {
        toast.error("Error al cambiar la contraseña");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="password-settings">
      <div className="section-header">
        <ShieldCheck size={24} className="section-icon" />
        <div>
          <h3 className="section-title">Seguridad</h3>
          <p className="section-description">Cambia tu contraseña para mantener tu cuenta segura.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="password-form">
        <div className="form-group">
          <label htmlFor="current_password">Contraseña actual</label>
          <PasswordInput id="current_password" placeholder="••••••••" autoComplete="current-password" {...register("current_password")} error={!!errors.current_password} />
          {errors.current_password && <span className="error-message">{errors.current_password.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="new_password">Nueva contraseña</label>
          <PasswordInput id="new_password" placeholder="••••••••" autoComplete="new-password" {...newPasswordRegister} onChange={(e) => { newPasswordRegister.onChange(e); handleNewPasswordChange(e); }} error={!!errors.new_password} />
          {newPasswordValue && (
            <div className="password-strength">
              <div className="strength-bar"><div className="strength-fill" style={{ width: `${(passwordStrength.score / 6) * 100}%`, backgroundColor: passwordStrength.color }} /></div>
              <span className="strength-label" style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
            </div>
          )}
          {errors.new_password && <span className="error-message">{errors.new_password.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="confirm_password">Confirmar nueva contraseña</label>
          <PasswordInput id="confirm_password" placeholder="••••••••" autoComplete="new-password" {...register("confirm_password")} error={!!errors.confirm_password} />
          {errors.confirm_password && <span className="error-message">{errors.confirm_password.message}</span>}
        </div>

        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? <><Loader2 size={16} className="spinner" /> Cambiando...</> : "Cambiar Contraseña"}
        </button>
      </form>

      <style jsx>{`
        .password-settings { max-width: 500px; }
        .section-header { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem; }
        .section-icon { color: var(--accent-primary); flex-shrink: 0; margin-top: 0.25rem; }
        .section-title { font-size: var(--text-h3); font-weight: var(--font-semibold); color: var(--text-primary); margin-bottom: 0.25rem; }
        .section-description { font-size: var(--text-body); color: var(--text-secondary); }
        .password-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.375rem; }
        .form-group label { font-size: var(--text-label); font-weight: var(--font-medium); color: var(--text-secondary); }
        .error-message { font-size: var(--text-caption); color: var(--error); }
        .password-strength { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.5rem; }
        .strength-bar { flex: 1; height: 4px; background-color: var(--border-primary); border-radius: 2px; overflow: hidden; }
        .strength-fill { height: 100%; transition: all 0.3s ease; border-radius: 2px; }
        .strength-label { font-size: var(--text-caption); font-weight: var(--font-medium); min-width: 50px; }
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-size: var(--text-label); font-weight: var(--font-medium); cursor: pointer; transition: all 0.15s ease; border: none; margin-top: 0.5rem; }
        .btn-primary { background-color: var(--accent-primary); color: white; }
        .btn-primary:hover:not(:disabled) { background-color: var(--cyan-600); }
        .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default PasswordSettings;
