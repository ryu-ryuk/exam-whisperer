import pathway as pw


# ===== SCHEMA DEFINITIONS =====
class ContentSchema(pw.Schema):
    user_id: str
    topic: str
    content: str
    timestamp: pw.DateTimeUtc


class AttemptSchema(pw.Schema):
    user_id: str
    topic: str
    score: float
    timestamp: pw.DateTimeUtc


def build_pathway_pipeline():
    # === READ STREAMS ===
    content_updates = pw.io.jsonlines.read(
        "data/content_updates.jsonl", schema=ContentSchema
    )
    attempts = pw.io.jsonlines.read(
        "data/topic_attempts.jsonl", schema=AttemptSchema
    )
    attempts = attempts.filter(pw.this.score != None)
    # ===== KNOWLEDGE BASE PIPELINE =====
    max_ts_content = (
        content_updates.groupby(content_updates.user_id, content_updates.topic)
        .reduce(
            user_id=pw.this.user_id,
            topic=pw.this.topic,
            max_timestamp=pw.reducers.max(content_updates.timestamp),
        )
    )

    latest_content = (
        content_updates
        .join(
            max_ts_content,
            content_updates.user_id == max_ts_content.user_id,
            content_updates.topic == max_ts_content.topic,
        )
        .filter(content_updates.timestamp == max_ts_content.max_timestamp)
        .select(
            user_id=content_updates.user_id,
            topic=content_updates.topic,
            content=content_updates.content,
            updated_at=content_updates.timestamp,
        )
    )

    pw.io.jsonlines.write(latest_content, filename="data/latest_content.jsonl")

    # ===== PROGRESS PIPELINE =====
    last_ts = (
        attempts.groupby(attempts.user_id, attempts.topic)
        .reduce(
            user_id=pw.this.user_id,
            topic=pw.this.topic,
            last_attempt=pw.reducers.max(attempts.timestamp),
        )
    )

    latest_scores = (
        attempts
        .join(
            last_ts,
            attempts.user_id == last_ts.user_id,
            attempts.topic == last_ts.topic,
            attempts.timestamp == last_ts.last_attempt,
        )
        .select(
            user_id=attempts.user_id,
            topic=attempts.topic,
            latest_score=attempts.score,
            last_attempt=last_ts.last_attempt,
        )
    )

    average_scores = (
        attempts.groupby(attempts.user_id, attempts.topic)
        .reduce(
            user_id=pw.this.user_id,
            topic=pw.this.topic,
            average_score=pw.reducers.avg(attempts.score),
        )
    )

    progress = (
        latest_scores
        .join(
            average_scores,
            latest_scores.user_id == average_scores.user_id,
            latest_scores.topic == average_scores.topic,
        )
        .select(
            user_id=latest_scores.user_id,
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


if __name__ == "__main__":
    build_pathway_pipeline()
    pw.run()

