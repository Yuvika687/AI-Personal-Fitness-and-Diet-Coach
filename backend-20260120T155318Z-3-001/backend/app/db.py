# backend/app/db.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Use SQLite for now (easier to setup)
DATABASE_URL = "sqlite:///./ai_gym.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ⚠️ ADD THIS FUNCTION TO INITIALIZE DATABASE ⚠️
def init_db():
    # Import all models here so they are registered with SQLAlchemy
    import app.models.user
    import app.models.workout
    import app.models.habit
    import app.models.performance
    import app.models.recommendation
    
    print("🔄 Initializing database...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized!")