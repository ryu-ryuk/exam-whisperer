import pathway as pw

class TopicAttemptSchema(pw.Schema):
    user_id: str
    topic: str
    score: float
    timestamp: pw.DateTimeUtc

# input stream from JSONL
topic_input = pw.io.jsonlines.read(
    path="data/topic_attempts.jsonl",
    schema=TopicAttemptSchema,
)

# aggregations
grouped = topic_input.groupby(pw.this.user_id, pw.this.topic).reduce(
    user_id=pw.this.user_id,
    topic=pw.this.topic,
    average_score = pw.reducers.avg(pw.this.score),
    last_attempt = pw.reducers.max(pw.this.timestamp),
)
# derive mastery label
def label(score: float) -> str:
    if score >= 0.85:
        return "mastered"
    elif score >= 0.5:
        return "improving"
    return "weak"

labeled = grouped.with_columns(mastery_status=pw.apply(label, grouped.average_score))


pw.io.jsonlines.write(labeled, "data/topic_mastery.jsonl")
pw.run()
