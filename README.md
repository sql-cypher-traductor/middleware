# Middleware SQL → Cypher

Middleware de traducción SQL a Cypher encargado de ejecutar consultas en Neo4j y visualizar resultados (tabla, JSON y grafo). Cuenta con un historial de consultas por usuarios que permite reutilizar sentencias traducidas o ejecutadas anteriormente.

## Stack actual

- Backend: FastAPI + SQLAlchemy + Alembic + sqlglot
- Frontend: Next.js 16 + TypeScript + Monaco Editor + Sonner + React Force Graph
- Base de datos del sistema: PostgreSQL
- Auth: JWT + cookies + CSRF

## Requisitos

- Python 3.11+
- Node.js 20+
- pnpm 9+
- PostgreSQL (local o Supabase)

## Estructura

- `backend/`: API FastAPI, validación/traducción SQL, ejecución y persistencia
- `frontend/`: aplicación web (auth, dashboard, traductor, historial, admin)
- `.env.example`: plantilla de variables para backend/frontend

## 1) Configurar variables de entorno

Desde la raíz del repositorio:

```bash
cp .env.example .env
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Edita `.env` con tus valores reales.

### Variables mínimas para desarrollo local

- Base de datos:
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_HOST`
  - `DB_PORT`
  - `DB_NAME`
- Seguridad:
  - `JWT_SECRET_KEY`
  - `CSRF_SECRET_KEY`
  - `ENCRYPTION_KEY`
- CORS/URLs:
  - `FRONTEND_URL=http://localhost:3000`
  - `BACKEND_URL=http://localhost:8000`


## 2) Backend

### Instalar dependencias

```bash
cd backend
python -m venv .venv
```

Activar entorno virtual:

- Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

- macOS/Linux:

```bash
source .venv/bin/activate
```

Instalar paquetes:

```bash
pip install -r requirements.txt
```

### Migraciones

Con `.env` ya configurado:

```bash
alembic upgrade head
```

### Ejecutar backend

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

- `GET http://localhost:8000/`

## 3) Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Abre:

- `http://localhost:3000`

Build de verificación:

```bash
pnpm build
```

## 4) Flujo de uso del sistema

1. Levantar backend (`:8000`) y frontend (`:3000`)
2. Registrar/iniciar sesión
3. Configurar conexión(es) desde el módulo de conexiones
4. Ir al traductor:
   - Escribir SQL
   - Traducir a Cypher
   - Traducir y ejecutar sobre Neo4j
5. Revisar resultados:
   - Tabla
   - JSON
   - Grafo
6. Consultar historial y detalles de ejecución

## 5) Comportamiento actual del traductor

- Soporta `SELECT`, `INSERT`, `UPDATE`, `DELETE`
- Maneja errores de sintaxis/estructura con mensajes descriptivos
- Detecta casos inválidos frecuentes (por ejemplo: `SELECT` sin `FROM`, `UPDATE` sin `SET`, mismatch columnas/valores en `INSERT`)
- Los errores y advertencias se visualizan en forma de notificación.

## 6) Endpoints principales

- Traducción:
  - `POST /translator/translate`
- Traducción + ejecución:
  - `POST /execution/translate-and-execute`
- Ejecución Cypher directa:
  - `POST /execution/cypher`
- Historial:
  - `GET /execution/history`

## 7) Verificación de Calidad para aprobar el pipeline ci.yaml

Backend:

```bash
cd backend
ruff check .
black .
```

Frontend:

```bash
cd frontend
pnpm lint
pnpm build
```

---
