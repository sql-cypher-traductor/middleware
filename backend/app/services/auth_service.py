from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..core.security import hash_password, verify_password, create_access_token
from ..dto.user_dto import UserCreateDTO, LoginDTO, AuthResultDTO, UserResponseDTO
from ..models.user import User
from ..repositories.user_repository import UserRepository


class AuthService:
    """
    Servicio de autenticación para registro y login de usuarios.
    """

    def __init__(self, db: Session):
        self.user_repository = UserRepository(db)

    def register(self, user_data: UserCreateDTO) -> User:
        """
        Registra un nuevo usuario en el sistema.

        Args:
            user_data: Datos del usuario a registrar.

        Returns:
            Usuario registrado.

        Raises:
            HTTPException: Si el email ya está registrado.
        """
        # Verificar si el email ya existe
        existing_user = self.user_repository.get_by_email(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está registrado",
            )

        # Hashear la contraseña
        hashed_password = hash_password(user_data.password)

        # Crear el usuario
        new_user = User(
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            email=str(user_data.email),
            password=hashed_password,
        )

        return self.user_repository.create(new_user)

    def login(self, login_data: LoginDTO) -> AuthResultDTO:
        """
        Autentica un usuario y genera un token JWT.

        Args:
            login_data: Credenciales del usuario (email y password).

        Returns:
            AuthResultDTO con el access_token y datos del usuario.

        Raises:
            HTTPException: Si las credenciales son inválidas.
        """
        # Buscar usuario por email
        user = self.user_repository.get_by_email(login_data.email)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Verificar contraseña
        if not verify_password(login_data.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Verificar si el usuario está activo
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario inactivo",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Actualizar último login
        user.last_login = datetime.now(timezone.utc)
        self.user_repository.update(user)

        # Crear token JWT
        token_data = {
            "sub": str(user.user_id),
            "email": user.email,
            "role": user.role.value,
        }
        access_token = create_access_token(data=token_data)

        return AuthResultDTO(
            access_token=access_token,
            user=UserResponseDTO.model_validate(user),
        )

