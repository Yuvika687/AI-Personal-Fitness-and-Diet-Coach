# backend/app/routes/tracking.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.routes.auth import get_current_user
from app.models.user import User
from app.models.habit import HabitTracker
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Optional
import random

router = APIRouter(prefix="/tracking", tags=["Habit Tracking"])

class HabitEntry(BaseModel):
    workouts: int
    water: float
    steps: int

class HabitLogResponse(BaseModel):
    message: str
    log_id: int
    date: str
    workouts: int
    water: float
    steps: int

@router.post("/log", response_model=HabitLogResponse)
async def log_daily_habits(
    entry: HabitEntry, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save daily habit log to database"""
    
    # Check if log already exists for today
    today = datetime.utcnow().date()
    existing_log = db.query(HabitTracker).filter(
        HabitTracker.user_id == current_user.id,
        HabitTracker.date >= today,
        HabitTracker.date < today + timedelta(days=1)
    ).first()
    
    if existing_log:
        # Update existing log
        existing_log.workouts = entry.workouts
        existing_log.water = entry.water
        existing_log.steps = entry.steps
        existing_log.did_workout = entry.workouts > 0
        existing_log.adherence_score = calculate_adherence_score(entry)
    else:
        # Create new log
        habit_log = HabitTracker(
            user_id=current_user.id,
            workouts=entry.workouts,
            water=entry.water,
            steps=entry.steps,
            did_workout=entry.workouts > 0,
            adherence_score=calculate_adherence_score(entry),
            date=datetime.utcnow()
        )
        db.add(habit_log)
    
    db.commit()
    
    if existing_log:
        db.refresh(existing_log)
        log_id = existing_log.id
    else:
        db.refresh(habit_log)
        log_id = habit_log.id
    
    return {
        "message": "Log saved successfully!",
        "log_id": log_id,
        "date": datetime.utcnow().isoformat(),
        "workouts": entry.workouts,
        "water": entry.water,
        "steps": entry.steps
    }

def calculate_adherence_score(entry):
    """Calculate adherence score (0-100) based on habits"""
    score = 0
    
    # Workouts: 40 points max
    if entry.workouts >= 1:
        score += min(40, entry.workouts * 10)
    
    # Water: 30 points max
    if entry.water >= 2.0:
        score += min(30, (entry.water / 3.0) * 30)
    
    # Steps: 30 points max
    if entry.steps >= 5000:
        score += min(30, (entry.steps / 10000) * 30)
    
    return min(100, score)

@router.get("/history")
async def get_habit_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's habit history (last 30 days)"""
    
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    history = db.query(HabitTracker).filter(
        HabitTracker.user_id == current_user.id,
        HabitTracker.date >= thirty_days_ago
    ).order_by(HabitTracker.date.desc()).all()
    
    if not history:
        # Return empty array instead of mock data
        return []
    
    return [
        {
            "id": log.id,
            "date": log.date.isoformat() if log.date else None,
            "workouts": log.workouts or 0,
            "water": log.water or 0,
            "steps": log.steps or 0,
            "did_workout": log.did_workout or False,
            "adherence_score": log.adherence_score or 0
        }
        for log in history
    ]

@router.get("/predict")
async def predict_next_week(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate AI-powered predictions for next week"""
    
    # Get last 7 days of data
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    history = db.query(HabitTracker).filter(
        HabitTracker.user_id == current_user.id,
        HabitTracker.date >= seven_days_ago
    ).order_by(HabitTracker.date.desc()).all()
    
    if not history:
        # No history - return basic recommendations
        return {
            "prediction": "No historical data found. Start logging your habits to get personalized predictions!",
            "recommendations": [
                "Aim for 3-4 workouts per week",
                "Drink 2-3 liters of water daily",
                "Target 7,000+ steps daily"
            ],
            "confidence": "low"
        }
    
    # Calculate averages
    total_workouts = sum(log.workouts or 0 for log in history)
    total_water = sum(log.water or 0 for log in history)
    total_steps = sum(log.steps or 0 for log in history)
    
    avg_workouts = total_workouts / len(history) if history else 0
    avg_water = total_water / len(history) if history else 0
    avg_steps = total_steps / len(history) if history else 0
    
    # Generate predictions based on trends
    predictions = []
    
    if avg_workouts >= 1:
        predictions.append(f"Maintain {avg_workouts:.1f} workouts per day. Great consistency!")
    else:
        predictions.append("Try to add at least 1 workout every other day.")
    
    if avg_water >= 2.0:
        predictions.append(f"Keep drinking {avg_water:.1f}L water daily. Hydration is key!")
    else:
        predictions.append(f"Aim for 2-3L water daily (currently {avg_water:.1f}L).")
    
    if avg_steps >= 7000:
        predictions.append(f"Excellent step count! Maintain {avg_steps:,.0f} steps daily.")
    elif avg_steps >= 5000:
        predictions.append(f"Good activity! Try to reach 7,000 steps (currently {avg_steps:,.0f}).")
    else:
        predictions.append(f"Add a 30-minute walk to reach 7,000 steps (currently {avg_steps:,.0f}).")
    
    # Calculate trend
    if len(history) >= 3:
        recent_workouts = [log.workouts or 0 for log in history[:3]]
        trend = "improving" if recent_workouts[0] >= recent_workouts[-1] else "declining"
    else:
        trend = "starting"
    
    return {
        "prediction": " ".join(predictions),
        "basis": f"Based on your last {len(history)} days",
        "trend": trend,
        "averages": {
            "workouts_per_day": round(avg_workouts, 1),
            "water_liters": round(avg_water, 1),
            "steps": int(avg_steps)
        },
        "confidence": "high" if len(history) >= 5 else "medium"
    }

@router.get("/summary")
async def get_habit_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get habit summary (streak, adherence, etc.)"""
    
    # Get last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    history = db.query(HabitTracker).filter(
        HabitTracker.user_id == current_user.id,
        HabitTracker.date >= thirty_days_ago
    ).order_by(HabitTracker.date.desc()).all()
    
    # Calculate streak
    streak = 0
    current_date = datetime.utcnow().date()
    
    for log in history:
        log_date = log.date.date() if log.date else None
        if log_date == current_date - timedelta(days=streak) and log.did_workout:
            streak += 1
        else:
            break
    
    # Calculate adherence (percentage of days with at least 1 workout)
    workout_days = sum(1 for log in history if log.did_workout)
    adherence = (workout_days / len(history) * 100) if history else 0
    
    # Calculate skip probability (simple heuristic)
    skip_probability = max(0, min(100, 100 - adherence)) / 100
    
    return {
        "streak": streak,
        "adherence": round(adherence, 1),
        "skip_probability": round(skip_probability, 2),
        "total_workouts": sum(log.workouts or 0 for log in history),
        "total_days": len(history),
        "recent": [
            {
                "date": log.date.isoformat() if log.date else None,
                "did_workout": log.did_workout or False,
                "workouts": log.workouts or 0,
                "water": log.water or 0,
                "steps": log.steps or 0
            }
            for log in history[:5]  # Last 5 entries
        ]
    }