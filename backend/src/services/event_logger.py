import json
from pathlib import Path
from datetime import datetime

EVENT_LOG_PATH = Path("data/user_events.jsonl")


def log_user_event(username, event_type, topic=None, details=None):
    event = {
        "username": username,
        "event_type": event_type,
        "topic": topic,
        "timestamp": datetime.utcnow().isoformat(),
        "details": details or {}
    }
    with EVENT_LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(event) + "\n")
