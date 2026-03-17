# backend/app/models/performance.py
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db import Base
from datetime import datetime

class PerformanceScore(Base):
    __tablename__ = "performance_scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id = Column(Integer, nullable=True)
    exercise_name = Column(String, nullable=True)
    reps = Column(Integer, default=0)
    duration_sec = Column(Integer, default=0)
    form_score = Column(Float, default=0.0)  # 0-100
    overall_score = Column(Float, default=0.0) # 0-100
    recorded_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="performances")
