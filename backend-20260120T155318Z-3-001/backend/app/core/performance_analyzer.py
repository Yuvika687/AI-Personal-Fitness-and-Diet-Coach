# backend/app/core/performance_analyzer.py
def compute_form_score(keypoints_metrics: dict) -> float:
    """
    Example: keypoints_metrics can include:
      { "knee_angle_variation": 5.0, "back_angle": 10.0, "rmse_pose": 0.12 }
    Lower error -> higher score.
    Return 0..100
    """
    # simplistic mapping — tune later
    rmse = keypoints_metrics.get("rmse_pose", 0.2)
    back_angle = abs(keypoints_metrics.get("back_angle", 10.0))
    score = 100 - (rmse * 200) - (back_angle * 0.5)
    score = max(0.0, min(100.0, score))
    return score

def compute_overall_score(reps, duration_sec, form_score):
    # combine with simple weights
    rep_factor = min(1.0, reps / 10)
    time_factor = min(1.0, duration_sec / 300)
    overall = 0.5 * form_score + 30 * rep_factor + 20 * time_factor
    return max(0.0, min(100.0, overall))
