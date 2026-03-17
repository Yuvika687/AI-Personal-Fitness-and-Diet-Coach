# backend/app/models/habit.py
from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db import Base
from datetime import datetime

class HabitTracker(Base):
    __tablename__ = "habit_tracker"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow, index=True)
    workouts = Column(Integer, default=0)
    water = Column(Float, default=0.0)  # in liters
    steps = Column(Integer, default=0)
    did_workout = Column(Boolean, default=False)
    adherence_score = Column(Float, default=0.0)  # 0-100
    notes = Column(String, nullable=True)
    
    user = relationship("User", back_populates="habits")