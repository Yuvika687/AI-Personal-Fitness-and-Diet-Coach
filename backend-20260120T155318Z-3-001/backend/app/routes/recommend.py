# backend/app/routes/recommend.py
from fastapi import APIRouter, Depends, HTTPException
from app.routes.auth import get_current_user
from app.models.user import User
from pydantic import BaseModel
from app.core.recommender import recommend_gyms

router = APIRouter()

class LocIn(BaseModel):
    lat: float
    lon: float
    goal: str | None = ""

@router.post("/gyms")
def gyms(payload: LocIn, user: User = Depends(get_current_user)):
    user_loc = {"lat": payload.lat, "lon": payload.lon}
    recs = recommend_gyms(user_loc, payload.goal or "")
    return {"recommendations": recs}
