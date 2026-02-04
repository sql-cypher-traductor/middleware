from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ...dto import (
    UserCreateDTO,
    UserResponseDTO,
    UserUpdateAdminDTO,
    UserUpdateDTO,
    PasswordChangeDTO,
)

from ...api import deps
from ...core import database, security
from ...models import User

router = APIRouter(tags=["Usuarios"])


@router.put("/me")
def update_user_me(
    user_in: UserUpdateDTO,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    if user_in.full_name:
        current_user.full_name = user_in.full_name
    if user_in.email:
        current_user.email = user_in.email

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/password")
def change_password(
    pass_in: PasswordChangeDTO,
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


@router.get("", response_model=List[UserResponseDTO])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """(Admin) Listar todos los usuarios."""
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.post("", response_model=UserResponseDTO)
def create_user_by_admin(
    user_in: UserCreateDTO,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """(Admin) Crear un nuevo usuario manualmente."""
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(status_code=400, detail="El email ya existe.")

    hashed_password = security.get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        is_superuser=False,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.put("/{user_id}", response_model=UserResponseDTO)
def update_user_by_admin(
    user_id: UUID,
    user_in: UserUpdateAdminDTO,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """(Admin) Editar cualquier usuario (roles, estado, datos)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    update_data = user_in.model_dump(exclude_unset=True)

    # Manejo especial para password
    if "password" in update_data and update_data["password"]:
        hashed = security.get_password_hash(update_data["password"])
        user.hashed_password = hashed
        del update_data["password"]

    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """(Admin) Eliminar un usuario permanentemente."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if user.id == current_user.id:
        raise HTTPException(
            status_code=400, detail="No puedes eliminar tu propia cuenta de admin."
        )

    db.delete(user)
    db.commit()
    return {"message": "Usuario eliminado correctamente"}
