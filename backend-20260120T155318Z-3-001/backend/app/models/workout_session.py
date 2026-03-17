# backend/app/models/workout.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.db import Base
from datetime import datetime

class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exercise_name = Column(String, nullable=False)
    reps = Column(Integer, nullable=True)
    sets = Column(Integer, nullable=True)
    weight_kg = Column(Float, nullable=True)  # ADD THIS
    duration_min = Column(Integer, nullable=True)  # ADD THIS
    avg_form_score = Column(Float, nullable=True)
    calories_estimated = Column(Float, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    
    user = relationship("User", back_populates="workout_sessions")