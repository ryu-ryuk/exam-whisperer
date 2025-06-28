import fitz  # pymupdf
import re
import json
from services.llm import _call_llm

async def parse_pdf_topics(file_path: str) -> list[str]:
    """extract topics from a syllabus or textbook PDF using LLM"""
    doc = fitz.open(file_path)
    text_chunks = []

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
        "The following is a university syllabus or textbook extract.\n"
        "Extract a list of 10–20 major academic **topics** or **sections** covered.\n"
        "Respond ONLY as a valid JSON list of strings like:\n"
        "[\"Data Structures\", \"TCP/IP\", \"Docker\", \"AWS\"]\n\n"
        f"{full_text}"
    )


    try:
        raw = (await _call_llm(prompt)).strip()

        if raw.startswith("```"):
            import re
            raw = re.sub(r"^```[a-zA-Z]*\n?", "", raw).strip()
            raw = re.sub(r"\n?```$", "", raw).strip()

        try:
            topics = json.loads(raw)
            if isinstance(topics, list):
                return [t.strip() for t in topics if isinstance(t, str)]
        except json.JSONDecodeError:
            print("⚠️ LLM did not return valid JSON, trying fallback")

            # fallback: split on line or commas
            lines = raw.split("\n")
            candidates = [l.strip() for l in lines if l.strip()]
            if len(candidates) < 3:
                candidates = [x.strip() for x in raw.split(",") if x.strip()]

            return candidates
    except Exception as e:
        print("❌ Error in parse_pdf_topics:", e)

    return []

