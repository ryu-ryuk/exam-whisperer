import json
from pathlib import Path
import os
import logging
from services.llm import explain_concept
# from omnidimension import Client, APIError


# client init 
api_key = os.getenv("OMNIDIM_API_KEY")
# client = Client(api_key)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
LATEST_KB = Path("data/latest_content.jsonl")

async def voice_ask(audio_data: bytes, user_id: str, topic: str) -> dict:
    try:
        # STT with SDK
        # stt_response = client.speech.to_text(audio=audio_data)
        # question = stt_response.text.strip()
        # logging.info(f"Transcribed question: {question}")
        
        # get explanation from your LLM service
        result = await explain_concept(user_id, topic)
        
        # TTS with SDK
        # tts_response = client.text.to_speech(
        #     text=result["explanation"],
        #     voice="default"
        # )
        # audio_response = tts_response.audio
        
        # Save interaction
        with LATEST_KB.open("a", encoding="utf-8") as f:
            f.write(json.dumps({
                "user_id": user_id,
                "type": "voice_interaction",
                "topic": result["topic"],
                # "question": question,
                "explanation": result["explanation"]
            }) + "\n")
        
        return {
            # "question": question,
            "explanation": result["explanation"],
            "topic": result["topic"],
            "related_topics": result["related_topics"],
            # "audio_response": audio_response.hex()
        }
    # except APIError as e:
    #     logging.error(f"OmniDimension API error: {e.message}")
    #     return {"error": f"API Error ({e.status_code})"}
    except Exception as e:
        logging.error(f"Processing error: {str(e)}")
        return {"error": "Internal processing error"}

