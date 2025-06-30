"""
handles the /progress endpoint.

- fetches user’s topic-wise performance
- returns mastery level, improvement trends, and last interaction
"""
from fastapi import APIRouter, HTTPException
from models import TopicProgress, OverallProgress
import json
from typing import List

router = APIRouter()

# @router.get("/progress", response_model=ProgressResponse)
# async def get_progress(user_id: str):
#     log_user_event(user_id, "progress_view", None)
#     progress = get_user_progress_from_pathway(user_id)
#     return progress

##################################################

@router.get("/progress/{user_id}", response_model=OverallProgress)
def get_user_progress(user_id: str):
    # 1) Load and filter the JSONL file
    user_records = []
    try:
        with open("data/user_topic_progress.jsonl", "r") as f:
            for line in f:
                rec = json.loads(line)
                if rec.get("user_id") == user_id:
                    user_records.append(rec)
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="Progress data not available")

    if not user_records:
        raise HTTPException(status_code=404, detail="User progress not found")

    # 2) Compute overall_score
    total_score = sum(r["latest_score"] for r in user_records)
    overall_score = total_score / len(user_records)

    # 3) Build per-topic list
    topics: List[TopicProgress] = []
    for r in user_records:
        topics.append(TopicProgress(
            topic         = r["topic"],
            latest_score  = r["latest_score"],
            average_score = r["average_score"],
            trend         = r["trend"],
            status        = r["status"],
            last_attempt  = r["last_attempt"],
        ))

    return OverallProgress(
        user_id       = user_id,
        overall_score = overall_score,
        topics        = topics,
    )

