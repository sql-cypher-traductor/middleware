"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { userService } from "@/services/userService";
import { ApiError } from "@/services/api";
import type { UserResponse } from "@/types/auth";

const profileSchema = z.object({
  first_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(50, "El nombre no puede exceder 50 caracteres"),
  last_name: z.string().min(2, "El apellido debe tener al menos 2 caracteres").max(50, "El apellido no puede exceder 50 caracteres"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileSettingsProps {
  user: UserResponse;
  onUpdate: (user: UserResponse) => void;
}

export function ProfileSettings({ user, onUpdate }: ProfileSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { first_name: user.first_name, last_name: user.last_name },
  });

  const watchedValues = watch();

  useEffect(() => {
    const changed = watchedValues.first_name !== user.first_name || watchedValues.last_name !== user.last_name;
    setHasChanges(changed);
  }, [watchedValues, user]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      const updatedUser = await userService.updateProfile(data);
      onUpdate(updatedUser);
      reset({ first_name: updatedUser.first_name, last_name: updatedUser.last_name });
      toast.success("Perfil actualizado correctamente");
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.detail);
      } else {
        toast.error("Error al actualizar el perfil");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-settings">
      <h3 className="section-title">Perfil</h3>
      <p className="section-description">Actualiza tu información personal.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="profile-form">
        <div className="form-group">
          <label htmlFor="first_name">Nombre</label>
          <input id="first_name" type="text" {...register("first_name")} className={errors.first_name ? "input-error" : ""} />
          {errors.first_name && <span className="error-message">{errors.first_name.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="last_name">Apellido</label>
          <input id="last_name" type="text" {...register("last_name")} className={errors.last_name ? "input-error" : ""} />
          {errors.last_name && <span className="error-message">{errors.last_name.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Correo electrónico</label>
          <input id="email" type="email" value={user.email} disabled className="input-disabled" />
          <span className="help-text">El correo electrónico no puede ser modificado.</span>
        </div>

        <button type="submit" className={`btn ${hasChanges ? "btn-primary" : "btn-disabled"}`} disabled={!hasChanges || isLoading}>
          {isLoading ? <><Loader2 size={16} className="spinner" /> Guardando...</> : "Guardar Cambios"}
        </button>
      </form>

      <style jsx>{`
        .profile-settings { max-width: 500px; }
        .section-title { font-size: var(--text-h3); font-weight: var(--font-semibold); color: var(--text-primary); margin-bottom: 0.5rem; }
        .section-description { font-size: var(--text-body); color: var(--text-secondary); margin-bottom: 1.5rem; }
        .profile-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.375rem; }
        .form-group label { font-size: var(--text-label); font-weight: var(--font-medium); color: var(--text-secondary); }
        .form-group input { padding: 0.75rem 1rem; border: 1px solid var(--border-primary); border-radius: 0.5rem; background-color: var(--bg-tertiary); color: var(--text-primary); font-size: var(--text-body); transition: all 0.15s ease; }
        .form-group input:focus { outline: none; border-color: var(--accent-primary); box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.15); }
        .form-group input.input-error { border-color: var(--error); }
        .form-group input.input-disabled { background-color: var(--bg-secondary); color: var(--text-muted); cursor: not-allowed; }
        .error-message { font-size: var(--text-caption); color: var(--error); }
        .help-text { font-size: var(--text-caption); color: var(--text-muted); }
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-size: var(--text-label); font-weight: var(--font-medium); cursor: pointer; transition: all 0.15s ease; border: none; margin-top: 0.5rem; }
        .btn-primary { background-color: var(--accent-primary); color: white; }
        .btn-primary:hover { background-color: var(--cyan-600); }
        .btn-disabled { background-color: var(--bg-tertiary); color: var(--text-muted); cursor: not-allowed; }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default ProfileSettings;
