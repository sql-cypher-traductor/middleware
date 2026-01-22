from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ...core import security, database
from ...dto import UserResponseDTO, UserCreateDTO, TokenDTO
from ...models import User

router = APIRouter(prefix="/auth", tags=["Autenticación"])


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
    access_token = security.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
