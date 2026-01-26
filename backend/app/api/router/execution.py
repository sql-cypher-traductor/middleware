from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from ...core import database
from ...api import deps
from ...core.security import decrypt_credential
from ...dto import ExecutionRequestDTO
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
