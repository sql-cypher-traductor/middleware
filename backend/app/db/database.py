import os
from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

if not all([DB_USER, DB_PASSWORD, DB_HOST]):
    raise ValueError(
        "Algunas variables de entorno no han sido configuradas correctamente."
    )


DB_URL = (
    f"postgresql://{DB_USER}:{quote_plus(DB_PASSWORD)}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

engine = create_engine(
    DB_URL,
    pool_pre_ping=True,  # Verifica la conexión
    pool_recycle=300,  # Recicla conexiones cada 5 minutos
    connect_args={"connect_timeout": 10, "options": "-c timezone=utc"},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Instancia de la sesión a la base de datos interna del sistema
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
