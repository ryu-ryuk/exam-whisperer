import os
import sys
from logging.config import fileConfig
from sqlalchemy import create_engine
from alembic import context

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from db import Base
from db_models import *

config = context.config
fileConfig(config.config_file_name)
target_metadata = Base.metadata

url = os.getenv("DATABASE_URL")
if url is None:
    raise RuntimeError("DATABASE_URL not set")

connectable = create_engine(url)
context.configure(connection=connectable.connect(), target_metadata=target_metadata, compare_type=True)

with context.begin_transaction():
    context.run_migrations()
