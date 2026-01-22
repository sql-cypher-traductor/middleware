from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...core import security, database
from ...api import deps
from ...dto import ConnectionCreateDTO, ConnectionResponseDTO
from ...models import User, DbConnection

router = APIRouter()


@router.post("/", response_model=ConnectionResponseDTO)
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


@router.get("/", response_model=List[ConnectionResponseDTO])
def get_my_connections(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Lista las conexiones del usuario."""
    return db.query(DbConnection).filter(DbConnection.user_id == current_user.id).all()


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
