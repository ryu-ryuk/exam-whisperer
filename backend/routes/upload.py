from fastapi import APIRouter
from pydantic import BaseModel

from pathway_flow.stream import stream_content_event

router = APIRouter()

class UploadRequest(BaseModel):
    user_id: str
    topic: str
    content: str

@router.post("/upload")
async def upload(req: UploadRequest):
    stream_content_event(req.user_id, req.topic, req.content)
    return {"status": "ok"}
