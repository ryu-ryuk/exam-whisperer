import time, json
from pathlib import Path
from services.db_service import upsert_user_topic_progress


JSONL_PATH   = Path("data/user_topic_progress.jsonl")
OFFSET_PATH = Path("data/user_topic_progress.offset")
POLL_INTERVAL = 2  # seconds

def load_offset() -> int:
    if OFFSET_PATH.exists():
        return int(OFFSET_PATH.read_text())
    return 0

def save_offset(val: int):
    OFFSET_PATH.write_text(str(val))

def run_uploader():
    """
    Tail the JSONL and upsert each new record into Postgres.
    """
    offset = load_offset()
    # ensure files
    JSONL_PATH.parent.mkdir(exist_ok=True, parents=True)
    JSONL_PATH.touch(exist_ok=True)

    while True:
        lines = JSONL_PATH.read_text().splitlines()
        total = len(lines)
        if total > offset:
            for idx in range(offset, total):
                try:
                    rec = json.loads(lines[idx])
                    upsert_user_topic_progress(rec)
                except Exception as e:
                    print(f"Error processing line {idx}:", e)
                else:
                    offset = idx + 1
            save_offset(offset)
        time.sleep(POLL_INTERVAL)

