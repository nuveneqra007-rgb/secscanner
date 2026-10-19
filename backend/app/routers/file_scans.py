import datetime
import hashlib
import os
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks, UploadFile, File
from sqlalchemy.orm import Session

from app.auth import get_optional_user, get_current_user
from app.database import get_db
from app.models.file_scan import FileScan
from app.models.user import User
from app.schemas.file_scan import (
    FileScanResponse,
    FileScanListItem,
    PaginatedFileScans,
    ApkInfoResult,
    MalwareResult,
)
from app.tasks.file_scan_runner import run_file_scan

router = APIRouter(prefix="/file-scans", tags=["file-scans"])

UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("", response_model=FileScanResponse, status_code=status.HTTP_201_CREATED)
async def create_file_scan(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Escaneo de archivo público. Guardado en historial solo si hay sesión activa."""
    file_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
    safe_filename = f"{file_id}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    file_content = await file.read()
    file_size = len(file_content)
    file_hash = hashlib.sha256(file_content).hexdigest()

    with open(file_path, "wb") as f:
        f.write(file_content)

    scan = FileScan(
        filename=file.filename or "unknown",
        file_hash=file_hash,
        file_size=file_size,
        status="pending",
        user_id=current_user.id if current_user else None,
        created_at=datetime.datetime.utcnow(),
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    background_tasks.add_task(run_file_scan, scan.id, file_path)

    return _scan_to_response(scan)


@router.get("", response_model=PaginatedFileScans)
def list_file_scans(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Solo el usuario autenticado ve sus propios escaneos de archivos."""
    query = (
        db.query(FileScan)
        .filter(FileScan.user_id == current_user.id)
        .order_by(FileScan.created_at.desc())
    )
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedFileScans(
        items=[FileScanListItem.model_validate(s) for s in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{scan_id}", response_model=FileScanResponse)
def get_file_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    scan = db.query(FileScan).filter(FileScan.id == scan_id).first()
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
def delete_file_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scan = db.query(FileScan).filter(FileScan.id == scan_id, FileScan.user_id == current_user.id).first()
    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escaneo no encontrado")
    db.delete(scan)
    db.commit()


def _scan_to_response(scan: FileScan) -> FileScanResponse:
    mw_data = MalwareResult(**scan.malware) if scan.malware else None
    apk_data = ApkInfoResult(**scan.apk_info) if scan.apk_info else None

    return FileScanResponse(
        id=scan.id,
        filename=scan.filename,
        file_hash=scan.file_hash,
        file_size=scan.file_size,
        status=scan.status,
        risk_level=scan.risk_level,
        file_type=scan.file_type,
        metadata_info=scan.metadata_info,
        malware=mw_data,
        apk_info=apk_data,
        recommendations=scan.recommendations,
        error=scan.error,
        created_at=scan.created_at,
        completed_at=scan.completed_at,
    )
