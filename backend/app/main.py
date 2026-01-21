from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import router

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


app.include_router(router, prefix="/api/v1", tags=["Translator"])


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Backend operativo", "service": "Translator API"}
