from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .api.auth_router import router as auth_router
from .api.user_router import router as user_router
from .api.admin_router import router as admin_router
from .api.connection_router import router as connection_router
from .api.translator_router import router as translator_router
from .api.execution_router import router as execution_router
from .core.config import settings

load_dotenv()

app = FastAPI(
    title="Middleware traductor SQL a Cypher",
    version="1.0.0",
    description="API de traducción de consultas SQL a Cypher para bases de datos en Neo4j ",
)

# Configuración del CORS
# En desarrollo usamos localhost, en producción usar el dominio real
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    settings.FRONTEND_URL,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # Importante para cookies
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-CSRF-Token",  # Header para el token CSRF
        "Accept",
        "Origin",
        "X-Requested-With",
    ],
    expose_headers=["X-CSRF-Token"],
)

# Agregar enrutadores
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(admin_router)
app.include_router(connection_router)
app.include_router(translator_router)
app.include_router(execution_router)


@app.get("/")
def health_check():
    return {
        "status": "ok",
        "message": "Middleware operativo",
        "service": "API Traductor SQL a Cypher",
    }
