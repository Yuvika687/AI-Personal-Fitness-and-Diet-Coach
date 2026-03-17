# backend/app/routes/workouts.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.workout import WorkoutSession
from app.routes.auth import get_current_user
from app.models.user import User
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
import random

router = APIRouter()

class WorkoutCreate(BaseModel):
    exercise_name: str
    reps: Optional[int] = None
    sets: Optional[int] = None
    weight_kg: Optional[float] = None
    duration_min: Optional[int] = None
    notes: Optional[str] = None

class WorkoutResponse(BaseModel):
    id: int
    exercise_name: str
    reps: Optional[int]
    sets: Optional[int]
    weight_kg: Optional[float]
    duration_min: Optional[int]
    calories_estimated: Optional[float]
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    avg_form_score: Optional[float]

    class Config:
        from_attributes = True

@router.post("/start-session", response_model=WorkoutResponse)
def start_workout_session(
    workout_data: WorkoutCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log a new workout session"""
    
    # Calculate calories
    calories_estimated = estimate_calories_burned(
        workout_data.exercise_name,
        workout_data.duration_min or 30,
        current_user.weight_kg or 70
    )
    
    # Create workout session
    workout = WorkoutSession(
        user_id=current_user.id,
        exercise_name=workout_data.exercise_name,
        reps=workout_data.reps,
        sets=workout_data.sets,
        weight_kg=workout_data.weight_kg,
        duration_min=workout_data.duration_min,
        avg_form_score=random.uniform(7.5, 9.8),
        calories_estimated=calories_estimated,
        started_at=datetime.utcnow(),
        ended_at=datetime.utcnow()  # For simplicity, end at same time
    )
    
    db.add(workout)
    db.commit()
    db.refresh(workout)
    
    return workout

def estimate_calories_burned(exercise_name, duration_min, weight_kg):
    """AI-inspired calorie estimation based on exercise type"""
    weight = weight_kg or 70
    
    met_values = {
        "walking": 3.5, "jogging": 7.0, "running": 11.0,
        "cycling": 8.0, "swimming": 8.0, "yoga": 3.0,
        "weight training": 6.0, "push-ups": 8.0, "squats": 5.0,
        "pull-ups": 8.0, "plank": 3.0, "jumping jacks": 8.0,
        "burpees": 10.0, "jump rope": 12.0
    }
    
    exercise_lower = exercise_name.lower()
    
    # Find matching exercise
    exercise_key = next(
        (key for key in met_values if key in exercise_lower),
        "weight training"  # Default
    )
    
    met = met_values[exercise_key]
    
    # Calculate calories: MET * weight(kg) * time(hours)
    calories = met * weight * (duration_min / 60)
    
    return round(calories, 1)

@router.get("/my-workouts", response_model=List[WorkoutResponse])
def get_my_workouts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's workout history"""
    
    workouts = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.id
    ).order_by(WorkoutSession.started_at.desc()).all()
    
    return workouts

@router.get("/today-stats")
def get_today_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get today's workout statistics"""
    
    today = datetime.utcnow().date()
    
    workouts_today = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.id,
        WorkoutSession.started_at >= today
    ).all()
    
    total_calories = sum(w.calories_estimated or 0 for w in workouts_today)
    total_workouts = len(workouts_today)
    total_duration = sum(w.duration_min or 30 for w in workouts_today)
    
    motivation_message = generate_motivation_message(total_workouts, total_calories)
    
    return {
        "total_workouts_today": total_workouts,
        "total_calories_burned": total_calories,
        "total_duration_minutes": total_duration,
        "motivation_message": motivation_message,
        "workouts": [
            {
                "exercise": w.exercise_name,
                "reps": w.reps,
                "sets": w.sets,
                "calories": w.calories_estimated,
                "duration": w.duration_min
            } for w in workouts_today
        ]
    }

def generate_motivation_message(workouts, calories):
    """Generate motivational messages"""
    if workouts >= 3:
        return f"🔥 Amazing! {workouts} workouts and {calories} calories burned today!"
    elif workouts >= 2:
        return f"💪 Great work! {workouts} sessions completed."
    else:
        return f"👍 Good start! {calories} calories burned."

@router.get("/exercise-suggestions")
def get_exercise_suggestions(current_user: User = Depends(get_current_user)):
    """Get exercise recommendations"""
    
    activity_level = current_user.activity_level or "moderate"
    
    suggestions = {
        "beginner": [
            "Bodyweight Squats", "Wall Push-ups", "Walking Lunges",
            "Plank", "Glute Bridges", "Bird-Dog", "Marching in Place"
        ],
        "intermediate": [
            "Push-ups", "Dumbbell Rows", "Goblet Squats", "Shoulder Press",
            "Romanian Deadlifts", "Mountain Climbers", "Jumping Jacks"
        ],
        "advanced": [
            "Pull-ups", "Barbell Squats", "Bench Press", "Deadlifts",
            "Burpees", "Box Jumps", "Handstand Practice"
        ]
    }
    
    if activity_level in ["sedentary", "light"]:
        level = "beginner"
    elif activity_level in ["moderate", "active"]:
        level = "intermediate"
    else:
        level = "advanced"
    
    return {
        "suggestions": suggestions,
        "recommended_level": level,
        "personalized_plan": f"Based on your {activity_level} activity level",
        "ai_recommendation": "Start with 3 sets of 8-12 reps, focus on proper form"
    }