from db import SessionLocal
from sqlalchemy.exc import SQLAlchemyError
from db_models import UserTopicProgress
from datetime import datetime

def upsert_user_topic_progress(record: dict):
    """
    Upsert one progress record via SQLAlchemy ORM.
    `record` keys: user_id, topic, latest_score, average_score,
                last_attempt (ISO string), trend, status
    """
    session = SessionLocal()
    try:
        obj = session.get(
            UserTopicProgress,
            (record["user_id"], record["topic"])
        )
        # parse timestamp string to datetime
        last_attempt = record["last_attempt"]
        if isinstance(last_attempt, str):
            last_attempt = datetime.fromisoformat(last_attempt)

        if obj:
            # update existing
            obj.latest_score  = record["latest_score"]
            obj.average_score = record["average_score"]
            obj.last_attempt  = last_attempt
            obj.trend         = record["trend"]
            obj.status        = record["status"]
        else:
            # insert new
            obj = UserTopicProgress(
                user_id       = record["user_id"],
                topic         = record["topic"],
                latest_score  = record["latest_score"],
                average_score = record["average_score"],
                last_attempt  = last_attempt,
                trend         = record["trend"],
                status        = record["status"],
            )
            session.add(obj)

        session.commit()
    except SQLAlchemyError as e:
        session.rollback()
        print("DB upsert error:", e)
    finally:
        session.close()

