from fastapi import APIRouter, HTTPException
from typing import List
from db import SessionLocal
from db_models import User, Topic
from pydantic import BaseModel

router = APIRouter()

class TopicCreate(BaseModel):
    topic: str

@router.get("/topics/{username}", response_model=List[str])
def get_user_topics(username: str):
    session = SessionLocal()
    try:
        user = session.query(User).filter_by(username=username).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")
        topics = session.query(Topic).filter_by(username=username).all()
        return [t.topic_name for t in topics]
    finally:
        session.close()

@router.post("/topics/{username}")
def add_user_topic(username: str, topic_data: TopicCreate):
    session = SessionLocal()
    try:
        user = session.query(User).filter_by(username=username).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")
        # Check if topic already exists for user
        existing = session.query(Topic).filter_by(username=username, topic_name=topic_data.topic).first()
        if existing:
            return {"message": "Topic already exists"}
        topic = Topic(username=username, topic_name=topic_data.topic)
        session.add(topic)
        session.commit()
        return {"message": "Topic added"}
    finally:
        session.close()
