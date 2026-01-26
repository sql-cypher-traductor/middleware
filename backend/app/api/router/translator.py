from typing import List

from fastapi import APIRouter, HTTPException, Depends
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


@router.post("", response_model=TranslationResponseDTO)
async def translate_sql(request: TranslationRequestDTO):
    """
    Convierte consultas SQL a Cypher.
    Soporta las operaciones CRUD.
    """
    try:
        cypher = translator.translate(request.sql_query, dialect=request.source_db_type)

        return TranslationResponseDTO(
            sql_query=request.sql_query,
            cypher_query=cypher,
            metadata={"dialect": request.source_db_type, "status": "success"},
        )

    except TranslationError as e:
        # Errores de validación
        return TranslationResponseDTO(
            sql_query=request.sql_query,
            error=str(e),
            cypher_query=None,
            metadata={"dialect": request.source_db_type, "status": "error"},
        )

    except Exception as e:
        # Errores no controlados
        print(f"CRITICAL ERROR: {e}")
        raise HTTPException(
            status_code=500, detail="Error interno del servidor de traducción."
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
