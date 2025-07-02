from sqlalchemy import Column, Integer, Sequence, String, Float, DateTime, Text
from datetime import datetime, timezone
from db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=True)
    email = Column(String, unique=True, nullable=True)
    password_hash = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserTopicActivity(Base):
    __tablename__ = "user_topic_activity"

    user_id = Column(String, primary_key=True)
    topic = Column(String, primary_key=True)
    last_attempt = Column(DateTime, default=datetime.utcnow)
    average_score = Column(Float, default=0.0)
    mastery_status = Column(String, default="weak")



class UserSyllabus(Base):
    __tablename__ = "user_syllabus"

    user_id = Column(String, primary_key=True)
    topics_text = Column(Text) 

class UserTopicProgress(Base):
    """
    ORM model for persisting user-topic progress.
    """
    __tablename__ = "user_topic_progress"

    user_id       = Column(String,  primary_key=True)
    topic         = Column(String,  primary_key=True)
    latest_score  = Column(Float,   nullable=False)
    average_score = Column(Float,   nullable=False)
    last_attempt  = Column(DateTime, nullable=False)
    trend         = Column(String,  nullable=False)
    status        = Column(String,  nullable=False)
