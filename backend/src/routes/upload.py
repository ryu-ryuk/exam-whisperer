from fastapi import APIRouter
from pydantic import BaseModel

from pathway_flow.stream import stream_content_event

router = APIRouter()

class UploadRequest(BaseModel):
    username: str
    topic: str
    content: str

@router.post("/upload")
async def upload(req: UploadRequest):
    stream_content_event(req.username, req.topic, req.content)
    return {"status": "ok"}

