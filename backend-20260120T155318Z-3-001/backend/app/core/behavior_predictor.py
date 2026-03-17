# backend/app/core/behavior_predictor.py
from datetime import datetime, timedelta
from typing import List
import numpy as np

def compute_adherence_score(past_records: List[dict]) -> float:
    """
    Simple heuristic:
    - look back 7 days: score = (# days worked / 7)
    - weight recency: last day weight 1.5, earlier lower
    Returns 0..1
    """
    if not past_records:
        return 0.0

    now = datetime.utcnow()
    score = 0.0
    total_weight = 0.0
    for i, r in enumerate(sorted(past_records, key=lambda x: x["date"], reverse=True)[:14]):
        days_ago = (now - r["date"]).days
        weight = max(0.1, 1.5 - 0.1 * days_ago)  # recent higher
        total_weight += weight
        if r.get("did_workout"):
            score += weight
    return float(score / total_weight) if total_weight > 0 else 0.0


def predict_skip_next(adherence_score: float, streak_days: int) -> float:
    """
    Returns probability of skipping next workout (0..1).
    Simple logistic style heuristic.
    """
    # if adherence high and streak high => low skip probability
    base = 0.5
    p = base - 0.6 * adherence_score - 0.04 * streak_days
    p = max(0.01, min(0.99, 1 - (1 / (1 + np.exp(-p)))))  # convert to 0..1
    return float(p)
