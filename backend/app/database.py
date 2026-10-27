from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings


def _build_url(url: str) -> str:
    """
    Fuerza el uso de psycopg2 para URLs de PostgreSQL.
    SQLAlchemy 2.x prefiere psycopg (v3) por defecto, pero usamos psycopg2-binary.
    """
    if url.startswith("postgresql://") or url.startswith("postgres://"):
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
        url = url.replace("postgres://", "postgresql+psycopg2://", 1)
    return url


_url = _build_url(settings.DATABASE_URL)

engine = create_engine(
    _url,
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
