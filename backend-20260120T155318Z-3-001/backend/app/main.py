# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# In main.py, add this after imports
from app.db import init_db
init_db()

# Import routers - Use the exact filenames you have
from app.routes.auth import router as auth_router
from app.routes.diet import router as diet_router
from app.routes.chat import router as chat_router
from app.routes.tracking import router as tracking_router
from app.routes.performance import router as performance_router
from app.routes.recommend import router as recommend_router

# IMPORTANT: Try to import workouts router directly
try:
    # Try importing workouts (if you have workouts.py)
    from app.routes.workouts import router as workouts_router
    has_workouts = True
except ImportError:
    # If workouts.py doesn't exist, try workout.py
    try:
        from app.routes.workout import router as workouts_router
        has_workouts = True
    except ImportError:
        has_workouts = False
        workouts_router = None
        print("⚠️ Warning: Workouts router not found")

app = FastAPI(
    title="AI Gym Assistant", 
    version="1.0.0",
    description="AI-powered fitness ecosystem"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Include ALL routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(diet_router, prefix="/diet", tags=["Diet"])
app.include_router(chat_router, prefix="/chat", tags=["Chat"])
app.include_router(tracking_router, prefix="/tracking", tags=["Tracking"])
app.include_router(performance_router, prefix="/performance", tags=["Performance"])
app.include_router(recommend_router, prefix="/recommend", tags=["Recommendation"])

# ✅ Include workouts if available
if has_workouts and workouts_router:
    app.include_router(workouts_router, prefix="/workouts", tags=["Workouts"])
    print("✅ Workouts router loaded")
else:
    print("❌ Workouts router not loaded")

@app.get("/")
async def root():
    return {"message": "AI Gym Assistant API is working!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Test all endpoints
@app.get("/test-all")
async def test_all():
    endpoints = {
        "auth": "/auth/login, /auth/register, /auth/me",
        "diet": "/diet/generate-plan, /diet/bmi",
        "workouts": "/workouts/start-session, /workouts/my-workouts, /workouts/exercise-suggestions",
        "chat": "/chat/ask",
        "tracking": "/tracking/log, /tracking/history, /tracking/predict, /tracking/summary",
        "performance": "/performance/history",
        "recommend": "/recommend/gyms"
    }
    return {"endpoints": endpoints, "status": "Check which endpoints are working"}