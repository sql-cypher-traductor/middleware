import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "La variable de entorno DATABASE_URL no ha sido asignada. "
        "Por favor, configure una cadena de conexión a base de datos válida."
    )
try:
    engine = create_engine(DATABASE_URL)
except Exception as exc:
    raise RuntimeError(
        "Fallo al crear el motor de base de datos. "
        "Por favor, verifique que la variable de entorno DATABASE_URL es una URL válida para SQLAlchemy."
    ) from exc

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# Integración de los endpoints con la base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
