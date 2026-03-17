import sys
import os

# Add the app directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from db import engine, Base
from models.user import User
from models.workout import WorkoutSession
from models.habit import HabitTracker
from models.performance import PerformanceScore
from models.recommendation import GymRecommendation

def create_tables():
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")

if __name__ == "__main__":
    create_tables()