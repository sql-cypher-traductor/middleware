import { z } from "zod";

// Regex para validación de email
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Regex para validación de contraseña fuerte
// Mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un carácter especial
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Esquema de validación para Login
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El correo electrónico es requerido")
    .regex(emailRegex, "Ingresa un correo electrónico válido"),
  password: z
    .string()
    .min(1, "La contraseña es requerida")
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
});

// Esquema de validación para Registro
export const registerSchema = z
  .object({
    first_name: z
      .string()
      .min(1, "El nombre es requerido")
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(50, "El nombre no puede exceder 50 caracteres"),
    last_name: z
      .string()
      .min(1, "El apellido es requerido")
      .min(2, "El apellido debe tener al menos 2 caracteres")
      .max(50, "El apellido no puede exceder 50 caracteres"),
    email: z
      .string()
      .min(1, "El correo electrónico es requerido")
      .regex(emailRegex, "Ingresa un correo electrónico válido"),
    password: z
      .string()
      .min(1, "La contraseña es requerida")
      .regex(
        passwordRegex,
        "La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&)"
      ),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

// Tipos inferidos de los esquemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

// Función para verificar la fortaleza de la contraseña
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[@$!%*?&]/.test(password)) score++;

  if (score <= 2) {
    return { score, label: "Débil", color: "var(--error)" };
  } else if (score <= 4) {
    return { score, label: "Media", color: "var(--warning)" };
  } else {
    return { score, label: "Fuerte", color: "var(--success)" };
  }
}

