from openai import OpenAI
from backend.app.core.config import settings

client = OpenAI(api_key=settings.DEEPSEEK_API_KEY, base_url="https://api.deepseek.com")

def generate_diet_plan(user):
    prompt = f"""
You are a fitness and nutrition assistant.

Generate a structured daily diet plan for:
- Age: {user.age}
- Gender: {user.gender}
- Weight: {user.weight_kg} kg
- Height: {user.height_cm} cm
- Activity Level: {user.activity_level}

Format like this:

🥣 Breakfast:
🍽 Lunch:
🍛 Dinner:
🍎 Snacks:
💧 Water Recommendation:

Make it simple and realistic.
"""

    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content
