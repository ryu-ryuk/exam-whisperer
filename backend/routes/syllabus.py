"""
handles /upload_syllabus endpoint.

- receives a pdf of syllabus/book
- extracts topics using pdfplumber or tesseract
- stores extracted topics for future quiz generation
"""

from fastapi import APIRouter, UploadFile
from services.parser import parse_pdf_topics
from models import UploadResponse
import tempfile

router = APIRouter()

@router.post("/syllabus")
async def upload_syllabus(pdf: UploadFile):
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(await pdf.read())
        tmp_path = tmp.name

    topics = parse_pdf_topics(tmp_path)
    os.remove(tmp_path)

    return {"topics": topics}