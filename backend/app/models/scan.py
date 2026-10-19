import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON, Text, ForeignKey

from app.database import Base


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    target = Column(String(255), nullable=False)
    status = Column(String(20), default="pending")
    risk_level = Column(String(10), nullable=True)
    ports = Column(JSON, nullable=True)
    http_headers = Column(JSON, nullable=True)
    ssl = Column(JSON, nullable=True)
    fingerprint = Column(JSON, nullable=True)
    malware = Column(JSON, nullable=True)
    discovered_assets = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
