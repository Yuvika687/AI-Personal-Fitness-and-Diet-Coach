# backend/app/core/recommender.py
from math import radians, cos, sin, asin, sqrt
from typing import List, Dict

# Small mock dataset - replace by real DB or external API later
MOCK_GYMS = [
    {"name": "Fitness Hub", "lat": 28.6139, "lon": 77.2090, "facilities": ["weights","cardio"]},
    {"name": "Urban Lift", "lat": 28.6200, "lon": 77.2100, "facilities": ["crossfit","cardio","pool"]},
    {"name": "Powerhouse Gym", "lat": 28.6000, "lon": 77.2200, "facilities": ["weights","sauna"]}
]

def haversine(lat1, lon1, lat2, lon2):
    # distance km
    R = 6371.0
    dlat = radians(lat2-lat1)
    dlon = radians(lon2-lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    return R * c

def recommend_gyms(user_loc: Dict, user_goal: str, top_n=5):
    lat = user_loc.get("lat")
    lon = user_loc.get("lon")
    results = []
    for g in MOCK_GYMS:
        dist = haversine(lat, lon, g["lat"], g["lon"])
        # facility score
        facility_score = 1.0
        if "strength" in user_goal.lower() and "weights" in g["facilities"]:
            facility_score += 1.0
        if "cardio" in user_goal.lower() and "cardio" in g["facilities"]:
            facility_score += 0.8
        score = max(0, 5 - dist) * facility_score  # simple scoring
        results.append({"gym_name": g["name"], "address": "Nearby", "distance_km": round(dist,2), "score": round(score,2)})
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_n]
