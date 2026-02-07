# 📋 Tareas para el Módulo de Autenticación y Gestión de Usuarios (AUM)

## AUM-01: Registro e Inicio de Sesión

### 🛠️ Backend (FastAPI + Alembic + Supabase)
1. [x] **Modelo de Datos:** Crear tabla `users` vía Alembic con campos: `id` (UUID), `email` (unique), `password_hash`, `first_name`, `last_name`, `role` (default: 'developer'), `is_active` (bool).
2. **Endpoint Registro:** `POST /auth/register`. Validar que el email no exista, hashear contraseña con **Bcrypt** y guardar.
3. **Endpoint Login:** `POST /auth/login`. Validar credenciales y retornar un **JWT (JSON Web Token)**.
4. **Seguridad:** Implementar un middleware de *Rate Limiting* (puedes usar `slowapi`) para limitar a **5 intentos fallidos cada 10 minutos**, usando como clave la **combinación de IP + email** y bloqueando nuevos intentos durante **15 minutos** cuando se supere el límite (responder con un error estándar de demasiados intentos).

### 🎨 Frontend (Next.js)
1. **Estructura:** Layout de autenticación con un *toggle* para cambiar entre formularios.
2. **Validación:** Uso de **Zod** para el esquema de validación (regex para email y fortaleza de contraseña).
3. **Estado:** Almacenar el JWT en una *HttpOnly Cookie* marcada también como `Secure` y con política `SameSite` (`Lax` o `Strict` según el flujo de autenticación). Para endpoints mutables (ej. `POST`, `PATCH`, `DELETE`), implementar una estrategia anti-CSRF explícita (por ejemplo, token CSRF enviado por header o esquema de *double-submit token*).
4. **UX:**
   1. Botón con estado `loading` usando un spinner de Lucide React.
   2. `show/hide password` con un componente de input reutilizable.

---

## AUM-02: Actualización del Perfil

### 🛠️ Backend
1. **Endpoint:** `PATCH /users/me`. Debe ser una ruta protegida que extraiga el `user_id` del token.
2. **Lógica de Contraseña:** Si el payload incluye `new_password`, requerir `current_password`. Validar el hash actual antes de permitir el cambio.
3. **Validación:** No permitir que el usuario cambie su propio `role` ni su `email` desde este endpoint (eso va por AUM-04 o un proceso de verificación).

### 🎨 Frontend
1. **Formulario:** Campos pre-rellenados con los datos actuales del usuario (obtenidos de un `GET /users/me`).
2. **UX:** Validación *inline* mientras el usuario escribe.
   1. Toast de notificación (puedes usar `sonner`) al guardar con éxito.
   2. Sección de "Seguridad" separada para el cambio de contraseña.

---

## AUM-03: Restablecimiento de Contraseña

### 🛠️ Backend
1. **Endpoint Solicitud:** `POST /auth/forgot-password`. Genera un token temporal con expiración corta (ej. 15 min) y envíalo por correo (puedes integrar *Resend* o el servicio de SMTP de Supabase).
2. **Endpoint Reset:** `POST /auth/reset-password`. Recibe el token y la nueva contraseña. El token debe almacenarse en BD solo en forma de **hash no reversible**, estar vinculado a un usuario y al propósito concreto de **restablecimiento de contraseña**, y contar con metadatos como `issued_at`/`expires_at` y un flag de `consumed`. Al recibir la petición, busca el token por su hash, verifica que no esté expirado ni consumido y que coincida con el usuario; si es válido, actualiza la contraseña, marca el token como **consumido (de un solo uso)** e invalídalo tras el uso.
3. **Seguridad:** El mensaje de respuesta al solicitar el reset debe ser: *"Si el correo existe en nuestro sistema, recibirás un enlace"*, para evitar enumeración de cuentas.

### 🎨 Frontend
1. **Flujo:**
   1. Vista de "Olvidé mi contraseña" (solo campo email).
   2. Vista de "Nueva Contraseña" (accedida mediante `/reset-password?token=...`).
2. **UX:** Indicador visual de fortaleza de contraseña (barra de colores: Rojo -> Amarillo -> Verde) mientras el usuario escribe la nueva clave.

---

## AUM-04: Gestión de Usuarios (Admin)

### 🛠️ Backend
1. **RBAC (Role-Based Access Control):** Crear una dependencia en FastAPI `check_admin_role` que valide si el usuario del JWT tiene `role == 'admin'`.
2. **Endpoints:**
   1. `GET /admin/users`: Con soporte para `?search=...&role=...` y paginación.
   2. `PATCH /admin/users/{id}`: Para cambiar roles o activar/desactivar.
   3. `DELETE /admin/users/{id}`: Eliminación lógica (soft-delete), marcando al usuario como eliminado (por ejemplo, usando un campo `deleted_at` en la base de datos).

### 🎨 Frontend
1. **Interfaz:** Una tabla interactiva (puedes usar `shadcn/ui` con `tanstack-table`).
2. **Acciones:** Menú de tres puntos (Dropdown) por cada fila para las opciones de editar/borrar.
3. **UX:** * **Modal de Confirmación:** Un diálogo de alerta antes de eliminar un usuario para evitar desastres por clic accidental.
   1. Badge de colores para los roles (ej. Azul para "Desarrollador", Violeta para "Admin").
