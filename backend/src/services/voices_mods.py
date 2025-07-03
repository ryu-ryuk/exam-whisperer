import os
import base64
import logging
import requests
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class VoiceProcessingError(Exception):
    pass

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
DEEPGRAM_MODEL = os.getenv("DEEPGRAM_MODEL", "aura-2-thalia-en")

async def text_to_speech(text: str) -> str:
    if not text:
        raise VoiceProcessingError("Empty text input")

    url = "https://api.deepgram.com/v1/speak"
    headers = {
        "Authorization": f"Token {DEEPGRAM_API_KEY}",
        "Content-Type": "application/json"
    }
    params = {"model": DEEPGRAM_MODEL}
    payload = {"text": text}

    try:
        logger.info(f"Calling Deepgram TTS with model: {DEEPGRAM_MODEL}")
        response = requests.post(url, headers=headers, json=payload, params=params, timeout=20)

        if response.status_code != 200:
            logger.error("Deepgram error: %s", response.text)
            raise VoiceProcessingError(f"Deepgram error {response.status_code}: {response.text}")

        return base64.b64encode(response.content).decode("utf-8")

    except requests.RequestException as e:
        logger.exception("Deepgram TTS request failed")
        raise VoiceProcessingError(f"Deepgram request failed: {str(e)}")
