import fitz  # pymupdf
import json
from services.llm import _call_llm
from models import BackendLLMConfig

async def parse_pdf_topics(file_path: str, llm_config: dict) -> list[str]:
    """extract topics from a syllabus or textbook PDF using LLM"""
    # Convert dict to BackendLLMConfig if needed
    if isinstance(llm_config, dict):
        llm_config = BackendLLMConfig(**llm_config)

    doc = fitz.open(file_path)
    text_chunks = []
    import re

    def clean_llm_json(raw: str) -> str:
        raw = raw.strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```[a-zA-Z]*\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw)
        return raw

    for i, page in enumerate(doc):
        if i >= 5:
            break
        text = page.get_text().strip()
        if text:
            text_chunks.append(text)

    doc.close()
    full_text = "\n\n".join(text_chunks)

    if not full_text:
        return []

    prompt = (
        "You are an academic content parser.\n"
        "Extract a list of major academic topics from the following text. For each topic, include a short summary or syllabus-style description.\n"
        "The topics should be suitable for a university syllabus or textbook.\n"
        "Return only valid JSON in this format:\n"
        '[{"topic": "Docker", "content": "A platform used for containerizing applications and managing their deployment."}, ...]\n'
        "If no topics are found, return an empty list.\n\n"
        f"{full_text}"
    )



    try:
        raw = clean_llm_json(await _call_llm(prompt, llm_config))
        if raw.startswith("```"):
            import re
            raw = re.sub(r"^```[a-zA-Z]*\n?", "", raw).strip()
            raw = re.sub(r"\n?```$", "", raw).strip()


        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list) and all("topic" in x and "content" in x for x in parsed):
                return parsed
        except json.JSONDecodeError:
            print("⚠️ LLM did not return valid JSON, fallback to topic list")
            
            # fallback: split on line or commas
            lines = raw.split("\n")
            candidates = [l.strip() for l in lines if l.strip()]
            if len(candidates) < 3:
                candidates = [x.strip() for x in raw.split(",") if x.strip()]

            return candidates
    except Exception as e:
        print("❌ Error in parse_pdf_topics:", e)

    return []

