"""
- updates user performance per topic
- streams to pathway
- computes reminders and progress
- supports real-time tracking via pathway + persistent tracking via postgres
"""
import asyncio
from db import SessionLocal
from db_models import UserTopicActivity, UserTopicProgress
from datetime import datetime, timedelta
from pathway_flow.stream import stream_topic_event
from typing import Dict, Any, List
import json 

# --- update topic stats and stream to pathway ---
async def update_topic_stats(user_id: str, topic: str, score: float, source: str = "quiz"):
    def db_op():
        db = SessionLocal()
        entry = db.query(UserTopicActivity).filter_by(user_id=user_id, topic=topic).first()
        if entry:
            entry.average_score = (entry.average_score + score) / 2
            entry.last_attempt = datetime.utcnow()
            entry.mastery_status = _infer_mastery(entry.average_score)
        else:
            entry = UserTopicActivity(
                user_id=user_id,
                topic=topic,
                average_score=score,
                last_attempt=datetime.utcnow(),
                mastery_status=_infer_mastery(score),
            )
            db.add(entry)
        db.commit()
        db.close()

    await asyncio.to_thread(db_op)
    await asyncio.to_thread(stream_topic_event, user_id, topic, score)

# --- optional: log /ask or quiz interaction ---

async def log_topic_attempt(user_id: str, topic: str, score: float = 0.3, source: str = "ask"):
    # score is now configurable; default 0.3 for ask, real score for quiz
    await update_topic_stats(user_id, topic, score=score, source=source)

# --- fetch full progress for user ---

def get_user_progress(user_id: str):
    db = SessionLocal()
    entries = db.query(UserTopicActivity).filter_by(user_id=user_id).all()
    db.close()

    return {
        "user_id": user_id,
        "stats": [
            {
                "topic": e.topic,
                "last_attempt": e.last_attempt,
                "average_score": e.average_score,
                "mastery_status": e.mastery_status
            }
            for e in entries
        ]
    }

# --- suggest topics for revision ---

def get_due_reminders(user_id: str):
    db = SessionLocal()
    entries = db.query(UserTopicActivity).filter_by(user_id=user_id).all()
    db.close()

    now = datetime.utcnow()
    reminders = []

    for e in entries:
        days = (now - e.last_attempt).days
        if days >= 3:
            reminders.append({
                "topic": e.topic,
                "days_since_last_attempt": days,
                "suggested_action": f"revise {e.topic} (last seen {days} days ago)"
            })

    return reminders

# --- helper ---

def _infer_mastery(score: float) -> str:
    if score >= 0.8:
        return "mastered"
    elif score >= 0.5:
        return "improving"
    return "weak"


def get_user_progress_from_pathway(user_id: str):
    stats = []
    try:
        with open("data/topic_mastery.jsonl") as f:
            for line in f:
                row = json.loads(line)
                if row["user_id"] == user_id:
                    stats.append({
                        "topic": row["topic"],
                        "last_attempt": row["last_attempt"],
                        "average_score": row["average_score"],
                        "mastery_status": row["mastery_status"]
                    })
    except FileNotFoundError:
        pass
    return {
        "user_id": user_id,
        "stats": stats
    }

def get_user_progress_from_db(user_id: str) -> Dict[str, Any]:
    session = SessionLocal()
    try:
        # 1) Fetch all progress rows for this user
        rows = (
            session.query(UserTopicProgress)
                   .filter(UserTopicProgress.user_id == user_id)
                   .all()
        )

        # 2) Transform into dicts
        topics: List[Dict[str, Any]] = []
        for row in rows:
            topics.append({
                "topic":         row.topic,
                "latest_score":  row.latest_score,
                "average_score": row.average_score,
                "last_attempt":  row.last_attempt,   # Pydantic will handle ISO formatting
                "trend":         row.trend,
                "status":        row.status,
            })

        # 3) Compute summary
        total = len(topics)
        mastered = sum(1 for t in topics if t["status"] == "mastered")
        improving = sum(1 for t in topics if t["trend"] == "improving")
        needs_attention = sum(1 for t in topics if t["status"] == "weak")
        average_score = round(sum(t["latest_score"] for t in topics) / total, 2) if total else 0.0

        summary = {
            "topics_attempted": total,
            "mastered": mastered,
            "improving": improving,
            "needs_attention": needs_attention,
            "average_score": average_score,
        }

        return {
            "user_id": user_id,
            "summary": summary,
            "topics":  topics
        }

    finally:
        session.close()
