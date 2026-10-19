import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session

from app.auth import create_access_token, verify_password, get_password_hash, get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.scan import LoginRequest, Token
from app.schemas.user import RegisterRequest, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])

LOCK_MINUTES = 15
MAX_ATTEMPTS = 5


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """Registro de nuevo usuario con validaciones de seguridad."""
    # Verificar unicidad de username y email (mensaje genérico para no revelar qué existe)
    existing = db.query(User).filter(
        (User.username == body.username) | (User.email == body.email)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El nombre de usuario o email ya está en uso",
        )

    hashed = get_password_hash(body.password)
    user = User(
        username=body.username,
        email=body.email,
        full_name=body.full_name,
        hashed_password=hashed,
        is_admin=False,
        created_at=datetime.datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """Login con protección contra fuerza bruta."""
    # Buscar por username O email (más cómodo para el usuario)
    user = db.query(User).filter(
        (User.username == body.username) | (User.email == body.username)
    ).first()

    # Mensaje genérico para no revelar si el usuario existe
    invalid_creds = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas",
    )

    if not user:
        raise invalid_creds

    # Verificar si la cuenta está bloqueada
    if user.locked_until and datetime.datetime.utcnow() < user.locked_until:
        minutes_left = int((user.locked_until - datetime.datetime.utcnow()).total_seconds() / 60) + 1
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cuenta bloqueada temporalmente. Intenta en {minutes_left} minuto(s).",
        )

    if not verify_password(body.password, user.hashed_password):
        # Incrementar contador de fallos
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= MAX_ATTEMPTS:
            user.locked_until = datetime.datetime.utcnow() + datetime.timedelta(minutes=LOCK_MINUTES)
            user.failed_login_attempts = 0
        db.commit()
        raise invalid_creds

    # Login exitoso: resetear contadores
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    token = create_access_token(data={"sub": user.username})
    return Token(access_token=token)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Devuelve el perfil del usuario autenticado."""
    return current_user
