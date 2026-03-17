from fastapi import APIRouter, Depends
from app.models.user import User
from app.routes.auth import get_current_user
from app.core.ai_services import generate_smart_diet_plan, generate_workout_plan
from pydantic import BaseModel
from typing import List

router = APIRouter()

class DietPlanResponse(BaseModel):
    diet_plan: str
    message: str
    is_ai_generated: bool

class WorkoutPlanResponse(BaseModel):
    workout_plan: str
    message: str
    is_ai_generated: bool

@router.get("/generate-plan", response_model=DietPlanResponse)
async def generate_diet_plan(current_user: User = Depends(get_current_user)):
    """Generate personalized diet plan"""
    try:
        ai_diet_plan = generate_smart_diet_plan(current_user)
        return {
            "diet_plan": ai_diet_plan,
            "message": f"AI-generated personalized diet plan for {current_user.full_name or current_user.email}",
            "is_ai_generated": True
        }
    except Exception as e:
        return {
            "diet_plan": "Error generating diet plan. Please try again.",
            "message": "AI service temporarily unavailable",
            "is_ai_generated": False
        }

@router.get("/smart-workout-plan", response_model=WorkoutPlanResponse)
async def get_smart_workout_plan(current_user: User = Depends(get_current_user)):
    """Generate personalized workout plan"""
    try:
        ai_workout_plan = generate_workout_plan(current_user)
        return {
            "workout_plan": ai_workout_plan,
            "message": "AI-generated personalized workout plan",
            "is_ai_generated": True
        }
    except Exception as e:
        return {
            "workout_plan": "Error generating workout plan. Please try again.",
            "message": "AI service temporarily unavailable",
            "is_ai_generated": False
        }

@router.get("/quick-tips")
def get_diet_tips(current_user: User = Depends(get_current_user)):
    """Get nutrition tips"""
    tips = [
        "💧 Drink 500ml water 30 minutes before each meal for better digestion",
        "🥦 Fill half your plate with colorful vegetables at every meal",
        "🍗 Aim for 30g protein per meal for optimal muscle synthesis", 
        "🕒 Eat every 3-4 hours to maintain stable blood sugar levels",
        "🚫 Limit processed foods - focus on whole, single-ingredient foods",
        "🥑 Include healthy fats like avocado, nuts, and olive oil daily",
        "🍎 Choose whole fruits over fruit juice for fiber and nutrients",
        "🌙 Finish eating 2-3 hours before bedtime for better sleep quality",
        "🔥 Include thermogenic foods like ginger and chili peppers",
        "💤 Get 7-9 hours of quality sleep for optimal recovery and metabolism"
    ]
    
    return {
        "tips": tips,
        "personal_note": f"Advanced nutrition tips for your {current_user.activity_level or 'moderate'} activity level",
        "total_tips": len(tips)
    }

@router.get("/bmi")
def calculate_bmi(current_user: User = Depends(get_current_user)):
    """Calculate BMI"""
    if current_user.height_cm and current_user.weight_kg:
        height_m = current_user.height_cm / 100
        bmi = current_user.weight_kg / (height_m * height_m)
        
        if bmi < 18.5:
            category = "Underweight"
            recommendation = "Focus on nutrient-dense foods and strength training"
        elif bmi < 25:
            category = "Normal weight" 
            recommendation = "Maintain your healthy lifestyle with balanced nutrition"
        elif bmi < 30:
            category = "Overweight"
            recommendation = "Combine cardio exercise with portion control"
        else:
            category = "Obese"
            recommendation = "Consult with healthcare provider for personalized plan"
            
        return {
            "bmi": round(bmi, 1),
            "category": category,
            "recommendation": recommendation,
            "height": current_user.height_cm,
            "weight": current_user.weight_kg,
            "ideal_weight_range": {
                "min": round(18.5 * (height_m * height_m), 1),
                "max": round(24.9 * (height_m * height_m), 1)
            }
        }
    else:
        return {
            "error": "Height and weight required to calculate BMI",
            "message": "Please update your profile with height and weight for personalized insights",
            "bmi": None,
            "category": "Data missing"
        }