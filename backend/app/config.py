import os
import secrets
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    # Base de datos — SQLite local por defecto, PostgreSQL en prod
    DATABASE_URL: str = "sqlite:///./data/scans.db"

    # JWT — sin valor por defecto; si no se configura, genera uno aleatorio (solo local)
    SECRET_KEY: str = secrets.token_hex(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # VirusTotal (opcional)
    VIRUSTOTAL_API_KEY: str = ""

    # Modo de escaneo
    SCAN_MODE: str = "local"

    # Usuario admin inicial (solo para modo local)
    AUTH_USERNAME: str = "admin"
    AUTH_PASSWORD: str = "admin123"

    # CORS — en producción poner la URL de Vercel (ej: https://secscanner.vercel.app)
    # En local se permite todo
    ALLOWED_ORIGINS: str = "*"

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def origins_list(self) -> list[str]:
        """Convierte la cadena de orígenes permitidos en lista."""
        if self.ALLOWED_ORIGINS == "*":
            return ["*"]
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]


settings = Settings()
