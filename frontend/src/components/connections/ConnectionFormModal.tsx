"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Database, Share2, Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { connectionService } from "@/services/connectionService";
import {
  connectionCreateSchema,
  DEFAULT_PORTS,
  type ConnectionCreateFormData,
} from "@/lib/validations/connection";
import type { ConnectionResponse, EngineType, ConnectionUpdateRequest } from "@/types/connection";

interface ConnectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (connection: ConnectionResponse) => void;
  editConnection?: ConnectionResponse | null;
  defaultEngineType?: EngineType;
}

export function ConnectionFormModal({
  isOpen,
  onClose,
  onSuccess,
  editConnection,
  defaultEngineType = "SQL_SERVER",
}: ConnectionFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!editConnection;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ConnectionCreateFormData>({
    resolver: zodResolver(connectionCreateSchema),
    defaultValues: {
      connection_name: "",
      engine_type: "SQL_SERVER",
      host: "localhost",
      port: DEFAULT_PORTS.SQL_SERVER,
      database_name: "",
      username_db: "",
      password_db: "",
    },
  });

  const engineType = watch("engine_type") as EngineType;

  // Actualizar puerto cuando cambia el tipo de motor
  useEffect(() => {
    if (!isEditing) {
      setValue("port", DEFAULT_PORTS[engineType]);
    }
  }, [engineType, setValue, isEditing]);

  // Cargar datos de edición
  useEffect(() => {
    if (editConnection) {
      reset({
        connection_name: editConnection.connection_name,
        engine_type: editConnection.engine_type,
        host: editConnection.host,
        port: editConnection.port,
        database_name: editConnection.database_name,
        username_db: editConnection.username_db,
        password_db: "placeholder", // Placeholder para pasar validación
      });
    } else {
      reset({
        connection_name: "",
        engine_type: defaultEngineType,
        host: "localhost",
        port: DEFAULT_PORTS[defaultEngineType],
        database_name: "",
        username_db: "",
        password_db: "",
      });
    }
    setTestResult(null);
    setError(null);
    setShowPassword(false);
  }, [editConnection, reset, isOpen, defaultEngineType]);

  const handleTestConnection = async () => {
    const values = watch();

    // Validar que todos los campos estén llenos
    if (!values.host || !values.port || !values.database_name || !values.username_db || !values.password_db) {
      setTestResult({
        success: false,
        message: "Completa todos los campos antes de probar la conexión",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await connectionService.testConnection({
        connection_name: values.connection_name || "test",
        engine_type: values.engine_type as EngineType,
        host: values.host,
        port: values.port,
        database_name: values.database_name,
        username_db: values.username_db,
        password_db: values.password_db,
      });
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Error al probar la conexión",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const onSubmit = async (data: ConnectionCreateFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      let connection: ConnectionResponse;

      if (isEditing && editConnection) {
        // Solo enviar campos que cambiaron
        const updateData: ConnectionUpdateRequest = {};
        if (data.connection_name !== editConnection.connection_name) {
          updateData.connection_name = data.connection_name;
        }
        if (data.host !== editConnection.host) {
          updateData.host = data.host;
        }
        if (data.port !== editConnection.port) {
          updateData.port = data.port;
        }
        if (data.database_name !== editConnection.database_name) {
          updateData.database_name = data.database_name;
        }
        if (data.username_db !== editConnection.username_db) {
          updateData.username_db = data.username_db;
        }
        // Solo enviar password si cambió del placeholder
        if (data.password_db && data.password_db !== "placeholder") {
          updateData.password_db = data.password_db;
        }

        connection = await connectionService.updateConnection(
          editConnection.connection_id,
          updateData
        );
      } else {
        connection = await connectionService.createConnection(data);
      }

      onSuccess(connection);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrapper">
            {engineType === "SQL_SERVER" ? (
              <Database size={24} className="modal-icon sql" />
            ) : (
              <Share2 size={24} className="modal-icon neo4j" />
            )}
            <h2 className="modal-title">
              {isEditing ? "Editar Conexión" : "Agregar Conexión"}
            </h2>
          </div>
          <button className="close-button" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-body">
          {error && (
            <div className="error-banner">
              <XCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Alias de la conexión</label>
            <input
              type="text"
              className={`form-input ${errors.connection_name ? "error" : ""}`}
              placeholder="Mi base de datos"
              {...register("connection_name")}
            />
            {errors.connection_name && (
              <span className="form-error">{errors.connection_name.message}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Tipo de base de datos</label>
            <div className="engine-selector">
              <label className={`engine-option ${engineType === "SQL_SERVER" ? "selected" : ""}`}>
                <input
                  type="radio"
                  value="SQL_SERVER"
                  {...register("engine_type")}
                  disabled={isEditing}
                />
                <Database size={20} />
                <span>SQL Server</span>
              </label>
              <label className={`engine-option ${engineType === "NEO4J" ? "selected" : ""}`}>
                <input
                  type="radio"
                  value="NEO4J"
                  {...register("engine_type")}
                  disabled={isEditing}
                />
                <Share2 size={20} />
                <span>Neo4j</span>
              </label>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-grow">
              <label className="form-label">Host</label>
              <input
                type="text"
                className={`form-input ${errors.host ? "error" : ""}`}
                placeholder="localhost"
                {...register("host")}
              />
              {errors.host && (
                <span className="form-error">{errors.host.message}</span>
              )}
            </div>
            <div className="form-group" style={{ width: "120px" }}>
              <label className="form-label">Puerto</label>
              <input
                type="number"
                className={`form-input ${errors.port ? "error" : ""}`}
                {...register("port", { valueAsNumber: true })}
              />
              {errors.port && (
                <span className="form-error">{errors.port.message}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Base de datos</label>
            <input
              type="text"
              className={`form-input ${errors.database_name ? "error" : ""}`}
              placeholder={engineType === "NEO4J" ? "neo4j" : "mi_base_datos"}
              {...register("database_name")}
            />
            {errors.database_name && (
              <span className="form-error">{errors.database_name.message}</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group flex-grow">
              <label className="form-label">Usuario</label>
              <input
                type="text"
                className={`form-input ${errors.username_db ? "error" : ""}`}
                placeholder={engineType === "NEO4J" ? "neo4j" : "sa"}
                {...register("username_db")}
              />
              {errors.username_db && (
                <span className="form-error">{errors.username_db.message}</span>
              )}
            </div>
            <div className="form-group flex-grow">
              <label className="form-label">
                Contraseña {isEditing && <span className="optional">(dejar vacío para mantener)</span>}
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`form-input ${errors.password_db ? "error" : ""}`}
                  placeholder="••••••••"
                  {...register("password_db")}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password_db && (
                <span className="form-error">{errors.password_db.message}</span>
              )}
            </div>
          </div>

          {/* Test Connection Result */}
          {testResult && (
            <div className={`test-result ${testResult.success ? "success" : "error"}`}>
              {testResult.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleTestConnection}
              disabled={isTesting || isSubmitting}
            >
              {isTesting ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  <span>Probando...</span>
                </>
              ) : (
                <span>Probar conexión</span>
              )}
            </button>
            <div className="actions-right">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>{isEditing ? "Guardar cambios" : "Crear conexión"}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1rem;
        }

        .modal-content {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 0.75rem;
          width: 100%;
          max-width: 540px;
          max-height: 90vh;
          overflow-y: auto;
          z-index: 100;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-primary);
        }

        .modal-title-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .modal-icon.sql {
          color: var(--blue-700);
        }

        .modal-icon.neo4j {
          color: var(--graph-node-b);
        }

        .modal-title {
          font-size: var(--text-h3);
          font-weight: var(--font-semibold);
          color: var(--text-primary);
          margin: 0;
        }

        .close-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          border-radius: 0.375rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .close-button:hover {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .modal-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background-color: var(--red-500);
          background-opacity: 0.1;
          border: 1px solid var(--red-500);
          border-radius: 0.5rem;
          color: var(--red-500);
          font-size: var(--text-label);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .form-row {
          display: flex;
          gap: 1rem;
        }

        .flex-grow {
          flex: 1;
        }

        .form-label {
          font-size: var(--text-label);
          font-weight: var(--font-medium);
          color: var(--text-primary);
        }

        .optional {
          font-weight: normal;
          color: var(--text-muted);
          font-size: var(--text-caption);
        }

        .form-input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          background-color: var(--bg-tertiary);
          border: 1px solid var(--border-primary);
          border-radius: 0.5rem;
          font-size: var(--text-label);
          color: var(--text-primary);
          transition: all 0.15s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
        }

        .form-input.error {
          border-color: var(--red-500);
        }

        .form-input::placeholder {
          color: var(--text-muted);
        }

        .form-error {
          font-size: var(--text-caption);
          color: var(--red-500);
        }

        .engine-selector {
          display: flex;
          gap: 0.75rem;
        }

        .engine-option {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background-color: var(--bg-tertiary);
          border: 2px solid var(--border-primary);
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.15s ease;
          font-size: var(--text-label);
          color: var(--text-secondary);
        }

        .engine-option input {
          display: none;
        }

        .engine-option:hover {
          border-color: var(--accent-primary);
        }

        .engine-option.selected {
          border-color: var(--accent-primary);
          background-color: rgba(6, 182, 212, 0.1);
          color: var(--accent-primary);
        }

        .password-input-wrapper {
          position: relative;
        }

        .password-input-wrapper .form-input {
          padding-right: 2.5rem;
        }

        .password-toggle {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0.25rem;
        }

        .password-toggle:hover {
          color: var(--text-primary);
        }

        .test-result {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          font-size: var(--text-label);
        }

        .test-result.success {
          background-color: rgba(34, 197, 94, 0.1);
          border: 1px solid var(--green-500);
          color: var(--green-500);
        }

        .test-result.error {
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid var(--red-500);
          color: var(--red-500);
        }

        .modal-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-primary);
        }

        .actions-right {
          display: flex;
          gap: 0.75rem;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          border-radius: 0.5rem;
          font-size: var(--text-label);
          font-weight: var(--font-medium);
          cursor: pointer;
          transition: all 0.15s ease;
          border: none;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background-color: var(--accent-primary);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: var(--cyan-600);
        }

        .btn-secondary {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
          border: 1px solid var(--border-primary);
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: var(--bg-primary);
        }

        .btn-ghost {
          background: transparent;
          color: var(--text-secondary);
        }

        .btn-ghost:hover:not(:disabled) {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default ConnectionFormModal;


