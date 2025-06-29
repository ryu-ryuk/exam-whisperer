# pathway_flow/progress_flow.py

import os
from pathlib import Path
import pathway as pw


class AttemptSchema(pw.Schema):
    user_id: str
    topic: str
    score: float
    timestamp: pw.DateTimeUtc

# 2) Read the append‑only JSONL of quiz attempts
attempts = pw.io.jsonlines.read(
    path= "data/topic_attempts.jsonl",
    schema=AttemptSchema,
)

# 3) Compute per-user+topic aggregates:
#    - latest_score: the score at the maximum timestamp
#    - average_score: mean score across all attempts
#    - last_attempt: the maximum timestamp
aggregated = (
    attempts
    .groupby(attempts.user_id, attempts.topic)
    .reduce(
        user_id=pw.this.user_id,
        topic=pw.this.topic,
        average_score=pw.reducers.avg(attempts.score),
        last_attempt=pw.reducers.max(attempts.timestamp),
        # pw.argmax gives the index of the max timestamp; use it to pick the score
        latest_score=pw.reducers.latest(
            attempts.score,
            order_by=attempts.timestamp
        )
    )
)

# 4) Enrich with trend and status
progress = aggregated.select(
    user_id       = pw.this.user_id,
    topic         = pw.this.topic,
    latest_score  = pw.this.latest_score,
    average_score = pw.this.average_score,
    last_attempt  = pw.this.last_attempt,
    trend = pw.case(
        (pw.this.latest_score > pw.this.average_score, "improving"),
        (pw.this.latest_score < pw.this.average_score, "declining"),
        default="steady",
    ),
    status = pw.case(
        (pw.this.latest_score >= 0.8, "mastered"),
        (pw.this.latest_score >= 0.5, "learning"),
        default="weak",
    ),
)

# 5) Write the live progress view to JSONL
pw.io.jsonlines.write(
    progress,
    filename="data/user_topic_progress.jsonl"
)

# 6) Run the streaming pipeline
pw.run()
