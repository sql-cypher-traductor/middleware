# Planificación de Sprints

## 🏁 Sprint 0: Cimientos y Definiciones
**Objetivo:** Tener el entorno listo para codificar de forma fluida y sin bloqueos técnicos.

### Arquitectura & Configuración:
- [x] Inicializar el Monorepo (Git).
- [x] Configurar Docker Compose: Orquestar FastAPI (Backend), Next.js (Frontend) y PostgreSQL (DB Sistema).
- [x] Configurar Linter/Formatter (ESLint, Prettier, Black, Ruff) para mantener el código limpio automáticamente.

### UI/UX (Prototipado):
- [ ] Diseñar en baja fidelidad (Wireframe) la pantalla del "Traductor IDE" (3 paneles).
- [ ] Definir la paleta de colores y componentes base en Shadcn/UI dentro de Next.js.

### Investigación (Spike):
- [x] Prueba de concepto pequeña con sqlglot: Script simple de Python que traduzca un SELECT básico a Cypher.

**Entregable:** Un repositorio que levanta con docker-compose up mostrando un "Hola Mundo" en Next.js conectado a la API de FastAPI.

---

## 🏃 Sprint 1: Motor de Traducción
**Objetivo:** Lograr que el sistema traduzca texto SQL a texto Cypher (sin interfaz gráfica compleja aún).

### Backend (Python):
- [x] Crear el servicio ```TranslatorService``` con ```sqlglot```.
- [x] Implementar traducción de cláusulas básicas: ```SELECT```, ```FROM```, ```WHERE```.
- [x] Implementar traducción de relaciones: ```JOIN``` $\rightarrow$ ```MATCH```.
- [x] Manejo de errores de parsing (Sintaxis SQL inválida).

### API:
- [x] Endpoint POST /api/translate: Recibe string SQL, devuelve string Cypher.

**Entregable:** Una API funcional que puedes probar con Postman/Swagger. Le envías un SQL y te responde con Cypher válido.

---

## 🏃 Sprint 2: Seguridad y "La Bóveda" (Gestión de Usuarios)
**Objetivo:** Que cada usuario tenga su espacio seguro y pueda guardar sus conexiones.

### Backend (Seguridad):
- [x] Implementar Modelos de BD (User, DBConnection) en PostgreSQL con SQLAlchemy.
- [x] Sistema de Auth (JWT): Login, Registro, Recuperar Contraseña.
- [x] Cifrado: Implementar servicio para encriptar/desencriptar contraseñas de conexiones (AES-128).

### Frontend (Next.js):
- [x] Páginas de Login y Registro.
- [x] Modal de "Gestión de Conexiones" (CRUD de credenciales).
- [x] Botón "Test Connection" (conectar API con drivers reales de SQL/Neo4j).

**Entregable:** Sistema de Login funcional y capacidad de guardar una conexión a Neo4j/SQL Server de forma encriptada.

---

## 🏃 Sprint 3: El IDE del Desarrollador (Integración UI)
**Objetivo:** Unir el motor del Sprint 1 con la seguridad del Sprint 2 en una interfaz usable.

### Frontend (DX):
- [x] Implementar Monaco Editor en Next.js (uno para SQL, uno para Cypher - ReadOnly).
- [x] Integrar el endpoint de traducción al botón "Traducir".
- [x] Panel de Historial de Consultas (Sidebar).

### Backend:
- [x] Guardar historial de traducciones por usuario.

**Entregable:** La "Homepage" funciona. Escribes código en la web, das clic y aparece la traducción.

---

## 🏃 Sprint 4: Ejecución y Visualización (El "Wow")
**Objetivo:** No solo traducir texto, sino ejecutarlo y ver el grafo.

### Backend (Drivers):
- [x] Servicio de Ejecución en Neo4j: Recibe Cypher $\rightarrow$ Conecta $\rightarrow$ Ejecuta $\rightarrow$ Retorna JSON.
- [x] Implementar Timeout y manejo de errores de ejecución (ej. "Database offline").

### Frontend (Viz):
- [x] Implementar visualizador de grafos (react-force-graph).
- [x] Pestañas de resultados: Vista JSON, Vista Tabla, Vista Grafo.

**Entregable:** El usuario puede ver sus nodos y relaciones bailando en la pantalla después de ejecutar una consulta.

---

## 🏃 Sprint 5: Inteligencia de Esquema y Admin (Valor Agregado)
**Objetivo:** Hacer el traductor "inteligente" leyendo la base de datos origen y dar control al admin.

### Funcionalidad (Introspección):
- [ ] Backend: Query para leer sys.tables (SQL Server).
- [ ] Frontend: Sidebar "Explorador de Esquema" (Drag & drop de tablas al editor).

### Panel de Administrador:
- [ ] Dashboard de KPIs: Gráficos de # Usuarios, Tasa de Errores.
- [ ] Logs de auditoría visuales.

**Entregable:** Un panel lateral que muestra las tablas de tu SQL Server y un Dashboard para ti como dueño.

---

## 🏁 Sprint 6: Pulido, Feedback y Despliegue (Release Candidate)
**Objetivo:** Dejar el sistema listo para producción. Cero errores críticos.

### Calidad:
- [ ] Refinamiento de UX: Loading spinners, mensajes de error amigables (Toasts).
- [ ] Testing E2E (End-to-End) de flujos críticos.

### DevOps:
- [ ] Optimización de imágenes Docker (Multi-stage build) para reducir tamaño.
- [ ] Documentación final de usuario (un pequeño Tour guiado en la app).

**Entregable:** Versión 1.0 lista para desplegar en un servidor.