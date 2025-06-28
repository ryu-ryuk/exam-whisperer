from db import Base, engine
from db_models import UserTopicActivity, UserSyllabus

Base.metadata.create_all(bind=engine)