# Mock AI diet generator - we'll add real AI later
def generate_diet_plan(user):
    return f'''
?? **BREAKFAST**
- Oatmeal with fruits and nuts
- 2 boiled eggs
- Green tea

?? **LUNCH**  
- Grilled chicken breast (150g)
- Brown rice (1 cup)
- Mixed vegetables salad
- 1 apple

?? **DINNER**
- Baked fish (150g) 
- Quinoa (1 cup)
- Steamed broccoli
- Greek yogurt

?? **SNACKS**
- Protein shake
- Handful of almonds
- Banana

?? **HYDRATION**
- Drink 2-3 liters of water daily
- Based on your profile: {user.activity_level} activity level
- Target weight: Maintain {user.weight_kg}kg

?? **TIPS**
- Eat every 3-4 hours
- Include protein in every meal
- Stay hydrated during workouts
'''
