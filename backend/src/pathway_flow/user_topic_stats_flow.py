import pathway as pw
import os
import urllib.parse

class TopicAttemptSchema(pw.Schema):
    user_id: str
    topic: str
    score: float
    timestamp: pw.DateTimeUtc

attempts = pw.io.jsonlines.read(
    path="data/topic_attempts.jsonl",
    schema=TopicAttemptSchema,
)

user_topic_stats = (
    attempts
    .groupby(attempts.user_id, attempts.topic)
    .reduce(
        user_id=pw.this.user_id,
        topic=pw.this.topic,
        last_attempt=pw.reducers.max(attempts.timestamp),
        average_score=pw.reducers.avg(attempts.score),
        attempts_count=pw.reducers.count(),
    )
)

def get_mastery(avg_score):
    if avg_score >= 0.8:
        return "strong"
    elif avg_score >= 0.5:
        return "average"
    return "weak"

user_topic_stats = user_topic_stats.with_columns(
    mastery_status=pw.apply(get_mastery, user_topic_stats.average_score)
)

DB_URL = os.getenv("DATABASE_URL")

if DB_URL and DB_URL.startswith("postgresql://"):
    url = urllib.parse.urlparse(DB_URL)
    connection_string_parts = {
        "host": url.hostname,
        "port": str(url.port),
        "dbname": url.path.lstrip("/"),
        "user": url.username,
        "password": url.password,
    }
else:
    raise ValueError("DATABASE_URL is not set or not a valid postgres URL")

pw.io.postgres.write(
    user_topic_stats,
    connection_string_parts,
    "user_topic_activity",
    init_mode="replace",
)

pw.run()
