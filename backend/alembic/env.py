import sys
import os
from logging.config import fileConfig
from sqlalchemy import create_engine
from alembic import context

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from db import Base 
from db_models import * 

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Explicitly set the DATABASE_URL
config.set_main_option("sqlalchemy.url", "postgresql://dev:dev@postgres:5432/dev")

# Interpret the config file for Python logging.
# This line sets up loggers basically.
fileConfig(config.config_file_name)

target_metadata = Base.metadata

# Simplify the Alembic configuration to directly create the SQLAlchemy engine
url = "postgresql://dev:dev@postgres:5432/dev"
connectable = create_engine(url)
context.configure(connection=connectable.connect(), target_metadata=target_metadata, compare_type=True)
with context.begin_transaction():
    context.run_migrations()
