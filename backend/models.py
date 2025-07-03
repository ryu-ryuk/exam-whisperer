"""
defines all request and response schemas used by the backend.

- shared across routes
- validated by fastapi using pydantic
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime


class BackendLLMConfig(BaseModel):
    provider: str
    api_key: str
    model: str

# ---------- /ask ----------

class AskRequest(BaseModel):
    username: str
    question: str
    topic: Optional[str] = None # if None, topic is inferred from question
    system_prompt: str
    temperature: float
    max_tokens: int
    llm_config: BackendLLMConfig
    

# unused 
class AskResponse(BaseModel):
    content: str 
    topic: str

# ---------- /quiz ----------

class QuizQuestion(BaseModel):
    question: str
    options: List[Dict[str, str]] # List of dictionaries like {"id": "A", "text": "Option A"}
    correctAnswerId: str # e.g., "A", "B"
    feedback: str 

# Model for generating a new quiz question (single question, LLM-driven)
class QuizCreateRequest(BaseModel):
    topic: str
    difficulty: Optional[str] = "medium"
    num_questions: Optional[int] = 1 # Default to 1 question for chat integration
    username: str
    llm_config: BackendLLMConfig 
# Model for evaluating a quiz answer

class QuizEvaluateRequest(BaseModel):
    username: str 
    topic: str
    question_index: int # Index of the question within the quiz context
    user_answer: str    # The ID of the option selected by the user (e.g., 'A', 'B')
    question: QuizQuestion 
    num_questions: Optional[int] = 1 # Total number of questions in the context
    difficulty: Optional[str] = "medium"
    llm_config: Optional[BackendLLMConfig] # Optional LLM config for evaluation


# ---------- /progress ----------

class TopicStat(BaseModel):
    topic: str
    last_attempt: Optional[datetime]
    average_score: float
    mastery_status: str  # "weak", "improving", "mastered"

class ProgressResponse(BaseModel):
    username: str
    stats: List[TopicStat]

class TopicProgress(BaseModel):
    topic: str
    latest_score: float
    average_score: float
    trend: str
    status: str
    last_attempt: datetime

class OverallProgress(BaseModel):
    username: str
    overall_score: float
    topics: List[TopicProgress]


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
