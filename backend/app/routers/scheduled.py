from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.auth import get_current_user
from app.database import get_db
from app.models.scheduled_scan import ScheduledScan
from app.models.user import User
from app.schemas.scheduled import ScheduledScanCreate, ScheduledScanResponse

router = APIRouter(prefix="/scheduled-scans", tags=["scheduled"])


@router.post("", response_model=ScheduledScanResponse)
def create_schedule(
    body: ScheduledScanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crea un escaneo programado. Siempre requiere autenticación."""
    scan = ScheduledScan(
        target=body.target,
        interval_hours=body.interval_hours,
        user_id=current_user.id,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan


@router.get("", response_model=List[ScheduledScanResponse])
def get_schedules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Devuelve solo los escaneos programados del usuario autenticado."""
    return (
        db.query(ScheduledScan)
        .filter(ScheduledScan.user_id == current_user.id)
        .order_by(ScheduledScan.created_at.desc())
        .all()
    )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scan = db.query(ScheduledScan).filter(
        ScheduledScan.id == id,
        ScheduledScan.user_id == current_user.id,
    ).first()
    if not scan:
        raise HTTPException(status_code=404)
    db.delete(scan)
    db.commit()


@router.patch("/{id}/toggle", response_model=ScheduledScanResponse)
def toggle_schedule(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scan = db.query(ScheduledScan).filter(
        ScheduledScan.id == id,
        ScheduledScan.user_id == current_user.id,
    ).first()
    if not scan:
        raise HTTPException(status_code=404)
    scan.is_active = not scan.is_active
    db.commit()
    db.refresh(scan)
    return scan
