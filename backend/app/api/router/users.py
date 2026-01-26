from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ...api import deps
from ...core import database, security
from ...models import User

router = APIRouter(tags=["Usuarios"])


class UserUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


@router.put("/me")
def update_user_me(
    user_in: UserUpdate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    if user_in.full_name:
        current_user.full_name = user_in.full_name
    if user_in.email:
        # Validar si el email ya existe en otro usuario sería ideal aquí
        current_user.email = user_in.email

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/password")
def change_password(
    pass_in: PasswordChange,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    # 1. Verificar password actual
    if not security.verify_password(
        pass_in.current_password, current_user.hashed_password
    ):
        raise HTTPException(
            status_code=400, detail="La contraseña actual es incorrecta"
        )

    # 2. Actualizar
    current_user.hashed_password = security.get_password_hash(pass_in.new_password)
    db.commit()

    return {"message": "Contraseña actualizada correctamente"}
