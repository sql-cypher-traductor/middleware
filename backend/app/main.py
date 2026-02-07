from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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


@app.get("/")
def health_check():
    return {
        "status": "ok",
        "message": "Middleware operativo",
        "service": "API Traductor SQL a Cypher",
    }
