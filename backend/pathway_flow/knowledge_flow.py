
import pathway as pw

class ContentSchema(pw.Schema):
    user_id: str
    topic: str
    content: str
    timestamp: pw.DateTimeUtc

uploads = pw.io.jsonlines.read(
    path="data/content_updates.jsonl",
    schema=ContentSchema,
)

#  Materialize only the latest content per user+topic
#latest_content = (
#    uploads
#    .groupby(uploads.user_id, uploads.topic)
#    .reduce(
#        user_id=pw.this.user_id,
#        topic=pw.this.topic,
#        content=pw.reducers.last(uploads.content),
#        updated_at=pw.reducers.max(uploads.timestamp),
#    )
#)

# group solely by topic now
latest_content = (
    uploads
    .groupby(uploads.topic)
    .reduce(
        topic=pw.this.topic,
        content=pw.reducers.last(uploads.content),
        updated_at=pw.reducers.max(uploads.timestamp),
    )
)

# Write it out so your app can consume
pw.io.jsonlines.write(
    latest_content,
    path="data/latest_content.jsonl"
)

pw.run()

