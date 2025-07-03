from sqlalchemy import Column, Integer, Sequence, String, Float, ForeignKey, DateTime, Text
from datetime import datetime, timezone
from db import Base

class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, ForeignKey("users.username", ondelete="CASCADE"), nullable=False)
    topic_name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=True)
    email = Column(String, unique=True, nullable=True)
    password_hash = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    llm_provider = Column(String, nullable=True)
    llm_api_key = Column(String, nullable=True)
    llm_model = Column(String, nullable=True)

class UserTopicActivity(Base):
    __tablename__ = "user_topic_activity"
    username = Column(String, primary_key=True)
    topic = Column(String, primary_key=True)
    last_attempt = Column(DateTime, default=datetime.utcnow)
    average_score = Column(Float, default=0.0)
    mastery_status = Column(String, default="weak")

class UserSyllabus(Base):
    __tablename__ = "user_syllabus"
    username = Column(String, primary_key=True)
    topics_text = Column(Text) 

class UserTopicProgress(Base):
    """
    ORM model for persisting user-topic progress.
    """
    __tablename__ = "user_topic_progress"
    username      = Column(String, primary_key=True)
    topic         = Column(String,  primary_key=True)
    latest_score  = Column(Float,   nullable=False)
    average_score = Column(Float,   nullable=False)
    last_attempt  = Column(DateTime, nullable=False)
    trend         = Column(String,  nullable=False)
    status        = Column(String,  nullable=False)

class UserTopicNotes(Base):
    __tablename__ = "user_topic_notes"
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, nullable=False, index=True)
    topic = Column(String, nullable=False, index=True)
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class UserQuizHistory(Base):
    __tablename__ = "user_quiz_history"
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, nullable=False, index=True)
    topic = Column(String, nullable=False, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=True)
    correct = Column(String, nullable=True)  # e.g. 'yes', 'no', or correct answer text
    score = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
