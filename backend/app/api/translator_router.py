"""
Router para endpoints de traducción SQL a Cypher.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..core.dependencies import get_current_user_from_cookie
from ..db.database import get_db
from ..dto.translator_dto import TranslationRequestDTO, TranslationResponseDTO
from ..models.user import User
from ..models.query_history import QueryHistory
from ..models.enums.query_status import QueryStatus
from ..models.enums.status_failure import FailureStage
from ..services.translation_service import TranslationService
from ..repositories.query_history_repository import QueryHistoryRepository

router = APIRouter(
    prefix="/translator",
    tags=["Traductor"],
)


@router.post(
    "/translate",
    response_model=TranslationResponseDTO,
    summary="Traducir SQL a Cypher",
    description="Traduce una consulta SQL a su equivalente en Cypher. "
    "Soporta sentencias SELECT, INSERT, UPDATE y DELETE.",
)
async def translate_sql_to_cypher(
    request: TranslationRequestDTO,
    current_user: User = Depends(get_current_user_from_cookie),
    db: Session = Depends(get_db),
) -> TranslationResponseDTO:
    """
    Traduce una consulta SQL a Cypher.

    - **sql**: Consulta SQL a traducir.

    Retorna la consulta Cypher equivalente junto con el tiempo de traducción.
    También guarda la traducción en el historial de consultas.
    """
    service = TranslationService()
    query_history_repo = QueryHistoryRepository(db)

    # Crear registro en historial
    query_history = QueryHistory(
        user_id=current_user.user_id,
        sql_query=request.sql,
        query_status=QueryStatus.PENDING,
    )
    query_history = query_history_repo.create(query_history)

    try:
        # Realizar la traducción
        result = service.translate(request)

        # Actualizar historial con éxito
        query_history.cypher_query = result.cypher
        query_history.translation_time = result.translation_time
        query_history.query_status = QueryStatus.TRANSLATED
        query_history_repo.update(query_history)

        return result

    except Exception as e:
        # Actualizar historial con error
        query_history.query_status = QueryStatus.FAILED
        query_history.failure_stage = FailureStage.TRANSLATION
        query_history.error_message = str(e)
        query_history_repo.update(query_history)
        raise
