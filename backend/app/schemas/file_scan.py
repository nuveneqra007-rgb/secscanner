import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class FileScanBase(BaseModel):
    filename: str
    file_hash: str
    file_size: int

class FileScanCreate(FileScanBase):
    pass

class ApkInfoResult(BaseModel):
    package_name: Optional[str] = None
    permissions: List[str] = []
    activities: List[str] = []
    services: List[str] = []

class MalwareResult(BaseModel):
    scanned: bool
    detected: bool
    positives: Optional[int] = None
    total: Optional[int] = None
    scan_date: Optional[str] = None
    error: Optional[str] = None

class FileScanResponse(FileScanBase):
    id: int
    status: str
    risk_level: Optional[str] = None
    file_type: Optional[str] = None
    metadata_info: Optional[Dict[str, Any]] = None
    malware: Optional[MalwareResult] = None
    apk_info: Optional[ApkInfoResult] = None
    recommendations: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None
    created_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True}

class FileScanListItem(BaseModel):
    id: int
    filename: str
    status: str
    risk_level: Optional[str] = None
    created_at: datetime.datetime

    model_config = {"from_attributes": True}

class PaginatedFileScans(BaseModel):
    items: List[FileScanListItem]
    total: int
    page: int
    page_size: int
