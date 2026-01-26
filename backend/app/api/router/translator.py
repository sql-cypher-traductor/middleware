#
from typing import List

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from .. import deps
from ...core import database
from ...dto import (
    TranslationRequestDTO,
    TranslationResponseDTO,
    TranslationHistoryResponseDTO,
)
from ...models import User, Translation
from ...services.translation.core import SQLToCypherTranslator
from ...services.translation.exceptions import TranslationError

router = APIRouter(tags=["Traducción"])
translator = SQLToCypherTranslator()

DIALECT_MAP = {
    "sqlserver": "tsql",
    "postgresql": "postgres",
    "mysql": "mysql",
    "oracle": "oracle",
    "neo4j": "tsql",
}


@router.post("", response_model=TranslationResponseDTO)
async def translate_sql(
    request: TranslationRequestDTO,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Convierte consultas SQL a Cypher.
    """

    cypher_result = None
    error_message = None
    is_client_error = False

    # 1. Determinar el dialecto
    source_dialect = DIALECT_MAP.get(request.source_db_type.lower(), "tsql")

    # 2. Traducir consulta SQL a Cypher
    try:
        if request.source_db_type.lower() == "neo4j":
            pass

        cypher_result = translator.translate(request.sql_query, dialect=source_dialect)

    except TranslationError as e:
        error_message = str(e)
        is_client_error = True
    except Exception as e:
        error_message = f"Error crítico interno: {str(e)}"

    # 3. Almacenamiento en la base de datos
    try:
        history_entry = Translation(
            user_id=current_user.id,
            sql_query=request.sql_query,
            cypher_query=cypher_result or "",
            error_message=error_message,
        )
        db.add(history_entry)
        db.commit()
        db.refresh(history_entry)
    except Exception as db_error:
        print(f"Error guardando historial: {db_error}")

    # 4. Manejo de errores y respuestas al usuario
    if error_message:
        if is_client_error:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "message": "No se pudo traducir la consulta SQL.",
                    "reason": error_message,
                    "sql": request.sql_query,
                },
            )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error interno en el servidor de traducción.",
        )

    return TranslationResponseDTO(
        sql_query=request.sql_query,
        cypher_query=cypher_result,
        metadata={"dialect": source_dialect, "status": "success"},
    )


@router.get("/history", response_model=List[TranslationHistoryResponseDTO])
def get_translation_history(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Retorna el historial de traducciones del usuario actual.
    """
    history = (
        db.query(Translation)
        .filter(Translation.user_id == current_user.id)
        .order_by(Translation.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return history
