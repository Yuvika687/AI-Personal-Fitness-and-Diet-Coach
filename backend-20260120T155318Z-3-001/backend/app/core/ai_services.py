# backend/app/core/ai_services.py - UPDATED WITH CORRECT MODEL
import os
import requests
from app.core.config import settings
from app.models.user import User

# Check if Gemini API key is available
if not settings.GEMINI_API_KEY:
    USE_GEMINI_API = False
else:
    USE_GEMINI_API = True

def call_gemini_api(prompt, system_instruction="You are a fitness AI assistant."):
    """Call Gemini 2.5 Flash-Lite API"""
    try:
        if not USE_GEMINI_API:
            return None
        
        # Correct API endpoint for Gemini 2.5 Flash-Lite
        url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent"

        
        headers = {
            "Content-Type": "application/json",
        }
        
        params = {
            "key": settings.GEMINI_API_KEY
        }
        
        # Correct payload structure for Gemini 2.5
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": f"{system_instruction}\n\nUser: {prompt}\n\nAI:"
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.7,
                "topP": 0.8,
                "topK": 40,
                "maxOutputTokens": 1000
            }
        }
        
        response = requests.post(url, headers=headers, params=params, json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            if 'candidates' in result and len(result['candidates']) > 0:
                return result['candidates'][0]['content']['parts'][0]['text']
        else:
            print(f"Gemini API Error: {response.status_code} - {response.text}")
        
        return None
        
    except Exception as e:
        print(f"Gemini API call failed: {e}")
        return None

def generate_ai_reply(user_message: str):
    """Generate a reply using Gemini 2.5 Flash-Lite"""
    try:
        # Try Gemini API first
        gemini_response = call_gemini_api(
            prompt=user_message,
            system_instruction="You are a helpful fitness AI assistant. Keep responses under 100 words, motivational, and practical."
        )
        
        if gemini_response:
            return gemini_response
        
        # Fallback to smart mock responses
        user_message_lower = user_message.lower()
        
        if any(word in user_message_lower for word in ['hello', 'hi', 'hey']):
            return "Hello! I'm your AI Gym Assistant. Ready to help you crush your fitness goals? 💪"
        
        elif any(word in user_message_lower for word in ['workout', 'exercise', 'training']):
            return "For effective workouts: Focus on compound movements (squats, deadlifts, push-ups), maintain proper form, and progressively increase intensity. Rest 48 hours between training the same muscle groups! 🏋️‍♂️"
        
        elif any(word in user_message_lower for word in ['diet', 'nutrition', 'food', 'eat']):
            return "Nutrition tips: Eat protein with every meal (30g), include colorful vegetables, stay hydrated (3-4L water), and time carbs around workouts for energy! 🍎"
        
        elif any(word in user_message_lower for word in ['weight', 'lose', 'gain', 'fat']):
            return "Weight management: Create a 300-500 calorie deficit/surplus, track intake, combine strength training with cardio, and be patient - aim for 0.5-1kg per week! ⚖️"
        
        elif any(word in user_message_lower for word in ['sleep', 'rest', 'recovery']):
            return "Recovery is crucial: Get 7-9 hours sleep, stretch after workouts, stay hydrated, and take rest days. Muscles grow during recovery, not workouts! 😴"
        
        elif any(word in user_message_lower for word in ['motivation', 'stuck', 'tired', 'help']):
            return "Remember: Fitness is a marathon, not a sprint. Celebrate small wins, track progress, find a workout buddy, and focus on how exercise makes you FEEL! 🔥"
        
        else:
            # Generic motivational response
            responses = [
                "Stay consistent with your workouts and nutrition - that's the real secret to fitness success! 💪",
                "Remember: Progress takes time. Focus on showing up every day, and the results will follow! 🎯",
                "Your fitness journey is unique to you. Listen to your body and adjust as needed! 🌟",
                "What specific fitness goal would you like help with today? I'm here to guide you! 🏆"
            ]
            import random
            return random.choice(responses)
            
    except Exception as e:
        print(f"Error generating AI reply: {e}")
        return "I'm here to support your fitness journey! What would you like to know about workouts, nutrition, or recovery? 🏋️‍♂️"

def generate_smart_diet_plan(user):
    """Generate a personalized diet plan using Gemini 2.5 Flash-Lite"""
    try:
        # Create detailed prompt
        prompt = f"""
        Create a detailed, practical daily diet plan for a fitness enthusiast with these details:
        
        USER PROFILE:
        - Name: {user.full_name or 'Fitness Enthusiast'}
        - Age: {user.age or 25}
        - Gender: {user.gender or 'not specified'}
        - Weight: {user.weight_kg or 70} kg
        - Height: {user.height_cm or 175} cm
        - Activity Level: {user.activity_level or 'moderate'}
        
        REQUIREMENTS:
        1. Create a structured meal plan with 5-6 meals per day
        2. Include specific portion sizes in grams/cups
        3. Focus on whole, nutrient-dense foods
        4. Calculate approximate daily calorie and protein targets
        5. Include hydration recommendations
        6. Add 3 practical preparation tips
        7. Format with clear sections and use food emojis
        
        Make it realistic, actionable, and suitable for their activity level.
        """
        
        # Try Gemini API
        gemini_response = call_gemini_api(
            prompt=prompt,
            system_instruction="You are a professional nutritionist creating personalized diet plans."
        )
        
        if gemini_response:
            return gemini_response
        
        # Fallback to detailed mock diet plan
        activity_level = user.activity_level or "moderate"
        weight = user.weight_kg or 70
        
        # Calculate calories based on activity
        if activity_level == "sedentary":
            calories = weight * 25
            protein = weight * 1.2
        elif activity_level == "light":
            calories = weight * 30
            protein = weight * 1.5
        elif activity_level == "moderate":
            calories = weight * 35
            protein = weight * 1.8
        elif activity_level == "active":
            calories = weight * 40
            protein = weight * 2.0
        else:  # athlete
            calories = weight * 45
            protein = weight * 2.2
        
        return f"""🥗 **PERSONALIZED DIET PLAN** for {user.full_name or 'You'}

📊 **Daily Targets:**
• Calories: {int(calories)} kcal
• Protein: {int(protein)}g
• Carbs: {int(calories * 0.4 / 4)}g
• Fats: {int(calories * 0.3 / 9)}g
• Activity Level: {activity_level.capitalize()}

⏰ **MEAL SCHEDULE:**

🍳 **BREAKFAST (7-8 AM)**
• 3-egg omelet with spinach, mushrooms, tomatoes (50g each)
• 1 slice whole grain toast
• 1 cup Greek yogurt (200g) with mixed berries (100g)
• Green tea or black coffee

🥪 **MID-MORNING SNACK (10-11 AM)**
• Protein shake: 30g whey protein + water/almond milk
• 1 medium apple or banana
• Handful of almonds (30g)

🍗 **LUNCH (1-2 PM)**
• Grilled chicken breast (150g) or firm tofu (200g)
• Quinoa or brown rice (150g cooked)
• Steamed mixed vegetables: broccoli, carrots, bell peppers (200g)
• Side salad: mixed greens + olive oil & lemon dressing

🥜 **AFTERNOON SNACK (4-5 PM)**
• Greek yogurt (150g) with chia seeds (15g)
• Protein bar (20g protein)
• Carrot sticks (100g) with hummus (50g)

🐟 **DINNER (7-8 PM)**
• Baked salmon (150g) or lean beef steak (120g)
• Sweet potato (200g) or roasted potatoes
• Asparagus or green beans (150g)
• Small side salad

🥛 **EVENING SNACK (Optional, 9 PM)**
• Casein protein shake or cottage cheese (100g)
• Handful of walnuts (20g)

💧 **HYDRATION PLAN:**
• 500ml water upon waking
• 500ml before each meal (total 2L)
• 500ml during workout
• Herbal teas as desired
• **Total: 3-4 liters daily**

📝 **KEY PRINCIPLES:**
1. 🕒 Eat every 3-4 hours to maintain energy
2. 🍗 Include protein (30g) in every meal
3. 🥦 Fill half your plate with vegetables
4. 💧 Drink water consistently throughout day
5. 🚫 Limit processed foods and added sugars

🔥 **BASED ON YOUR PROFILE:**
• Weight: {weight} kg → Protein target: {int(protein)}g/day
• Activity: {activity_level} → Calorie target: {int(calories)} kcal/day
• Focus: Build muscle & improve body composition

✅ **PREPARATION TIPS:**
1. Meal prep on Sundays for the week ahead
2. Use food scale for accurate portions
3. Keep healthy snacks readily available

🎯 **Remember:** Consistency is more important than perfection!"""
        
    except Exception as e:
        print(f"Error generating diet plan: {e}")
        return """🥗 **DIET PLAN** (AI Service Temporarily Unavailable)

🍳 **Basic Guideline:**
• Breakfast: Protein + complex carbs
• Lunch: Lean protein + vegetables + whole grains  
• Dinner: Protein + vegetables
• Snacks: Fruits, nuts, yogurt
• Hydration: 3-4L water daily

💡 **Tip:** Eat balanced meals every 3-4 hours!"""

def generate_workout_plan(user):
    """Generate a personalized workout plan using Gemini 2.5 Flash-Lite"""
    try:
        # Create detailed prompt
        prompt = f"""
        Create a detailed weekly workout plan for a fitness enthusiast with these details:
        
        USER PROFILE:
        - Age: {user.age or 25}
        - Activity Level: {user.activity_level or 'moderate'}
        - Weight: {user.weight_kg or 70} kg
        - Experience Level: Based on activity level
        
        REQUIREMENTS:
        1. Create a 7-day weekly plan with specific exercises each day
        2. Include sets, reps, rest periods, and progression methods
        3. Design for their experience level (beginner/intermediate/advanced)
        4. Include warm-up and cool-down routines
        5. Add safety tips and form cues
        6. Format with clear daily sections and use exercise emojis
        7. Make it progressive and sustainable
        
        Focus on compound movements, proper form, and balanced muscle development.
        """
        
        # Try Gemini API
        gemini_response = call_gemini_api(
            prompt=prompt,
            system_instruction="You are a certified personal trainer creating workout plans."
        )
        
        if gemini_response:
            return gemini_response
        
        # Fallback to detailed mock workout plan
        activity = user.activity_level or "moderate"
        
        if activity == "sedentary" or activity == "light":
            level = "BEGINNER"
            sets = "2-3"
            reps = "10-12"
            rest = "90-120 seconds"
            frequency = "3 days/week"
        elif activity == "moderate":
            level = "INTERMEDIATE"  
            sets = "3-4"
            reps = "8-12"
            rest = "60-90 seconds"
            frequency = "4-5 days/week"
        else:
            level = "ADVANCED"
            sets = "4-5"
            reps = "6-10"
            rest = "45-60 seconds"
            frequency = "5-6 days/week"
        
        return f"""🏋️ **{level} WORKOUT PLAN** - {frequency}

🎯 **PROGRAM OVERVIEW:**
• Level: {level}
• Sets: {sets} per exercise
• Reps: {reps} per set  
• Rest: {rest} between sets
• Progression: Increase weight when you hit top of rep range

🔥 **WARM-UP (10 Minutes Daily):**
• 5 min light cardio (jumping jacks, high knees)
• Dynamic stretches: leg swings, arm circles, torso twists
• 2 sets of light exercise warm-up

📅 **WEEKLY SCHEDULE:**

**MONDAY: CHEST & TRICEPS** 💪
• Bench Press: {sets} × {reps}
• Incline Dumbbell Press: {sets} × {reps}
• Chest Flyes: 3 × 12-15
• Tricep Pushdowns: 3 × 12-15
• Close-grip Push-ups: 3 × failure

**TUESDAY: BACK & BICEPS** 🦾
• Pull-ups/Lat Pulldowns: {sets} × {reps}
• Bent-over Rows: {sets} × {reps}
• Face Pulls: 3 × 15-20
• Dumbbell Curls: 3 × 10-15
• Hammer Curls: 3 × 10-15

**WEDNESDAY: LEGS & CORE** 🦵
• Barbell Squats: {sets} × {reps}
• Romanian Deadlifts: {sets} × {reps}
• Leg Press: 3 × 10-15
• Leg Curls: 3 × 12-15
• Plank: 3 × 60 seconds
• Leg Raises: 3 × 15-20

**THURSDAY: ACTIVE RECOVERY** 🧘‍♂️
• 30 min light cardio (walking, cycling)
• 15 min full-body stretching
• Foam rolling all major muscle groups
• Focus on mobility and recovery

**FRIDAY: SHOULDERS & ARMS** 💥
• Military Press: {sets} × {reps}
• Lateral Raises: 3 × 12-15
• Front Raises: 3 × 12-15
• Skull Crushers: 3 × 10-15
• Preacher Curls: 3 × 10-15

**SATURDAY: FULL BODY / CARDIO** ❤️
• Deadlifts: 3 × 6-10
• Push-ups: 3 × failure
• Pull-ups: 3 × failure
• 20 min HIIT: 30s sprint, 60s walk
• Farmer's Walks: 3 × 50m

**SUNDAY: COMPLETE REST** 😴
• No formal exercise
• Light walking encouraged
• Focus on recovery and meal prep

📝 **COOL-DOWN (5 Minutes Daily):**
• Static stretching all worked muscles
• Deep breathing exercises
• Hydrate and refuel

✅ **FORM CUES & SAFETY:**
1. Keep back straight during all lifts
2. Control the weight throughout full range
3. Exhale on exertion, inhale on return
4. Stop if you feel sharp pain (not muscle burn)
5. Use spotters for heavy lifts

📈 **PROGRESSION PLAN:**
• Week 1-2: Master form with lighter weights
• Week 3-4: Increase weight by 5-10%
• Week 5-6: Add 1 set to each exercise
• Week 7-8: Decrease rest time by 15 seconds

💡 **BASED ON YOUR PROFILE:**
• Activity: {activity.capitalize()} → {level} program
• Focus: Build strength & muscle with proper form
• Key: Progressive overload + consistency

🎯 **Remember:** Quality over quantity. Perfect form beats heavy weight every time!"""
        
    except Exception as e:
        print(f"Error generating workout plan: {e}")
        return """🏋️ **BASIC WORKOUT PLAN**

📅 **3-Day Full Body Split:**
• Day 1: Squats, Push-ups, Rows
• Day 2: Rest or Light Cardio
• Day 3: Deadlifts, Pull-ups, Plank
• Day 4: Rest

💡 **Focus on proper form and consistency!**"""