"""
abstracts all interactions with LLMs (openai, gemini, ollama, etc).

- handles model-specific prompt formatting
- routes calls to the selected backend based on config
- used by /ask, /quiz, and topic detection
"""

import os
import httpx
import json
from services.quiz_utils import parse_quiz_text
from pathlib import Path

# ------------------------
PROVIDER = os.getenv("LLM_PROVIDER", "openai")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral")
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
print(f"╥﹏╥ loaded LLM config → PROVIDER={os.getenv('LLM_PROVIDER')}, GEMINI_KEY={os.getenv('GEMINI_API_KEY')}")

openai_client = None
if PROVIDER == "openai" and OPENAI_KEY:
    from openai import AsyncOpenAI
    openai_client = AsyncOpenAI(api_key=OPENAI_KEY)

# ------------------------

LATEST_KB = Path("data/latest_content.jsonl")

def get_user_topic_bucket(user_id: str, topic: str) -> str:
    if not LATEST_KB.exists():
        return ""
    with LATEST_KB.open(encoding="utf-8") as f:
        for line in f:
            rec = json.loads(line)
            if rec["user_id"] == user_id and rec["topic"] == topic:
                return rec.get("content", "")
    return ""

async def explain_concept(question: str,user_id:str ,topic: str):
    topic = topic.strip() or (await detect_topic(question)).strip()

    user_notes = get_user_topic_bucket(user_id,topic)

    # build a new prompt that injects their notes first
    prompt_parts = [
        f"topic: {topic}",
        f"question: {question}",
        "",
        "–– Use the student’s own notes below as context (if any) ––",
    ]
    if user_notes:
        prompt_parts.append(user_notes)
    else:
        prompt_parts.append("[No personal notes found for this topic]")
    prompt_parts.append("")
    prompt_parts.append("Now explain the concept clearly and concisely.")

    prompt = "\n".join(prompt_parts)

    if PROVIDER == "gemini":
        explanation = await _gemini_chat(prompt)
    elif PROVIDER == "openai":
        explanation = await _openai_chat(prompt)
    elif PROVIDER == "ollama":
        explanation = await _ollama_chat(prompt)
    else:
        raise ValueError("unsupported LLM_PROVIDER")
    # to ensure both fields are non-empty and match CLI expectations
    if not topic:
        topic = "Unknown"
    if not explanation or not explanation.strip():
        explanation = f"No explanation available for {topic}."
    return explanation.strip(), topic
    
    
async def generate_quiz(topic: str, difficulty: str = "medium"):
    prompt = (
        f"generate a {difficulty} level multiple choice quiz on the topic: {topic}.\n"
        "return exactly 3 questions in this format:\n\n"
        "Question: <question text>\n"
        "- option a\n- option b\n- option c\n- option d\n"
        "Answer: <0/1/2/3>\n\n"
        "NO explanation. NO formatting. plain text only."
    )

    if PROVIDER == "openai":
        raw = await _openai_chat(prompt)
    elif PROVIDER == "gemini":
        raw = await _gemini_chat(prompt)
    elif PROVIDER == "ollama":
        raw = await _ollama_chat(prompt)
    else:
        raise ValueError("unsupported LLM_PROVIDER")

    print("raw quiz response:\n", raw)
    return parse_quiz_text(raw)



async def detect_topic(question: str) -> str:
    prompt = (
        "analyze the academic question below and return the most relevant topic or subject "
        "it belongs to (e.g., 'linear algebra', 'organic chemistry', 'mughal history', 'machine learning'). "
        "respond ONLY with the topic name, nothing else and if the question is something basic and simple then give even concise answer.\n\n"
        f"question: {question}"
    )

    if PROVIDER == "openai":
        return await _openai_chat(prompt)
    elif PROVIDER == "gemini":
        return await _gemini_chat(prompt)
    elif PROVIDER == "ollama":
        return await _ollama_chat(prompt)
    else:
        raise ValueError("unsupported LLM_PROVIDER")

# -------------------------------

# --- OpenAI ---
async def _openai_explain(q: str) -> str:
    prompt = f"explain the following academic concept in simple, concise terms:\n\n{q}"
    return await _openai_chat(prompt)

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

# --- Gemini ---
async def _gemini_chat(prompt: str) -> str:
    if not GEMINI_KEY:
        print("⚠️ gemini key missing")
        return ""
    try:
        async with httpx.AsyncClient() as client:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_KEY}"
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            res = await client.post(url, json=payload)
            raw = res.json()
            print("gemini raw response:", raw)
            return raw["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception as e:
        print("⚠️ gemini error:", e)
        return ""


async def _gemini_explain(q: str) -> str:
    prompt = f"explain the following academic concept in simple, concise terms:\n\n{q}"
    print("🧾 prompt:", prompt)
    return await _gemini_chat(prompt)

# --- Ollama ---
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

async def _ollama_explain(q: str) -> str:
    prompt = f"explain this academic topic clearly:\n\n{q}"
    return await _ollama_chat(prompt)
