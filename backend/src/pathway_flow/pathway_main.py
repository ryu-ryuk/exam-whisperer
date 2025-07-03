import pathway as pw

# ===== SCHEMA DEFINITIONS =====
class ContentSchema(pw.Schema):
    username: str
    topic: str
    content: str
    timestamp: pw.DateTimeUtc


class AttemptSchema(pw.Schema):
    username: str
    topic: str
    score: float
    timestamp: pw.DateTimeUtc


class UserEventSchema(pw.Schema):
    username: str
    event_type: str
    topic: str
    timestamp: pw.DateTimeUtc
    details: dict


def build_pathway_pipeline():
    # === READ STREAMS ===
    content_updates = pw.io.jsonlines.read(
        "data/content_updates.jsonl", schema=ContentSchema
    )
    attempts = pw.io.jsonlines.read(
        "data/topic_attempts.jsonl", schema=AttemptSchema
    )
    attempts = attempts.filter(pw.this.score != None)
    user_events = pw.io.jsonlines.read(
        "data/user_events.jsonl", schema=UserEventSchema
    )

    # ===== KNOWLEDGE BASE PIPELINE =====
    max_ts_content = (
        content_updates.groupby(content_updates.username, content_updates.topic)
        .reduce(
            username=pw.this.username,
            topic=pw.this.topic,
            max_timestamp=pw.reducers.max(content_updates.timestamp),
        )
    )

    latest_content = (
        content_updates
        .join(
            max_ts_content,
            content_updates.username == max_ts_content.username,
            content_updates.topic == max_ts_content.topic,
        )
        .filter(content_updates.timestamp == max_ts_content.max_timestamp)
        .select(
            username=content_updates.username,
            topic=content_updates.topic,
            content=content_updates.content,
            updated_at=content_updates.timestamp,
        )
    )

    pw.io.jsonlines.write(latest_content, filename="data/latest_content.jsonl")

    # ===== PROGRESS PIPELINE =====
    last_ts = (
        attempts.groupby(attempts.username, attempts.topic)
        .reduce(
            username=pw.this.username,
            topic=pw.this.topic,
            last_attempt=pw.reducers.max(attempts.timestamp),
        )
    )

    latest_scores = (
        attempts
        .join(
            last_ts,
            attempts.username == last_ts.username,
            attempts.topic == last_ts.topic,
            attempts.timestamp == last_ts.last_attempt,
        )
        .select(
            username=attempts.username,
            topic=attempts.topic,
            latest_score=attempts.score,
            last_attempt=last_ts.last_attempt,
        )
    )

    average_scores = (
        attempts.groupby(attempts.username, attempts.topic)
        .reduce(
            username=pw.this.username,
            topic=pw.this.topic,
            average_score=pw.reducers.avg(attempts.score),
        )
    )

    progress = (
        latest_scores
        .join(
            average_scores,
            latest_scores.username == average_scores.username,
            latest_scores.topic == average_scores.topic,
        )
        .select(
            username=latest_scores.username,
            topic=latest_scores.topic,
            latest_score=latest_scores.latest_score,
            average_score=average_scores.average_score,
            last_attempt=latest_scores.last_attempt,
            trend=pw.apply(
                lambda l, a: "improving"
                if l > a
                else ("declining" if l < a else "steady"),
                latest_scores.latest_score,
                average_scores.average_score,
            ),
            status=pw.apply(
                lambda s: "mastered"
                if s >= 0.8
                else ("learning" if s >= 0.5 else "weak"),
                latest_scores.latest_score,
            ),
        )
    )

    pw.io.jsonlines.write(progress, filename="data/user_topic_progress.jsonl")

    # ===== USER EVENTS PIPELINE =====
    event_counts = (
        user_events.groupby(user_events.username, user_events.event_type)
        .reduce(
            username=pw.this.username,
            event_type=pw.this.event_type,
            count=pw.reducers.count(),
        )
    )

    pw.io.jsonlines.write(event_counts, filename="data/user_event_counts.jsonl")


if __name__ == "__main__":
    build_pathway_pipeline()
    pw.run()
