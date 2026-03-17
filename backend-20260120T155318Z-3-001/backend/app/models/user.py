from sqlalchemy import Column, Integer, String, Float, Boolean
from sqlalchemy.orm import relationship
from app.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(String, default="user")
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    activity_level = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
  
    performances = relationship("PerformanceScore", back_populates="user")
    # backend/app/models/user.py - Add this line
    habits = relationship("HabitTracker", back_populates="user")
    # backend/app/models/user.py - Add this line
    workout_sessions = relationship("WorkoutSession", back_populates="user")