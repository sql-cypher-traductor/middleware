# 📋 Tareas para el Módulo de Conexiones y Gestión de conexiones (AUM)

## Fase A: Backend (FastAPI + Alembic + Supabase)

### 1. Modelado de Datos (Alembic):
1. Crear migración para la tabla `connections`. Campos: `id`, `user_id`, `name`, `type` (SQL/NEO), `config` (JSON cifrado), `status`.

### 2. Servicio de Cifrado:
1. Implementar una utilidad en Python para cifrar/descifrar las credenciales.

### 3. Drivers de Conexión:
1. Instalar `pyodbc` (SQL Server) y `neo4j` (driver oficial).

### 4. Endpoints de Validación:
1. `POST /connections/test`: Intenta una conexión volátil y retorna éxito/error.
2. `GET /connections/{id}/schema`: Ejecuta consultas al `INFORMATION_SCHEMA` de SQL Server para extraer tablas y columnas.

### 5. CRUD API:
1. Endpoints para listar, crear, editar y borrar conexiones.

---

## Fase B: Frontend (Next.js + Tailwind + TypeScript)

### 1. Estructura de Carpetas:
1. Crear `/services/connections.ts` para las llamadas a la API.

### 2. Formularios con Validación:
1. Usar **React Hook Form** + **Zod** para validar que los puertos sean números, las URIs tengan formato correcto, etc.

### 3. Componente de Lista:
1. Crear una tabla o grid de "Cards" que muestre las conexiones guardadas.
2. Implementar el switch de Conectar/Desconectar (manejo de estado local).

### 4. Visualizador de Esquema:
1. Un componente tipo "Tree View" o acordeón para mostrar las tablas y columnas detectadas tras la conexión exitosa.

---

## Fase C: Integración y QA

1. **Pruebas de Conexión:** Probar con una instancia real de SQL Server (Docker es tu amigo aquí).
2. **Manejo de Secretos:** Configurar las variables de entorno en el dashboard de Supabase y en tu `.env` local.
3. **Flujo de Errores:** Forzar credenciales incorrectas para asegurar que el frontend maneje las excepciones del backend sin romperse.