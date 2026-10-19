import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base, SessionLocal
from app.routers import auth, scans, file_scans, scheduled
from app.models.user import User
from app.config import settings
from app.auth import get_password_hash
from app.scheduler import start_scheduler, stop_scheduler
from app.middleware.rate_limiter import RateLimitMiddleware
from app.middleware.security import SecurityHeadersMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs("data", exist_ok=True)
    os.makedirs("data/uploads", exist_ok=True)
    Base.metadata.create_all(bind=engine)

    # Crear usuario admin inicial si no existe
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == settings.AUTH_USERNAME).first()
        if not admin:
            hashed = get_password_hash(settings.AUTH_PASSWORD)
            new_admin = User(
                username=settings.AUTH_USERNAME,
                email=f"{settings.AUTH_USERNAME}@secscanner.local",
                full_name="Administrador",
                hashed_password=hashed,
                is_admin=True,
            )
            db.add(new_admin)
            db.commit()
    finally:
        db.close()

    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(title="SecScanner API", version="2.0.0", lifespan=lifespan)

# Middlewares de seguridad (orden importa: primero CORS, luego los custom)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(scans.router)
app.include_router(file_scans.router)
app.include_router(scheduled.router)


@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0"}
