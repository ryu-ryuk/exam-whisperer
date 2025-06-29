# import os
# import logging
# import base64
# from omnidimension import Client, APIError

# from .llm import explain_concept

# # Initialize client
# api_key = os.getenv("OMNIDIM_API_KEY")
# client = Client(api_key) if api_key else None

# def get_omnidim_voice_id():
#     # You can make this dynamic or configurable
#     return "hT1MsRBLaHSXGeWzW6xF"
# async def text_to_speech(text: str, voice: str = None) -> str:
#     if not client:
#         logging.error("OmniDimension client not initialized")
#         return None
#     try:
#         voice_id = voice or get_omnidim_voice_id()
#         tts_response = client.agent.call_tts(
#             agent_id=os.getenv("OMNIDIM_AGENT_ID"),
#             text=text,
#             voice_id=voice_id
#         )
#         return base64.b64encode(tts_response.audio).decode('utf-8')
#     except APIError as e:
#         logging.error(f"TTS error: {e.message}")
#     except Exception as e:
#         logging.exception("TTS conversion failed")
#     return None

# async def process_voice_query(audio_data: bytes, user_id: str, topic: str) -> dict:
#     if not client:
#         logging.error("OmniDimension client not initialized")
#         return {"error": "Voice service unavailable"}
    
#     try:
#         # STT conversion
#         stt_response = client.speech.to_text(audio=audio_data)
#         question = stt_response.text.strip()
#         logging.info(f"Transcribed: {question}")
        
#         # Get LLM explanation
#         result = await explain_concept(question, user_id, topic)
        
#         # Prepare response WITHOUT generating TTS immediately
#         return {
#             "text_response": result["explanation"],
#             "topic": result["topic"],
#             "related_topics": result["related_topics"],
#             # Audio will be generated on-demand via text_to_speech()
#         }
#     except APIError as e:
#         logging.error(f"API error: {e.message}")
#         return {"error": f"API Error ({e.status_code})"}
#     except Exception as e:
#         logging.exception("Processing failed")
#         return {"error": f"Internal error: {str(e)}"}
