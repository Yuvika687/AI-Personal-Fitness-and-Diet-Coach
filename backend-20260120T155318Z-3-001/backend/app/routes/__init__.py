# backend/app/routes/__init__.py
from .auth import router as auth_router
from .diet import router as diet_router
from .chat import router as chat_router
from .tracking import router as tracking_router
from .performance import router as performance_router
from .recommend import router as recommend_router

# Try to import workouts
try:
    from .workouts import router as workouts_router
except ImportError:
    try:
        from .workout import router as workouts_router
    except ImportError:
        workouts_router = None

__all__ = [
    "auth_router",
    "diet_router", 
    "chat_router",
    "tracking_router",
    "performance_router",
    "recommend_router",
    "workouts_router"
]