"""
- updates user performance per topic
- streams to pathway
- computes reminders and progress
- supports real-time tracking via pathway + persistent tracking via postgres
"""

import asyncio
import json
from datetime import datetime
from pathlib import Path

from db import SessionLocal
from db_models import UserTopicActivity
from pathway_flow.stream import stream_topic_event

LATEST_KB = Path("data/latest_content.jsonl")
TOPIC_ATTEMPTS = Path("data/topic_attempts.jsonl")
TOPIC_MASTERY = Path("data/topic_mastery.jsonl")

# --- update topic progress (postgres + pathway) ---
async def update_topic_stats(user_id: str, topic: str, score: float, source: str = "quiz"):
    """updates average score and mastery status, streams to pathway"""
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

# --- shortcut to log quiz/ask interaction ---
async def log_topic_attempt(user_id: str, topic: str, score: float = 0.3, source: str = "ask"):
    """defaults to low score (0.3) for /ask explanations"""
    await update_topic_stats(user_id, topic, score=score, source=source)

# --- return full user progress (postgres) ---
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

# --- suggest revision reminders ---
async def get_due_reminders(user_id: str):
    db = SessionLocal()
    entries = db.query(UserTopicActivity).filter_by(user_id=user_id).all()
    db.close()
    now = datetime.utcnow()
    reminders = []
    for e in entries:
        days = (now - e.last_attempt).days if e.last_attempt else None
        if e.mastery_status == "weak":
            reminders.append({
                "topic": e.topic,
                "days_since_last_attempt": days,
                "suggested_action": "Review this topic to improve your understanding."
            })
    return reminders

# --- helper to classify score into mastery ---
def _infer_mastery(score: float) -> str:
    if score >= 0.8:
        return "mastered"
    elif score >= 0.5:
        return "improving"
    return "weak"

# --- fallback: read from streamed jsonl ---
def get_user_progress_from_pathway(user_id: str):
    db = SessionLocal()
    entries = db.query(UserTopicActivity).filter_by(user_id=user_id).all()
    db.close()
    # Sort topics by mastery_status and average_score
    strong_topics = [e.topic for e in entries if e.mastery_status == "strong"]
    stats = [
        {
            "topic": e.topic,
            "last_attempt": e.last_attempt,
            "average_score": e.average_score,
            "mastery_status": e.mastery_status
        }
        for e in entries
    ]
    return {
        "user_id": user_id,
        "stats": stats,
        "strong_topics": strong_topics
    }

# --- build full LLM context: notes + history + preferences ---
def get_user_context(user_id: str, topic: str) -> dict:
    """builds user context for LLM: notes, past performance, preferences"""
    context = {"notes": "", "quiz_history": [], "preferences": {}}

    # from LATEST_KB
    if LATEST_KB.exists():
        with LATEST_KB.open(encoding="utf-8") as f:
            for line in f:
                rec = json.loads(line)
                if rec["user_id"] == user_id:
                    if rec.get("type") == "notes" and rec.get("topic") == topic:
                        context["notes"] = rec.get("content", "")
                    elif rec.get("type") == "quiz_history" and rec.get("topic") == topic:
                        context["quiz_history"].append(rec.get("performance", {}))
                    elif rec.get("type") == "preferences":
                        context["preferences"] = rec.get("preferences", {})

    # from topic_attempts
    if TOPIC_ATTEMPTS.exists():
        with TOPIC_ATTEMPTS.open(encoding="utf-8") as f:
            for line in f:
                rec = json.loads(line)
                if rec["user_id"] == user_id and rec.get("topic") == topic:
                    context["quiz_history"].append(rec.get("performance", {}))

    # from topic_mastery (stream output)
    if TOPIC_MASTERY.exists():
        with TOPIC_MASTERY.open(encoding="utf-8") as f:
            for line in f:
                rec = json.loads(line)
                if rec["user_id"] == user_id and rec.get("topic") == topic:
                    context["preferences"]["mastery_level"] = rec.get("mastery", "beginner")

    return context
