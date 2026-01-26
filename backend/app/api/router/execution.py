import csv
import io
import json
from fastapi import APIRouter, HTTPException, Depends, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ...core import database
from ...api import deps
from ...core.security import decrypt_credential
from ...dto import ExecutionRequestDTO, ExportRequestDTO
from ...models import User, DbConnection
from backend.app.services.neo4j_service import Neo4jExecutor

router = APIRouter(tags=["Ejecución"])


@router.post("")
def execute_cypher(
    request: ExecutionRequestDTO,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    # 1. Buscar la conexión y verificar que pertenece al usuario
    connection = (
        db.query(DbConnection)
        .filter(
            DbConnection.id == request.connection_id,
            DbConnection.user_id == current_user.id,
        )
        .first()
    )

    if not connection:
        raise HTTPException(status_code=404, detail="Conexión no encontrada")

    if connection.engine != "neo4j":
        raise HTTPException(
            status_code=400, detail="La conexión debe ser de tipo Neo4j"
        )

    # 2. Construir URI
    uri = f"bolt://{connection.host}:{connection.port}"

    # 3. Ejecutar
    try:
        password = decrypt_credential(str(connection.encrypted_password))

        executor = Neo4jExecutor(uri, connection.username, password)
        graph_data = executor.execute(request.cypher_query)
        return graph_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/export")
def export_results(
    request: ExportRequestDTO,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Ejecuta una consulta y exporta los resultados en CSV o JSON.
    """
    # 1. Buscar la conexión
    connection = (
        db.query(DbConnection)
        .filter(
            DbConnection.id == request.connection_id,
            DbConnection.user_id == current_user.id,
        )
        .first()
    )

    if not connection:
        raise HTTPException(status_code=404, detail="Conexión no encontrada")

    # 2. Ejecutar consulta en modo tabular
    uri = f"bolt://{connection.host}:{connection.port}"
    try:
        password = decrypt_credential(str(connection.encrypted_password))
        executor = Neo4jExecutor(uri, connection.username, password)
        data = executor.execute_tabular(request.cypher_query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # 3. Formatear y retornar archivo
    if request.format == "csv":
        if not data:
            return Response(content="", media_type="text/csv")

        # Crear CSV en memoria
        output = io.StringIO()
        # Usamos las llaves del primer registro como cabeceras
        keys = data[0].keys()
        writer = csv.DictWriter(output, fieldnames=keys)
        writer.writeheader()
        writer.writerows(data)

        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=export.csv"},
        )

    elif request.format == "json":
        # Retornar JSON como archivo descargable
        json_content = json.dumps(data, default=str, indent=2)
        return Response(
            content=json_content,
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=export.json"},
        )

    else:
        raise HTTPException(status_code=400, detail="Formato no soportado")
