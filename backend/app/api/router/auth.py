from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ...core import security, database
from ...dto import (
    UserResponseDTO,
    UserCreateDTO,
    TokenDTO,
    PasswordResetConfirmDTO,
    PasswordResetRequestDTO,
)
from ...models import User

router = APIRouter(tags=["Autenticación"])


@router.post("/register", response_model=UserResponseDTO)
def register(user: UserCreateDTO, db: Session = Depends(database.get_db)):
    """Registra un nuevo usuario en el sistema."""
    # Verificar si existe un usuario registrado con el mismo email
    db_user = db.query(User).filter(User.email == str(user.email)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    # Crear usuario y hashear contraseña
    hashed_pwd = security.get_password_hash(user.password)
    new_user = User(
        email=str(user.email), hashed_password=hashed_pwd, full_name=user.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=TokenDTO)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db),
):
    """Inicio de sesión de usuario"""
    # Validación de usuario y contraseña
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not security.verify_password(
        form_data.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generación de Token JWT
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)

    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/forgot-password")
def forgot_password(
    request: PasswordResetRequestDTO, db: Session = Depends(database.get_db)
):
    """
    Genera un token de recuperación y simula el envío de correo.
    """
    user = db.query(User).filter(User.email == str(request.email)).first()
    if not user:
        # Por seguridad, no indicamos si el correo no existe, pero retornamos éxito.
        return {"message": "Si el correo existe, se enviarán las instrucciones."}

    # 1. Generar token
    token = security.create_password_reset_token(user.email)

    # 2. Simulación de envío de correo (Imprimir en consola del Backend)
    # En producción, aquí usarías fastapi-mail o smtplib
    reset_link = f"http://localhost:3000/reset-password?token={token}"

    print("\n" + "=" * 50)
    print(f"EMAIL SIMULADO PARA: {user.email}")
    print(f"LINK DE RECUPERACIÓN: {reset_link}")
    print("=" * 50 + "\n")

    return {"message": "Si el correo existe, se enviarán las instrucciones."}


@router.post("/reset-password")
def reset_password(
    data: PasswordResetConfirmDTO, db: Session = Depends(database.get_db)
):
    """
    Restablece la contraseña usando un token válido.
    """
    # 1. Verificar token
    email = security.verify_reset_token(data.token)
    if not email:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")

    # 2. Buscar usuario
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # 3. Actualizar contraseña
    user.hashed_password = security.get_password_hash(data.new_password)
    db.commit()

    return {"message": "Contraseña actualizada correctamente"}
