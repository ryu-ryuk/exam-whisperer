from sqlalchemy import Column, String, Float, DateTime
from datetime import datetime
from db import Base

class UserTopicActivity(Base):
    __tablename__ = "user_topic_activity"

    user_id = Column(String, primary_key=True)
    topic = Column(String, primary_key=True)
    last_attempt = Column(DateTime, default=datetime.utcnow)
    average_score = Column(Float, default=0.0)
    mastery_status = Column(String, default="weak")
