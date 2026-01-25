from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from neo4j import GraphDatabase
import pymssql  # pyodbc
from ...core import security, database
from ...api import deps
from ...dto import ConnectionCreateDTO, ConnectionResponseDTO, ConnectionUpdateDTO
from ...models import User, DbConnection

router = APIRouter(tags=["Conexiones a BD"])


@router.post("", response_model=ConnectionResponseDTO)
def create_connection(
    conn_in: ConnectionCreateDTO,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Guarda una nueva conexión cifrando la contraseña."""

    # Cifrado de contraseña
    encrypted_pwd = security.encrypt_credential(conn_in.password)

    # Guardar la conexión
    new_conn = DbConnection(
        alias=conn_in.alias,
        engine=conn_in.engine,
        host=conn_in.host,
        port=conn_in.port,
        username=conn_in.username,
        db_name=conn_in.db_name,
        encrypted_password=encrypted_pwd,
        user_id=current_user.id,
    )

    db.add(new_conn)
    db.commit()
    db.refresh(new_conn)
    return new_conn


@router.get("", response_model=List[ConnectionResponseDTO])
def get_my_connections(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Lista las conexiones del usuario."""
    return db.query(DbConnection).filter(DbConnection.user_id == current_user.id).all()


@router.get("/{conn_id}", response_model=ConnectionResponseDTO)
def get_connection(
    conn_id: str,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Obtiene una conexión específica del usuario."""
    conn = (
        db.query(DbConnection)
        .filter(DbConnection.id == conn_id, DbConnection.user_id == current_user.id)
        .first()
    )

    if not conn:
        raise HTTPException(status_code=404, detail="Conexión no encontrada")
    return conn


@router.put("/{conn_id}", response_model=ConnectionResponseDTO)
def update_connection(
    conn_id: str,
    conn_update: ConnectionUpdateDTO,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Actualiza una conexión existente del usuario."""
    conn = (
        db.query(DbConnection)
        .filter(DbConnection.id == conn_id, DbConnection.user_id == current_user.id)
        .first()
    )

    if not conn:
        raise HTTPException(status_code=404, detail="Conexión no encontrada")

    update_data = conn_update.model_dump(exclude_unset=True)

    if "password" in update_data:
        raw_password = update_data.pop("password")
        if raw_password:
            conn.encrypted_password = security.encrypt_credential(raw_password)

    for key, value in update_data.items():
        setattr(conn, key, value)

    db.commit()
    db.refresh(conn)
    return conn


@router.delete("/{conn_id}")
def delete_connection(
    conn_id: str,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Elimina una conexión del usuario."""
    conn = (
        db.query(DbConnection)
        .filter(DbConnection.id == conn_id, DbConnection.user_id == current_user.id)
        .first()
    )

    if not conn:
        raise HTTPException(status_code=404, detail="Conexión no encontrada")

    db.delete(conn)
    db.commit()
    return {"status": "deleted"}


@router.post("/{conn_id}/test")
def test_connection_endpoint(
    conn_id: str,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Prueba la conexión a la base de datos especificada.
    """
    conn = (
        db.query(DbConnection)
        .filter(DbConnection.id == conn_id, DbConnection.user_id == current_user.id)
        .first()
    )

    if not conn:
        raise HTTPException(status_code=404, detail="Conexión no encontrada")

    try:
        real_password = security.decrypt_credential(conn.encrypted_password)
    except Exception:
        raise HTTPException(
            status_code=500, detail="Error al desencriptar credenciales internas"
        )

    try:
        if conn.engine.lower() == "neo4j":
            # Usar Bolt Driver
            uri = f"bolt://{conn.host}:{conn.port}"
            # Auth básico
            with GraphDatabase.driver(
                uri, auth=(conn.username, real_password)
            ) as driver:
                driver.verify_connectivity()
            return {
                "status": "success",
                "message": f"Conectado exitosamente a Neo4j en {conn.host}",
            }

        elif conn.engine.lower() in ["sqlserver", "tsql"]:
            with pymssql.connect(
                server=conn.host,
                user=conn.username,
                password=real_password,
                port=conn.port,
                database=conn.db_name or "master",
                login_timeout=5,
            ) as conn_sql:
                cursor = conn_sql.cursor()
                cursor.execute("SELECT @@VERSION")
                version = cursor.fetchone()
            return {
                "status": "success",
                "message": f"Conectado a SQL Server. Versión: {version[0][:50]}...",
            }

        else:
            return {
                "status": "warning",
                "message": f"Motor '{conn.engine}' no tiene prueba automática implementada aún.",
            }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Fallo de conexión: {str(e)}")
