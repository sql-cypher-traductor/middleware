from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.router import auth, connections, translator, execution, admin, users

from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Middleware traductor SQL a Cypher",
    version="1.0.0",
    description="API de traducción de consultas SQL a Cypher para bases de datos en Neo4j ",
)

# Configuración del CORS
origins = [
    "http://localhost:3000",
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Agregar enrutadores
app.include_router(auth.router, prefix="/api/auth")
app.include_router(connections.router, prefix="/api/connections")
app.include_router(translator.router, prefix="/api/translate")
app.include_router(execution.router, prefix="/api/execute")
app.include_router(admin.router, prefix="/api/admin")
app.include_router(users.router, prefix="/api/users")


@app.get("/")
def read_root():
    return {
        "status": "ok",
        "message": "Middleware operativo",
        "service": "API Traductor SQL a Cypher",
    }
