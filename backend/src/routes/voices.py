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