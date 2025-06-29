"""
handles the /ask endpoint.

- receives a concept-based question from the user
- queries the llm to generate a clear explanation
- detects the topic from the question
- logs the interaction (user, topic, timestamp)
- streams the event to pathway for topic tracking
"""
from fastapi import APIRouter, HTTPException, UploadFile
from services.llm import explain_concept
from services.omnidimension import voice_ask
from services.event_logger import log_user_event
router = APIRouter()
from fastapi import Form

@router.post("/explain")
async def explain(
    question: str = Form(...),
    user_id: str = Form(...),
    topic: str = Form("")
):
    """
    explain a concept using llm with optional topic detection
    """
    try:
        result = await explain_concept(question, user_id, topic)
        log_user_event(user_id, "explain", topic, {"question": question})
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/voice_ask")
async def voice_ask_route(file: UploadFile, user_id: str, topic: str = ""):
    """
    accept voice input, transcribe, and explain using llm
    """
    try:
        audio_data = await file.read()
        result = await voice_ask(audio_data, user_id, topic)
        log_user_event(user_id, "voice_ask", topic, {"file": file.filename})
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")