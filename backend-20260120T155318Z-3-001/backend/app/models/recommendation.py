# backend/app/models/recommendation.py
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db import Base
from datetime import datetime

class GymRecommendation(Base):
    __tablename__ = "gym_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    gym_name = Column(String)
    gym_address = Column(String)
    distance_km = Column(Float, nullable=True)
    score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
