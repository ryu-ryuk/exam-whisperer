import os
from pathlib import Path
import pathway as pw

class AttemptSchema(pw.Schema):
    user_id: str
    topic: str
    score: float
    timestamp: pw.DateTimeUtc

# 1) Read attempts
attempts = pw.io.jsonlines.read(
    path="data/topic_attempts.jsonl",
    schema=AttemptSchema,
)

# 2) Compute last_attempt (max timestamp) per (user_id, topic)
last_ts = (
    attempts
    .groupby(attempts.user_id, attempts.topic)
    .reduce(
        user_id      = pw.this.user_id,
        topic        = pw.this.topic,
        last_attempt = pw.reducers.max(attempts.timestamp),
    )
)

# 3) Join back to get the score at that timestamp
latest_scores = (
    attempts
    .join(
        last_ts,
        attempts.user_id  == last_ts.user_id,
        attempts.topic    == last_ts.topic,
        attempts.timestamp== last_ts.last_attempt,
    )
    .select(
        user_id      = attempts.user_id,
        topic        = attempts.topic,
        latest_score = attempts.score,
        last_attempt = last_ts.last_attempt,
    )
)

# 4) Compute average score per (user_id, topic)
average_scores = (
    attempts
    .groupby(attempts.user_id, attempts.topic)
    .reduce(
        user_id       = pw.this.user_id,
        topic         = pw.this.topic,
        average_score = pw.reducers.avg(attempts.score),
    )
)

# 5) Join latest & average, then derive trend/status
progress = (
    latest_scores
    .join(
        average_scores,
        latest_scores.user_id == average_scores.user_id,
        latest_scores.topic   == average_scores.topic,
    )
    .select(
        user_id       = latest_scores.user_id,
        topic         = latest_scores.topic,
        latest_score  = latest_scores.latest_score,
        average_score = average_scores.average_score,
        last_attempt  = latest_scores.last_attempt,
        trend         = pw.apply(
            lambda l, a: "improving" if l > a else ("declining" if l < a else "steady"),
            latest_scores.latest_score,
            average_scores.average_score
        ),
        status        = pw.apply(
            lambda s: "mastered" if s >= 0.8 else ("learning" if s >= 0.5 else "weak"),
            latest_scores.latest_score
        )
    )
)

# 6) Write and run
pw.io.jsonlines.write(progress, filename="data/user_topic_progress.jsonl")
pw.run()

