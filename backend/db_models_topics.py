from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from db import Base
from datetime import datetime

class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, ForeignKey("users.username", ondelete="CASCADE"), nullable=False)
    topic_name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
