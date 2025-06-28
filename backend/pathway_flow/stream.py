import datetime
import json
import os


def stream_topic_event(user_id: str, topic: str, score: float):
    log_path = "data/topic_attempts.jsonl"
    os.makedirs(os.path.dirname(log_path), exist_ok=True)
    now = datetime.datetime.now(datetime.timezone.utc)
    ts = now.replace(microsecond=(now.microsecond // 1000) * 1000)
    timestamp_str = ts.isoformat(timespec='milliseconds').replace('+00:00', 'Z')
    with open(log_path, "a") as f:
        f.write(json.dumps({
            "user_id": user_id,
            "topic": topic,
            "score": score,
            "timestamp": timestamp_str
        })) 
        f.write("\n")


def stream_content_event(user_id: str, topic: str, content: str):
    log_path = "data/content_updates.jsonl"
    # ensure the folder exists
    os.makedirs(os.path.dirname(log_path), exist_ok=True)

    # UTC timestamp with millisecond precision
    now = datetime.datetime.now(datetime.timezone.utc)
    ts = now.replace(microsecond=(now.microsecond // 1) * 1)
    timestamp = ts.isoformat()


    # append one valid JSON object per line
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(json.dumps({
            "user_id": user_id,
            "topic": topic,
            "content": content,
            "timestamp": timestamp
        }))
        f.write("\n")
   
