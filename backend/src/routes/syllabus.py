from fastapi import APIRouter, UploadFile, Form
from services.parser import parse_pdf_topics
from pathway_flow.stream import stream_content_event
from db import SessionLocal
from db_models import UserSyllabus, Topic, User
import tempfile, os, json
import asyncio
from pydantic import BaseModel
from services.event_logger import log_user_event

router = APIRouter()

class LLMConfig(BaseModel):
    provider: str
    api_key: str
    model: str

def get_user_syllabus(username: str) -> list[str]:
    db = SessionLocal()
    record = db.query(UserSyllabus).filter_by(username=username).first()
    db.close()
    if record and record.topics_text:
        return json.loads(record.topics_text)
    return []

@router.post("/syllabus")
async def upload_syllabus(
    pdf: UploadFile, 
    username: str = Form(...),
    llm_provider: str = Form(...),
    llm_api_key: str = Form(...),
    llm_model: str = Form(...)
):
    llm_config = {
        "provider": llm_provider,
        "api_key": llm_api_key,
        "model": llm_model
    }
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(await pdf.read())
        tmp_path = tmp.name

    topics = await parse_pdf_topics(tmp_path, llm_config)
    os.remove(tmp_path)

    db = SessionLocal()
    try:
        existing = db.query(UserSyllabus).filter_by(username=username).first()
        if existing:
            existing.topics_text = json.dumps(topics)
        else:
            db.add(UserSyllabus(username=username, topics_text=json.dumps(topics)))
        db.commit()

        # --- Add topics to Topic table for this user (if not already present) ---
        user = db.query(User).filter(User.username == username).first()
        if user:
            for t in topics:
                topic_name = t["topic"] if isinstance(t, dict) and "topic" in t else (t if isinstance(t, str) else None)
                if topic_name:
                    exists = db.query(Topic).filter_by(username=user.username, topic_name=topic_name).first()
                    if not exists:
                        db.add(Topic(username=user.username, topic_name=topic_name))
            db.commit()
    finally:
        db.close()

    # Log user event for syllabus upload and topics
    log_user_event(username, "syllabus_uploaded", None, {"topics": topics})

    # stream all topics and content to Pathway
    for t in topics:
        if isinstance(t, dict) and "topic" in t and "content" in t:
            await stream_content_event(username, t["topic"], t["content"])

    return {"topics": topics}
