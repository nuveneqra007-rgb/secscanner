import datetime
import re
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator


# ---- Validadores reutilizables ----

def validate_username(v: str) -> str:
    v = v.strip()
    if len(v) < 3 or len(v) > 30:
        raise ValueError("El usuario debe tener entre 3 y 30 caracteres")
    if not re.match(r'^[a-zA-Z0-9_\-]+$', v):
        raise ValueError("El usuario solo puede contener letras, números, guiones y guiones bajos")
    return v.lower()


def validate_password(v: str) -> str:
    if len(v) < 8:
        raise ValueError("La contraseña debe tener al menos 8 caracteres")
    if not re.search(r'[A-Z]', v):
        raise ValueError("La contraseña debe tener al menos una mayúscula")
    if not re.search(r'[0-9]', v):
        raise ValueError("La contraseña debe tener al menos un número")
    return v


def validate_full_name(v: str) -> str:
    v = v.strip()
    if len(v) < 2 or len(v) > 60:
        raise ValueError("El nombre debe tener entre 2 y 60 caracteres")
    # Bloquear caracteres peligrosos
    if re.search(r'[<>"\';\\]', v):
        raise ValueError("El nombre contiene caracteres no permitidos")
    return v


# ---- Schemas ----

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    password: str

    @field_validator("username")
    @classmethod
    def check_username(cls, v):
        return validate_username(v)

    @field_validator("password")
    @classmethod
    def check_password(cls, v):
        return validate_password(v)

    @field_validator("full_name")
    @classmethod
    def check_full_name(cls, v):
        return validate_full_name(v)


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    is_admin: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

    @field_validator("full_name")
    @classmethod
    def check_full_name(cls, v):
        if v is not None:
            return validate_full_name(v)
        return v

    @field_validator("new_password")
    @classmethod
    def check_new_password(cls, v):
        if v is not None:
            return validate_password(v)
        return v
