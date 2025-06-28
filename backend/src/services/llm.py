"""
abstracts all interactions with LLMs (openai, gemini, ollama, etc).

- handles model-specific prompt formatting
- routes calls to the selected backend based on config
- used by /ask, /quiz, and topic detection
"""

import os, json, logging
import httpx
from pathlib import Path
from cachetools import TTLCache
from services.quiz_utils import parse_quiz_text
from services.tracker import get_user_context
from cachetools import TTLCache

# –– config ––
PROVIDER = os.getenv("LLM_PROVIDER", "openai")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral")
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
openai_client = None

if PROVIDER == "openai" and OPENAI_KEY:
    from openai import AsyncOpenAI
    openai_client = AsyncOpenAI(api_key=OPENAI_KEY)

LATEST_KB = Path("data/latest_content.jsonl")
cache = TTLCache(maxsize=256, ttl=600)

class LLMProviderError(Exception):
    pass
session_context = TTLCache(maxsize=1000, ttl=1800)
# –– main explain api ––
async def explain_concept(question: str, user_id: str, topic: str) -> dict:
    if not question.strip():
        raise ValueError("Question cannot be empty.")
    
    cache_key = (user_id, topic, question)
    if cache_key in cache:
        return cache[cache_key]
    
    topic = (topic.strip() if topic else None) or (await detect_topic(question)).strip()
    user_context = get_user_context(user_id, topic)
    
    # check for short-term prior question
    prior_question = session_context.get(user_id)
    
    prompt_parts = []
    if prior_question:
        prompt_parts.append(
            f"Previously, the user asked: '{prior_question}'. Use this as context if the current question depends on it.\n"
        )

    prompt_parts.extend([
        f"Current question: {question}",
        "",
        "–– Use the student’s context below to tailor the explanation ––",
        f"Context: {json.dumps(user_context, indent=2) or '[No context available]'}",
        "",
        "Explain the concept clearly and concisely in 100-150 words."
    ])
    prompt = "\n".join(prompt_parts)

    try:
        explanation = await _call_llm(prompt)
        related_topics = await suggest_related_topics(topic, user_id)
        
        result = {
            "explanation": explanation.strip() or f"No explanation available for {topic}.",
            "topic": topic or "Unknown",
            "related_topics": related_topics,
            "confidence": 0.95
        }
        cache[cache_key] = result

        # update session-level context
        session_context[user_id] = question.strip()

        return result
    except LLMProviderError as e:
        return {
            "explanation": f"Error: {str(e)}",
            "topic": topic or "Unknown",
            "related_topics": [],
            "confidence": 0.0
        }


# –– related topics ––
async def suggest_related_topics(topic: str, user_id: str) -> list[str]:
    cache_key = (user_id, "related_topics", topic)
    if cache_key in cache:
        return cache[cache_key]

    user_context = get_user_context(user_id, topic)
    prompt = (
        f"Given the topic '{topic}' and the user's context below, suggest 2-3 related academic topics "
        "to study next. Return only the topic names as a JSON list.\n\n"
        f"User context:\n{json.dumps(user_context, indent=2) or '[No context available]'}"
    )
    try:
        response = await _call_llm(prompt)
        related_topics = json.loads(response) if response.strip() else []
        if not isinstance(related_topics, list):
            related_topics = []
        cache[cache_key] = related_topics
        return related_topics
    except (json.JSONDecodeError, LLMProviderError):
        return []

# –– quiz generation ––
async def generate_quiz(topic: str, difficulty: str = "medium"):
    prompt = (
        f"generate a {difficulty} level multiple choice quiz on the topic: {topic}.\n"
        "return exactly 3 questions in this format:\n"
        "Question: <question>\n- option a\n- option b\n- option c\n- option d\nAnswer: <0/1/2/3>\n"
        "NO explanation. NO formatting. plain text only."
    )
    raw = await _call_llm(prompt)
    return parse_quiz_text(raw)

# –– topic detection ––
async def detect_topic(question: str) -> str:
    prompt = (
        "analyze the academic question below and return the most relevant topic or subject "
        "it belongs to (e.g., 'linear algebra', 'organic chemistry', 'mughal history', etc).\n"
        "respond ONLY with the topic name.\n\n"
        f"question: {question}"
    )
    return (await _call_llm(prompt)).strip()

# –– fallback engine router ––
async def _call_llm(prompt: str, preferred_provider: str = PROVIDER) -> str:
    providers = {
        "openai": _openai_chat,
        "gemini": _gemini_chat,
        "ollama": _ollama_chat
    }
    for provider, func in providers.items():
        if provider == preferred_provider or preferred_provider not in providers:
            try:
                result = await func(prompt)
                if result.strip():
                    return result
            except LLMProviderError:
                continue
    raise LLMProviderError("All LLM providers failed.")

# –– LLM backends ––

async def _openai_chat(prompt: str) -> str:
    if openai_client is None:
        return ""
    try:
        res = await openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
        )
        return res.choices[0].message.content.strip()
    except Exception:
        return ""

async def _gemini_chat(prompt: str) -> str:
    if not GEMINI_KEY:
        return ""
    try:
        async with httpx.AsyncClient() as client:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_KEY}"
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            res = await client.post(url, json=payload)
            raw = res.json()
            return raw["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception:
        return ""

async def _ollama_chat(prompt: str) -> str:
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "http://localhost:11434/api/generate",
                json={"model": OLLAMA_MODEL, "prompt": prompt},
            )
            full_response = ""
            async for chunk in res.aiter_lines():
                if chunk.strip():
                    data = json.loads(chunk)
                    full_response += data.get("response", "")
            return full_response.strip()
    except Exception:
        return ""

# –– optional: get user's last saved KB content on a topic ––
def get_user_topic_bucket(user_id: str, topic: str) -> str:
    if not LATEST_KB.exists():
        return ""
    with LATEST_KB.open(encoding="utf-8") as f:
        for line in f:
            rec = json.loads(line)
            if rec["user_id"] == user_id and rec["topic"] == topic:
                return rec.get("content", "")
    return ""
