from fastapi import APIRouter, HTTPException
from services.pdf_generator import create_topic_pdf
from starlette.responses import FileResponse

router = APIRouter()

@router.get("/download/pdf/{user_id}/{topic}")
async def get_pdf(user_id: str, topic: str):
    try:
        pdf_path = await create_topic_pdf(user_id, topic)
        return FileResponse(path=pdf_path, filename=f"{topic}_revision_capsule.pdf", media_type='application/pdf')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

