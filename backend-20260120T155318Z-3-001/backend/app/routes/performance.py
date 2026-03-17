# backend/app/routes/performance.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.routes.auth import get_current_user
from app.models.user import User
from app.models.performance import PerformanceScore
from app.core.performance_analyzer import compute_form_score, compute_overall_score
from pydantic import BaseModel

router = APIRouter()

class PerfIn(BaseModel):
    exercise_name: str
    reps: int
    duration_sec: int
    keypoint_metrics: dict = {}

@router.post("/report")
def report_performance(payload: PerfIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    form_score = compute_form_score(payload.keypoint_metrics)
    overall = compute_overall_score(payload.reps, payload.duration_sec, form_score)
    rec = PerformanceScore(user_id=user.id, exercise_name=payload.exercise_name, reps=payload.reps, duration_sec=payload.duration_sec, form_score=form_score, overall_score=overall)
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return {"ok": True, "score": overall, "form_score": form_score}

@router.get("/history")
def get_history(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.query(PerformanceScore).filter(PerformanceScore.user_id==user.id).order_by(PerformanceScore.recorded_at.desc()).limit(50).all()
    return [{"exercise": r.exercise_name, "reps": r.reps, "duration": r.duration_sec, "form": r.form_score, "overall": r.overall_score, "date": r.recorded_at} for r in rows]
