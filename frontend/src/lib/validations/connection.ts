import { z } from "zod";
import type { EngineType } from "@/types/connection";

// Regex para validación de hostname/IP
const hostRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$|^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^localhost$/;

// Puertos por defecto
export const DEFAULT_PORTS: Record<EngineType, number> = {
  SQL_SERVER: 1433,
  NEO4J: 7687,
};

// Esquema base para conexiones
const connectionBaseSchema = {
  connection_name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  engine_type: z.enum(["SQL_SERVER", "NEO4J"], {
    message: "Selecciona un tipo de base de datos",
  }),
  host: z
    .string()
    .min(1, "El host es requerido")
    .regex(hostRegex, "Ingresa un host válido (IP, hostname o localhost)"),
  port: z
    .number({
      message: "El puerto debe ser un número",
    })
    .int("El puerto debe ser un número entero")
    .min(1, "El puerto debe ser mayor a 0")
    .max(65535, "El puerto no puede exceder 65535"),
  database_name: z
    .string()
    .min(1, "El nombre de la base de datos es requerido"),
  username_db: z
    .string()
    .min(1, "El usuario es requerido"),
};

// Esquema para crear conexión
export const connectionCreateSchema = z.object({
  ...connectionBaseSchema,
  password_db: z
    .string()
    .min(1, "La contraseña es requerida"),
});

// Esquema para actualizar conexión (incluye engine_type para mantener compatibilidad)
export const connectionUpdateSchema = z.object({
  connection_name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  engine_type: z.enum(["SQL_SERVER", "NEO4J"], {
    message: "Selecciona un tipo de base de datos",
  }),
  host: z
    .string()
    .min(1, "El host es requerido")
    .regex(hostRegex, "Ingresa un host válido (IP, hostname o localhost)"),
  port: z
    .number({
      message: "El puerto debe ser un número",
    })
    .int("El puerto debe ser un número entero")
    .min(1, "El puerto debe ser mayor a 0")
    .max(65535, "El puerto no puede exceder 65535"),
  database_name: z
    .string()
    .min(1, "El nombre de la base de datos es requerido"),
  username_db: z
    .string()
    .min(1, "El usuario es requerido"),
  password_db: z
    .string()
    .optional()
    .or(z.literal("")), // Permitir cadena vacía al editar
});

// Esquema para probar conexión
export const connectionTestSchema = z.object({
  ...connectionBaseSchema,
  password_db: z
    .string()
    .min(1, "La contraseña es requerida"),
});

// Tipos inferidos
export type ConnectionCreateFormData = z.infer<typeof connectionCreateSchema>;
export type ConnectionUpdateFormData = z.infer<typeof connectionUpdateSchema>;
export type ConnectionTestFormData = z.infer<typeof connectionTestSchema>;


