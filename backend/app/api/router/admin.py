#
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...api import deps
from ...core import database
from ...models import User, Translation, DbConnection

router = APIRouter(tags=["Admin"])


@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    # En un sistema real, aquí verificarías: if not current_user.is_superuser...

    # 1. Total Usuarios
    total_users = db.query(User).count()

    # 2. Total Traducciones
    total_translations = db.query(Translation).count()

    # 3. Tasa de Errores (Traducciones fallidas / Totales)
    failed_translations = (
        db.query(Translation).filter(Translation.error_message is not None).count()
    )
    error_rate = 0
    if total_translations > 0:
        error_rate = (failed_translations / total_translations) * 100

    # 4. Conexiones Activas
    active_connections = db.query(DbConnection).count()

    # 5. Actividad Reciente (Últimas 5 traducciones)
    recent_activity = (
        db.query(Translation).order_by(Translation.created_at.desc()).limit(5).all()
    )

    return {
        "kpis": {
            "users": total_users,
            "translations": total_translations,
            "error_rate": round(error_rate, 2),
            "connections": active_connections,
        },
        "recent_activity": recent_activity,
    }
