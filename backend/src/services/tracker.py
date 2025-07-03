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
from typing import Dict, Any, List
from db_models import User
from db import SessionLocal
from db_models import UserTopicActivity, UserTopicNotes, UserQuizHistory
from pathway_flow.stream import stream_topic_event
from db_models import UserTopicActivity, UserTopicProgress, UserSyllabus

LATEST_KB = Path("data/latest_content.jsonl")
TOPIC_ATTEMPTS = Path("data/topic_attempts.jsonl")
TOPIC_MASTERY = Path("data/user_topic_progress.jsonl")

# --- update topic progress (postgres + pathway) ---
async def update_topic_stats(username: str, topic: str, score: float, source: str = "quiz"):
    """updates average score and mastery status, streams to pathway"""
    def db_op():
        db = SessionLocal()
        entry = db.query(UserTopicActivity).filter_by(username=username, topic=topic).first()
        if entry:
            entry.average_score = (entry.average_score + score) / 2
            entry.last_attempt = datetime.utcnow()
            entry.mastery_status = _infer_mastery(entry.average_score)
        else:
            entry = UserTopicActivity(
                username=username,
                topic=topic,
                average_score=score,
                last_attempt=datetime.utcnow(),
                mastery_status=_infer_mastery(score),
            )
            db.add(entry)
        db.commit()
        db.close()

    await asyncio.to_thread(db_op)
    await asyncio.to_thread(stream_topic_event, username, topic, score)

# --- shortcut to log quiz/ask interaction ---
async def log_topic_attempt(username: str, topic: str, score: float = 0.3, source: str = "ask"):
    """defaults to low score (0.3) for /ask explanations"""
    await update_topic_stats(username, topic, score=score, source=source)

# --- return full user progress (postgres) ---
def get_user_progress(username: str):
    db = SessionLocal()
    entries = db.query(UserTopicActivity).filter_by(username=username).all()
    db.close()

    return {
        "username": username,
        "stats": [
            {
                "topic": e.topic,
                "last_attempt": e.last_attempt,
                "average_score": e.average_score,
                "mastery_status": e.mastery_status,
            }
            for e in entries
        ],
    }

# --- suggest revision reminders ---
async def get_due_reminders(username: str):
    db = SessionLocal()
    entries = db.query(UserTopicActivity).filter_by(username=username).all()
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
# def get_user_progress_from_pathway(user_id: str):
#     db = SessionLocal()
#     entries = db.query(UserTopicActivity).filter_by(user_id=user_id).all()
#     db.close()
#     # Sort topics by mastery_status and average_score
#     strong_topics = [e.topic for e in entries if e.mastery_status == "strong"]
#     stats = [
#         {
#             "topic": e.topic,
#             "last_attempt": e.last_attempt,
#             "average_score": e.average_score,
#             "mastery_status": e.mastery_status
#         }
#         for e in entries
#     ]
#     return {
#         "user_id": user_id,
#         "stats": stats,
#         "strong_topics": strong_topics
#     }

# --- build full LLM context: notes + history + preferences ---
def get_user_context(username: str, topic: str) -> dict:
    """
    Builds user context for LLM: notes, quiz history, preferences/progress, and syllabus topics.
    Fetches all from the database using username and topic.
    """
    db = SessionLocal()
    context = {
        "notes": "",
        "quiz_history": [],
        "preferences": {},
        "syllabus_topics": []
    }
    try:
        # Notes
        note = db.query(UserTopicNotes).filter_by(username=username, topic=topic).order_by(UserTopicNotes.updated_at.desc()).first()
        if note:
            context["notes"] = note.notes or ""
        # Quiz history (most recent 10)
        quiz_rows = db.query(UserQuizHistory).filter_by(username=username, topic=topic).order_by(UserQuizHistory.timestamp.desc()).limit(10).all()
        for q in quiz_rows:
            context["quiz_history"].append({
                "question": q.question,
                "answer": q.answer,
                "correct": q.correct,
                "score": q.score,
                "timestamp": q.timestamp.isoformat() if q.timestamp else None
            })
        # Preferences/progress
        activity = db.query(UserTopicActivity).filter_by(username=username, topic=topic).first()
        if activity:
            context["preferences"]["mastery_level"] = activity.mastery_status
            context["preferences"]["average_score"] = activity.average_score
            context["preferences"]["last_attempt"] = activity.last_attempt.isoformat() if activity.last_attempt else None
        progress = db.query(UserTopicProgress).filter_by(username=username, topic=topic).first()
        if progress:
            context["preferences"]["latest_score"] = progress.latest_score
            context["preferences"]["trend"] = progress.trend
            context["preferences"]["status"] = progress.status
        # Syllabus topics
        syllabus = db.query(UserSyllabus).filter_by(username=username).first()
        if syllabus and syllabus.topics_text:
            try:
                context["syllabus_topics"] = json.loads(syllabus.topics_text)
            except Exception:
                context["syllabus_topics"] = []
    finally:
        db.close()
    return context


def get_user_progress_from_pathway(username: str):
    stats = []
    try:
        with open("data/topic_mastery.jsonl") as f:
            for line in f:
                row = json.loads(line)
                if row["username"] == username:
                    stats.append({
                        "topic": row["topic"],
                        "last_attempt": row["last_attempt"],
                        "average_score": row["average_score"],
                        "mastery_status": row["mastery_status"]
                    })
    except FileNotFoundError:
        pass
    return {
        "username": username,
        "stats": stats
    }
def get_user_progress_from_db(username: str) -> Dict[str, Any]:
    session = SessionLocal()
    try:
        user = session.query(User).filter_by(username=username).first()
        if not user:
            return {"error": "user not found"}

        rows = (
            session.query(UserTopicProgress)
                .filter(UserTopicProgress.username == username)
                .all()
        )

        topics: List[Dict[str, Any]] = []
        for row in rows:
            topics.append({
                "topic":         row.topic,
                "latest_score":  row.latest_score,
                "average_score": row.average_score,
                "last_attempt":  row.last_attempt,
                "trend":         row.trend,
                "status":        row.status,
            })

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
            "username": username,
            "summary": summary,
            "topics":  topics
        }

    finally:
        session.close()
