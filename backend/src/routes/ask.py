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
from models import AskRequest
from services.llm import LLMProviderError

@router.post("/explain")
async def explain_route(request_data: AskRequest):
    """
    Explain a concept using LLM with personalized settings.
    """
    try:

        topic_for_llm = request_data.topic if request_data.topic is not None else ""
        result = await explain_concept(
            question=request_data.question,
            user_id=request_data.user_id,
            topic=topic_for_llm,
            system_prompt=request_data.system_prompt,
            temperature=request_data.temperature,
            max_tokens=request_data.max_tokens,
            llm_config=request_data.llm_config
        )
        log_user_event(request_data.user_id, "explain", request_data.topic, {"question": request_data.question, "response": result.get("content")})
        return result
    except LLMProviderError as e:
        # Catch specific LLM errors and return 500 or 401 based on content of e
        detail_msg = str(e)
        status_code = 500
        if "API Key is missing" in detail_msg or "authentication" in detail_msg or "invalid_api_key" in detail_msg.lower():
            status_code = 401 # Unauthorized for API key issues
        raise HTTPException(status_code=status_code, detail=detail_msg)
    except ValueError as e: # For validation errors within explain_concept
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Catch any other unexpected errors
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

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
