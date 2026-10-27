import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey

from app.database import Base

class ScheduledScan(Base):
    __tablename__ = "scheduled_scans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    target = Column(String, index=True, nullable=False)
    interval_hours = Column(Integer, nullable=False, default=24)
    is_active = Column(Boolean, default=True)
    last_run_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
