import os
import json
from db import SessionLocal
from db_models import User, Topic

def sync_topics_to_jsonl(jsonl_path="data/latest_content.jsonl"):
    session = SessionLocal()
    try:
        topics = session.query(Topic).all()
        with open(jsonl_path, "w", encoding="utf-8") as f:
            for topic in topics:
                user = session.query(User).filter_by(id=topic.username).first()
                if user:
                    record = {
                        "username": user.username,
                        "topic": topic.topic_name,
                        "created_at": topic.created_at.isoformat() if topic.created_at else None
                    }
                    f.write(json.dumps(record) + "\n")
    finally:
        session.close()

if __name__ == "__main__":
    sync_topics_to_jsonl()
