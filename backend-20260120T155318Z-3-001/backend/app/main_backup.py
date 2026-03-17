from fastapi import FastAPI
from backend.app.db import Base, engine

# Routers
from backend.app.api.v1.routes_auth import router as auth_router
from backend.app.api.v1.routes_diet import router as diet_router

# Import models so SQLAlchemy detects them
from backend.app.models.user import User
from backend.app.models.workout_session import WorkoutSession

app = FastAPI(title="AI Gym Assistant API")


@app.on_event("startup")
def startup_event():
    print("📌 Creating database tables (if not exist)...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database ready.")


@app.get("/")
def home():
    return {"message": "API Running 🚀"}


# Register API Routers
app.include_router(auth_router)
app.include_router(diet_router)  # ⬅ ADD THIS LINE
