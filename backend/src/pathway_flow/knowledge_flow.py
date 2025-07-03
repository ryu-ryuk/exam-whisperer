
# import pathway as pw



# class ContentSchema(pw.Schema):
#     user_id: str
#     topic: str
#     content: str
#     timestamp: pw.DateTimeUtc

# # 1) Read the uploaded stream
# uploads = pw.io.jsonlines.read(
#     path="data/content_updates.jsonl",
#     schema=ContentSchema,
# )

# # 2) Compute the max timestamp per user+topic
# max_ts = (
#     uploads
#     .groupby(uploads.user_id, uploads.topic)
#     .reduce(
#         user_id=pw.this.user_id,
#         topic=pw.this.topic,
#         max_timestamp=pw.reducers.max(uploads.timestamp),
#     )
# )

# # 3) Join back to pick the row with that max timestamp
# latest_content = (
#     uploads
#     .join(max_ts, uploads.user_id == max_ts.user_id, uploads.topic == max_ts.topic)
#     .filter(uploads.timestamp == max_ts.max_timestamp)
#     .select(
#         user_id=uploads.user_id,
#         topic=uploads.topic,
#         content=uploads.content,
#         updated_at=uploads.timestamp,
#     )
# )

# # 4) Write the live view
# pw.io.jsonlines.write(
#     latest_content,
#     filename="data/latest_content.jsonl",
# )

# # 5) Run Pathway
# pw.run()
