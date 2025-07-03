import os, json, logging
import httpx
from pathlib import Path
from cachetools import TTLCache
from pydantic import BaseModel
from typing import Optional
from models import BackendLLMConfig

# Removed parse_quiz_text as generate_quiz now directly outputs JSON from LLM
from services.tracker import get_user_context, log_topic_attempt

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# --- Custom Exception Classes ---
class VoiceProcessingError(Exception):
    pass

class LLMProviderError(Exception):
    pass



# --- Caching and Knowledge Base Path ---
cache = TTLCache(maxsize=256, ttl=600)
session_context = TTLCache(maxsize=1000, ttl=1800)
LATEST_KB = Path("data/latest_content.jsonl")

# --- LLM Backends (Provider-Specific Implementations - Defined FIRST to avoid NameError) ---

async def _openai_chat(prompt: str, api_key: str, model: str, temperature: float, max_tokens: int, system_message: Optional[dict] = None) -> str:
    """Handles chat completions with OpenAI models."""
    if not api_key:
        raise LLMProviderError("OpenAI API Key is missing.")
    try:
        from openai import AsyncOpenAI
        openai_client = AsyncOpenAI(api_key=api_key)
        
        messages_payload = []
        if system_message:
            messages_payload.append(system_message)
        messages_payload.append({"role": "user", "content": prompt})

        res = await openai_client.chat.completions.create(
            model=model,
            messages=messages_payload,
            temperature=temperature,
            max_tokens=max_tokens,
            timeout=60 # Add timeout for network requests
        )
        return res.choices[0].message.content.strip()
    except Exception as e:
        logging.error(f"OpenAI call failed: {e}")
        raise LLMProviderError(f"OpenAI API call failed: {e}")

async def _gemini_chat(prompt: str, api_key: str, model: str, temperature: float, max_tokens: int, system_message: Optional[dict] = None) -> str:
    """Handles chat completions with Google Gemini models."""
    if not api_key:
        raise LLMProviderError("Gemini API Key is missing.")
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        
        contents = []
        if system_message:
            contents.append({"role": "user", "parts": [{"text": system_message["content"]}]})
            contents.append({"role": "model", "parts": [{"text": "Okay, I understand."}]})
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=60)
            response.raise_for_status() 
            raw = response.json()
            if "candidates" not in raw or not raw["candidates"]:
                raise LLMProviderError("Gemini response missing candidates.")
            return raw["candidates"][0]["content"]["parts"][0]["text"].strip()
    except httpx.HTTPStatusError as e:
        logging.error(f"Gemini HTTP error: {e.response.status_code} - {e.response.text}")
        raise LLMProviderError(f"Gemini API HTTP Error: {e.response.status_code} - {e.response.text}")
    except Exception as e:
        logging.error(f"Gemini call failed: {e}")
        raise LLMProviderError(f"Gemini API call failed: {e}")

async def _ollama_chat(prompt: str, api_key: str, model: str, temperature: float, max_tokens: int, system_message: Optional[dict] = None) -> str:
    """Handles chat completions with Ollama models (local or remote)."""
    # Ollama often doesn't use an API key in the same way, but the parameter is passed for consistency.
    try:
        messages_payload = []
        if system_message:
            messages_payload.append({"role": "system", "content": system_message["content"]})
        messages_payload.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:11434/api/chat", # Default Ollama endpoint
                json={
                    "model": model,
                    "messages": messages_payload,
                    "temperature": temperature,
                    "options": {"num_predict": max_tokens} # Ollama uses num_predict for max_tokens
                },
                timeout=120 # Increased timeout for local models that might be slow to start
            )
            response.raise_for_status()
            full_response = ""
            async for chunk_line in response.aiter_lines():
                if chunk_line.strip():
                    data = json.loads(chunk_line)
                    if "content" in data.get("message", {}):
                        full_response += data["message"]["content"]
                    if data.get("done"): # Check for 'done' status to break loop
                        break
            return full_response.strip()
    except httpx.HTTPStatusError as e:
        logging.error(f"Ollama HTTP error: {e.response.status_code} - {e.response.text}")
        raise LLMProviderError(f"Ollama API HTTP Error: {e.response.status_code} - {e.response.text}")
    except Exception as e:
        logging.error(f"Ollama call failed: {e}")
        raise LLMProviderError(f"Ollama API call failed: {e}")

# --- Core LLM Routing Function (Uses helper functions defined above) ---
async def _call_llm(
    prompt: str,
    llm_config: Optional[BackendLLMConfig],
    temperature: float = 0.7,
    max_tokens: int = 500,
    system_message: Optional[dict] = None
) -> str:
    """
    Routes LLM calls to the selected provider (OpenAI, Gemini, Ollama).
    Ensures LLM configuration is valid before making the call.
    """
    # Patch: Only require api_key for OpenAI and Gemini, not for Ollama
    if llm_config is None or not llm_config.provider or not llm_config.model:
        raise LLMProviderError("LLM configuration (provider, model) is incomplete or missing.")
    if llm_config.provider in ("openai", "gemini") and not llm_config.api_key:
        raise LLMProviderError(f"{llm_config.provider.capitalize()} API Key is missing.")

    providers = {
        "openai": _openai_chat,
        "gemini": _gemini_chat,
        "ollama": _ollama_chat
    }

    selected_provider_func = providers.get(llm_config.provider)
    if not selected_provider_func:
        raise LLMProviderError(f"Unsupported LLM provider: {llm_config.provider}")

    try:
        result = await selected_provider_func(
            prompt,
            api_key=llm_config.api_key,
            model=llm_config.model,
            temperature=temperature,
            max_tokens=max_tokens,
            system_message=system_message
        )
        if result is None or not result.strip():
            raise LLMProviderError("LLM returned an empty response.")
        return result
    except Exception as e:
        logging.error(f"Error calling {llm_config.provider} LLM: {e}")
        raise LLMProviderError(f"Error calling {llm_config.provider}: {e}")

# --- Main Explain Concept API Function ---
async def explain_concept(
    question: str,
    username: str,
    topic: str = "",
    system_prompt: str = "You are Exam Whisperer, a helpful AI tutor.",
    temperature: float = 0.7,
    max_tokens: int = 500,
    llm_config: Optional[BackendLLMConfig] = None
) -> dict:
    """Explains a concept using the configured LLM, incorporating user context and topic detection."""
    logging.info(f"[explain_concept] question={question!r}, username={username!r}, topic={topic!r}, llm_config={llm_config}")

    if not question.strip():
        raise ValueError("Question cannot be empty.")

    # Cache key needs to handle Optional llm_config gracefully, by providing defaults if None
    cache_key_parts = (username, topic, question, system_prompt, temperature, max_tokens)
    if llm_config:
        cache_key = cache_key_parts + (llm_config.provider, llm_config.model)
    else:
        cache_key = cache_key_parts + ("default_provider", "default_model") # Use string defaults for cache key
    
    if cache_key in cache:
        logging.info(f"[explain_concept] cache hit for key={cache_key}")
        return cache[cache_key]

    # Topic detection uses LLM, so llm_config is passed
    topic = (topic.strip() if topic else None) or (await detect_topic(question, llm_config)).strip()
    logging.info(f"[explain_concept] detected topic: {topic}")
    
    # Assuming get_user_context exists and is imported
    user_context = get_user_context(username, topic)
    logging.info(f"[explain_concept] user_context: {user_context}")

    prior_question = session_context.get(username)
    logging.info(f"[explain_concept] prior_question: {prior_question}")

    system_message = {"role": "system", "content": system_prompt}

    prompt_parts = []
    if prior_question:
        prompt_parts.append(f"Previously, the user asked: '{prior_question}'. Use this as context if the current question depends on it.\n")

    prompt_parts.extend([
        f"Current question: {question}",
        "",
        "You MUST use the following context to craft your explanation.",
        "Only use external knowledge if the context is insufficient.",
        f"Context:\n{json.dumps(user_context, indent=2) or '[No context available]'}",
        "",
        "Explain the concept clearly and concisely and ENSURE that the answer is formatted in markdown."
    ])

    if max_tokens:
        prompt_parts.append(f"Ensure your response is around {max_tokens * 0.8 / 4:.0f}-{max_tokens / 4:.0f} words to fit within {max_tokens} tokens.")
    else:
        prompt_parts.append("Explain the concept clearly and concisely in 100-150 words.")

    prompt = "\n".join(prompt_parts)
    logging.info(f"[explain_concept] prompt: {prompt}")

    try:
        explanation = await _call_llm(
            prompt,
            llm_config=llm_config,
            temperature=temperature,
            max_tokens=max_tokens,
            system_message=system_message
        )

        await log_topic_attempt(username, topic, score=0.3, source="ask")

        related_topics = await suggest_related_topics(topic, username, llm_config)
        logging.info(f"[explain_concept] related_topics: {related_topics}")
        result = {
            "content": explanation.strip() if explanation else "",
            "topic": topic or "Unknown",
            "related_topics": related_topics,
            "confidence": 0.95
        }
        cache[cache_key] = result
        logging.info(f"[explain_concept] result: {result}")
        return result
    except LLMProviderError as e:
        logging.error(f"[explain_concept] LLMProviderError: {e}")
        return {
            "content": f"Error: Failed to get explanation from AI provider. Please check your API key and try again. Details: {str(e)}",
            "topic": topic or "Unknown",
            "related_topics": [],
            "confidence": 0.0
        }
    except Exception as e:
        logging.exception(f"[explain_concept] Unexpected error: {e}")
        raise

# --- LLM Judge Score ---
async def llm_judge_score(question: str, correct_answer: str, user_answer: str, context: dict, llm_config: Optional[BackendLLMConfig]) -> float:
    """Judges the correctness of a user's answer using an LLM, returning a score from 0-1."""
    prompt = (
        f"You're evaluating a student's MCQ answer.\n\n"
        f"Question: {question}\n"
        f"Correct answer: {correct_answer}\n"
        f"User's answer: {user_answer}\n\n"
        f"Student context:\n{json.dumps(context, indent=2)}\n\n"
        f"Return a float between 0 and 1 indicating how close the user's answer is to the correct one.\n"
        f"0 means completely wrong, 1 means correct, values like 0.4 mean partially correct or guessed.\n"
        f"Respond ONLY with the score."
    )
    score_str = await _call_llm(prompt, llm_config=llm_config, temperature=0.2, max_tokens=10)
    try:
        return float(score_str.strip())
    except Exception:
        logging.error(f"Could not parse LLM judge score to float: '{score_str}'")
        return 0.0

# --- Related Topics Suggestion ---
async def suggest_related_topics(topic: str, username: str, llm_config: Optional[BackendLLMConfig]) -> list[str]:
    """Suggests related academic topics using the configured LLM."""
    # Cache key needs to handle Optional llm_config gracefully
    cache_key_parts = (username, "related_topics", topic)
    if llm_config:
        cache_key = cache_key_parts + (llm_config.provider, llm_config.model)
    else:
        cache_key = cache_key_parts + ("default_provider", "default_model")
    
    if cache_key in cache:
        return cache[cache_key]

    user_context = get_user_context(username, topic)
    prompt = (
        f"Given the topic '{topic}' and the user's context below, suggest 2-3 related academic topics "
        "to study next. Return only the topic names as a JSON list.\n\n"
        f"User context:\n{json.dumps(user_context, indent=2) or '[No context available]'}"
    )
    try:
        response = await _call_llm(prompt, llm_config=llm_config, temperature=0.7, max_tokens=100)
        related_topics = json.loads(response) if response.strip() else []
        if not isinstance(related_topics, list):
            related_topics = []
        cache[cache_key] = related_topics
        return related_topics
    except (json.JSONDecodeError, LLMProviderError):
        logging.error(f"[suggest_related_topics] Failed to suggest topics or LLM error.")
        return []

# --- Quiz Generation ---
async def generate_quiz(topic: str, difficulty: str = "medium", llm_config: Optional[BackendLLMConfig] = None) -> dict:
    """
    Generates a single, structured MCQ quiz question in JSON format via LLM.
    This function is intended to be called by the quiz router.
    """
    raw_llm_response = None
    if not topic.strip():
        raise ValueError("Topic cannot be empty for quiz generation.")

    prompt = (
        f"Generate a {difficulty} level multiple choice quiz question on the topic: '{topic}'.\n"
        "Provide exactly ONE question with 4 options (A, B, C, D). "
        "Also include the correct answer's option ID (e.g., 'A', 'B', 'C', 'D') and a concise feedback/explanation for the correct answer.\n"
        "Return the output as a JSON object with the following keys: 'question', 'options' (list of {id: string, text: string}), 'correctAnswerId' (string), 'feedback' (string).\n"
        "Example: {'question': '...', 'options': [{'id': 'A', 'text': '...'}], 'correctAnswerId': 'A', 'feedback': '...'}\n"
        "Ensure option IDs are single uppercase letters (A, B, C, D)."
    )
    try:
        raw_llm_response = await _call_llm(
            prompt,
            llm_config=llm_config,
            temperature=0.7,
            max_tokens=300,
            system_message={"role": "system", "content": "You are a quiz master. Generate well-structured and clear quiz questions in JSON format."}
        )
        logging.info(f"[generate_quiz] Raw LLM response: {raw_llm_response}")

        # Clean up LLM response if wrapped in triple backticks
        if isinstance(raw_llm_response, str) and raw_llm_response.strip().startswith("```"):
            import re
            raw_llm_response = re.sub(r"^```[a-zA-Z]*\n?", "", raw_llm_response.strip())
            raw_llm_response = re.sub(r"\n?```$", "", raw_llm_response.strip())
        quiz_data = json.loads(raw_llm_response)

        required_keys = ['question', 'options', 'correctAnswerId', 'feedback']
        if not all(k in quiz_data for k in required_keys):
            raise ValueError(f"LLM response missing required quiz keys: {', '.join(k for k in required_keys if k not in quiz_data)} - Raw: {raw_llm_response}")
        if not isinstance(quiz_data['options'], list) or not all(isinstance(opt, dict) and 'id' in opt and 'text' in opt for opt in quiz_data['options']):
            raise ValueError(f"LLM options not in expected format: {raw_llm_response}")

        return quiz_data # Directly return the parsed JSON
    except (json.JSONDecodeError, LLMProviderError, ValueError) as e:
        logging.error(f"[generate_quiz] Failed to parse quiz or LLM error: {e} - Raw LLM Response: {raw_llm_response}")
        raise LLMProviderError(f"Failed to generate valid quiz: {e}")

# --- Topic Detection ---
async def detect_topic(question: str, llm_config: Optional[BackendLLMConfig]) -> str:
    """Detects the most relevant topic for a given question using an LLM."""
    prompt = (
        "Analyze the academic question below and return the most relevant topic or subject "
        "it belongs to (e.g., 'linear algebra', 'organic chemistry', 'mughal history', etc).\n"
        "Respond ONLY with the topic name.\n\n"
        f"question: {question}"
    )
    return (await _call_llm(prompt, llm_config=llm_config, temperature=0.1, max_tokens=50)).strip()


# --- Optional: get user's last saved KB content on a topic ---
def get_user_topic_bucket(username: str, topic: str) -> str:
    """Fetches user's knowledge base content for a specific topic."""
    if not LATEST_KB.exists():
        return ""
    with LATEST_KB.open(encoding="utf-8") as f:
        for line in f:
            rec = json.loads(line)
            if rec["username"] == username and rec["topic"] == topic:
                return rec.get("content", "")
    return ""