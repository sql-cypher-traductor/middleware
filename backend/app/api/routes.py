from fastapi import APIRouter, HTTPException
from ..schemas.translation import TranslationRequest, TranslationResponse
from app.services.translator import SQLToCypherTranslator

router = APIRouter()
translator = SQLToCypherTranslator()


@router.post("/translate", response_model=TranslationResponse)
async def translate_sql(request: TranslationRequest):
    """
    Recibe una query SQL y la traduce a Cypher.
    """
    try:
        # Invoca el servcio de traducción
        cypher = translator.translate(request.sql_query, dialect=request.source_db_type)

        return TranslationResponse(
            sql_query=request.sql_query,
            cypher_query=cypher,
            metadata={"dialect": request.source_db_type, "status": "success"},
        )

    except ValueError as e:
        # Manejo de errores en la lógica de traducción
        return TranslationResponse(
            sql_query=request.sql_query, error=str(e), cypher_query=None
        )
    except Exception as e:
        # Manejo de errores del servidor
        raise HTTPException(status_code=500, detail=str(e))
