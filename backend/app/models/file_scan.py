import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON, Text, ForeignKey
from app.database import Base

class FileScan(Base):
    __tablename__ = "file_scans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    filename = Column(String(255), nullable=False)
    file_hash = Column(String(64), nullable=False)
    file_size = Column(Integer, nullable=False)
    status = Column(String(20), default="pending")
    risk_level = Column(String(10), nullable=True)
    file_type = Column(String(50), nullable=True)
    metadata_info = Column(JSON, nullable=True)
    malware = Column(JSON, nullable=True)
    apk_info = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
