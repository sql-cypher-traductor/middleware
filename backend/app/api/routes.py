from fastapi import APIRouter, HTTPException
from ..schemas.translation_schema import TranslationRequest, TranslationResponse
from ..services.translation.core import SQLToCypherTranslator
from ..services.translation.exceptions import TranslationError

router = APIRouter()
translator = SQLToCypherTranslator()


@router.post("/translate", response_model=TranslationResponse)
async def translate_sql(request: TranslationRequest):
    """
    Convierte consultas SQL a Cypher.
    Soporta las operaciones CRUD.
    """
    try:
        cypher = translator.translate(request.sql_query, dialect=request.source_db_type)

        return TranslationResponse(
            sql_query=request.sql_query,
            cypher_query=cypher,
            metadata={"dialect": request.source_db_type, "status": "success"},
        )

    except TranslationError as e:
        # Errores de validación
        return TranslationResponse(
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
