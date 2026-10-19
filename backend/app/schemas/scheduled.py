from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ScheduledScanCreate(BaseModel):
    target: str
    interval_hours: int = 24

class ScheduledScanResponse(BaseModel):
    id: int
    target: str
    interval_hours: int
    is_active: bool
    last_run_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
