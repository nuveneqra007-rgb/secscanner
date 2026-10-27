import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class ScanCreate(BaseModel):
    target: str
    ports: Optional[str] = "80,443,22,21,23,25,53,110,143,3306,3389,5432,6379,8080,8443"
    scan_ports: bool = True
    scan_http: bool = True
    scan_ssl: bool = True
    scan_fingerprint: bool = True
    scan_malware: bool = True


class PortInfo(BaseModel):
    port: int
    state: str
    service: Optional[str] = None


class HttpHeaderResult(BaseModel):
    header: str
    present: bool
    value: Optional[str] = None


class SslResult(BaseModel):
    valid: bool
    issuer: Optional[str] = None
    subject: Optional[str] = None
    valid_from: Optional[str] = None
    valid_to: Optional[str] = None
    days_remaining: Optional[int] = None
    error: Optional[str] = None


class FingerprintResult(BaseModel):
    server: Optional[str] = None
    technologies: list[str] = []
    raw_headers: dict[str, str] = {}


class MalwareResult(BaseModel):
    scanned: bool
    detected: bool
    positives: Optional[int] = None
    total: Optional[int] = None
    scan_date: Optional[str] = None
    error: Optional[str] = None


class ScanResponse(BaseModel):
    id: int
    target: str
    status: str
    risk_level: Optional[str] = None
    ports: Optional[list[PortInfo]] = None
    http_headers: Optional[list[HttpHeaderResult]] = None
    ssl: Optional[SslResult] = None
    fingerprint: Optional[FingerprintResult] = None
    malware: Optional[MalwareResult] = None
    discovered_assets: Optional[list[str]] = None
    recommendations: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None
    created_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True


class ScanListItem(BaseModel):
    id: int
    target: str
    status: str
    risk_level: Optional[str] = None
    created_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True


class PaginatedScans(BaseModel):
    items: list[ScanListItem]
    total: int
    page: int
    page_size: int


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    username: str
    password: str
