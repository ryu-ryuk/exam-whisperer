from fastapi import APIRouter, HTTPException, UploadFile, Request
from pydantic import BaseModel # Ensure BaseModel is imported
from typing import Optional

from services.llm import (
    explain_concept,
    generate_quiz,
    BackendLLMConfig,
    LLMProviderError,
)
from services.voices_mods import text_to_speech, VoiceProcessingError
from services.event_logger import log_user_event


router = APIRouter()

class TTSRequest(BaseModel):
    text: str

@router.post("/tts")
async def text_to_speech_endpoint(request_data: TTSRequest):
    try:
        print("[DEBUG] /tts text:", request_data.text)
        audio_base64 = await text_to_speech(request_data.text)
        return {"audio": audio_base64}
    except VoiceProcessingError as e:
        print("[ERROR] TTS failed:", str(e))
        raise HTTPException(500, detail=f"TTS generation failed: {str(e)}")
    except Exception as e:
        print("[EXCEPTION] TTS internal error:", str(e))
        raise HTTPException(500, detail=f"Internal server error during TTS: {str(e)}")

# from json import JSONDecodeError
# from fastapi import APIRouter, UploadFile, HTTPException, Request
# from services.voices_mods import process_voice_query, text_to_speech

# # Create router instance
# router = APIRouter()

# @router.post("/voice/ask")
# async def voice_ask_endpoint(
#     audio: UploadFile, 
#     user_id: str, 
#     topic: str = "general"
# ):
#     try:
#         audio_data = await audio.read()
#         return await process_voice_query(audio_data, user_id, topic)
#     except Exception as e:
#         raise HTTPException(500, detail=str(e))

# @router.post("/tts")
# async def text_to_speech_endpoint(request: Request):
#     try:
#         data = await request.json()
#     except JSONDecodeError:
#         raise HTTPException(400, detail="Invalid JSON payload")
    
#     if 'text' not in data or not data['text']:
#         raise HTTPException(400, detail="Missing 'text' field in payload")
    
#     audio_base64 = await text_to_speech(data['text'])
#     if not audio_base64:
#         raise HTTPException(500, detail="TTS generation failed (Omnidimension error or no audio returned)")
#     return {"audio": audio_base64}
