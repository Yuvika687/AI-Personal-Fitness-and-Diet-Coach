from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from backend.app.db import Base


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exercise_name = Column(String, nullable=False)
    reps = Column(Integer)
    sets = Column(Integer)
    avg_form_score = Column(Float)
    calories_estimated = Column(Float)
    started_at = Column(DateTime)
    ended_at = Column(DateTime)

    user = relationship("User", back_populates="workout_sessions")
