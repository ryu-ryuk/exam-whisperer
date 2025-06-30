
from fastapi import APIRouter, HTTPException
import json
from typing import List

router = APIRouter()

@router.get("/topics/{user_id}", response_model=List[str])
def get_user_topics(user_id: str):
    try:
        with open("data/latest_content.jsonl", "r", encoding="utf-8") as f:
            lines = f.readlines()
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="Latest content data not found.")

    topics = []
    for line in lines:
        try:
            record = json.loads(line)
            if record.get("user_id") == user_id and "topic" in record:
                topics.append(record["topic"])
        except json.JSONDecodeError:
            continue

    if not topics:
        raise HTTPException(status_code=404, detail="No topics found for user.")

    return sorted(set(topics))  # deduplicate + sort