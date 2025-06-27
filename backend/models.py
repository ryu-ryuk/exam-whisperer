"""
defines all request and response schemas used by the backend.

- shared across routes
- validated by fastapi using pydantic
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

# ---------- /ask ----------

class AskRequest(BaseModel):
    user_id: str
    question: str

class AskResponse(BaseModel):
    explanation: str
    topic: str


# ---------- /quiz ----------

class QuizRequest(BaseModel):
    user_id: str
    topic: str
    difficulty: Optional[str] = "medium"  # "easy", "medium", "hard"

class Question(BaseModel):
    question: str
    options: List[str]
    correct_index: Optional[int] = None  # hidden on frontend

class QuizResponse(BaseModel):
    questions: List[Question]


# ---------- /answer ----------

class AnswerRequest(BaseModel):
    user_id: str
    topic: str
    questions: List[Question]
    answers: List[int]  # list of selected indices

class AnswerResponse(BaseModel):
    score: float


# ---------- /progress ----------

class TopicStat(BaseModel):
    topic: str
    last_attempt: Optional[datetime]
    average_score: float
    mastery_status: str  # "weak", "improving", "mastered"

class ProgressResponse(BaseModel):
    user_id: str
    stats: List[TopicStat]


# ---------- /reminders ----------

class Reminder(BaseModel):
    topic: str
    days_since_last_attempt: int
    suggested_action: str

class ReminderResponse(BaseModel):
    reminders: List[Reminder]


# ---------- /upload_syllabus ----------

class UploadResponse(BaseModel):
    topics: List[str]