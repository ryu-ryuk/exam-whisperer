from fastapi import APIRouter, UploadFile, Form
from services.parser import parse_pdf_topics
from pathway_flow.stream import stream_content_event
from db import SessionLocal
from db_models import UserSyllabus
import tempfile, os, json
import asyncio
router = APIRouter()

def get_user_syllabus(user_id: str) -> list[str]:
    db = SessionLocal()
    record = db.query(UserSyllabus).filter_by(user_id=user_id).first()
    db.close()
    if record and record.topics_text:
        return json.loads(record.topics_text)
    return []

@router.post("/syllabus")
async def upload_syllabus(pdf: UploadFile, user_id: str = Form(...)):
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(await pdf.read())
        tmp_path = tmp.name

    topics = await parse_pdf_topics(tmp_path)
    os.remove(tmp_path)

    # store in DB
    db = SessionLocal()
    existing = db.query(UserSyllabus).filter_by(user_id=user_id).first()
    if existing:
        existing.topics_text = json.dumps(topics)
    else:
        db.add(UserSyllabus(user_id=user_id, topics_text=json.dumps(topics)))
    db.commit()
    db.close()

    # stream placeholder content to pathway
# stream all topics and content to Pathway
    for t in topics:
        if isinstance(t, dict) and "topic" in t and "content" in t:
            await stream_content_event(user_id, t["topic"], t["content"])

    return {"topics": topics}
