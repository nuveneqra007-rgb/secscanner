from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.auth import get_optional_user, get_current_user
from app.database import get_db
from app.models.scan import Scan
from app.models.user import User
from app.schemas.scan import (
    ScanCreate,
    ScanResponse,
    ScanListItem,
    PaginatedScans,
    PortInfo,
    HttpHeaderResult,
    SslResult,
    FingerprintResult,
    MalwareResult,
)
from app.tasks.scan_runner import run_scan

router = APIRouter(prefix="/scans", tags=["scans"])


@router.post("", response_model=ScanResponse, status_code=status.HTTP_201_CREATED)
def create_scan(
    body: ScanCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Escaneo público: funciona sin autenticación.
    Si el usuario está autenticado, el escaneo se guarda en su historial.
    Si no, se ejecuta y devuelve el resultado sin guardarlo en DB.
    """
    target = body.target.strip().lower()
    target = target.replace("https://", "").replace("http://", "").split("/")[0]

    if not target:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El objetivo proporcionado no es válido",
        )

    # Crear el escaneo en DB (para autenticados y modo guest por igual,
    # pero user_id solo se setea si hay usuario)
    scan = Scan(
        target=target,
        status="pending",
        user_id=current_user.id if current_user else None,
        created_at=datetime.utcnow(),
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    background_tasks.add_task(run_scan, scan.id)

    return _scan_to_response(scan)


@router.get("", response_model=PaginatedScans)
def list_scans(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Solo usuarios autenticados pueden ver su historial."""
    query = (
        db.query(Scan)
        .filter(Scan.user_id == current_user.id)
        .order_by(Scan.created_at.desc())
    )
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedScans(
        items=[ScanListItem.model_validate(s) for s in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/stats")
def get_scan_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Estadísticas de los últimos 30 días del usuario autenticado."""
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    scans = (
        db.query(Scan.created_at, Scan.risk_level)
        .filter(
            Scan.user_id == current_user.id,
            Scan.created_at >= thirty_days_ago,
            Scan.status == "completed",
        )
        .all()
    )

    stats_map = {}
    for i in range(30):
        d = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
        stats_map[d] = {"date": d, "high": 0, "medium": 0, "low": 0, "perfect": 0}

    for created_at, risk in scans:
        if not risk:
            continue
        d = created_at.strftime("%Y-%m-%d")
        if d in stats_map and risk in stats_map[d]:
            stats_map[d][risk] += 1

    return sorted(list(stats_map.values()), key=lambda x: x["date"])


@router.get("/{scan_id}", response_model=ScanResponse)
def get_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Ver un escaneo por ID.
    - Si autenticado: solo puede ver sus propios escaneos.
    - Si invitado: solo puede ver escaneos sin user_id (temporales).
    """
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escaneo no encontrado")

    if current_user:
        if scan.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    else:
        if scan.user_id is not None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")

    return _scan_to_response(scan)


@router.delete("/{scan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Solo el propietario puede eliminar su escaneo."""
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.user_id == current_user.id).first()
    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escaneo no encontrado")
    db.delete(scan)
    db.commit()


def _scan_to_response(scan: Scan) -> ScanResponse:
    ports = [PortInfo(**p) for p in scan.ports] if scan.ports else None
    http_headers = [HttpHeaderResult(**h) for h in scan.http_headers] if scan.http_headers else None
    ssl_data = SslResult(**scan.ssl) if scan.ssl else None
    fp_data = FingerprintResult(**scan.fingerprint) if scan.fingerprint else None
    mw_data = MalwareResult(**scan.malware) if scan.malware else None

    return ScanResponse(
        id=scan.id,
        target=scan.target,
        status=scan.status,
        risk_level=scan.risk_level,
        ports=ports,
        http_headers=http_headers,
        ssl=ssl_data,
        fingerprint=fp_data,
        malware=mw_data,
        discovered_assets=scan.discovered_assets,
        recommendations=scan.recommendations,
        error=scan.error,
        created_at=scan.created_at,
        completed_at=scan.completed_at,
    )
