"""add llm_provider, llm_api_key, llm_model columns to users table

Revision ID: 20250703_add_llm_columns
Revises: 
Create Date: 2025-07-03
"""
from alembic import op
import sqlalchemy as sa

revision = '20250703addllm'
down_revision = '20250703createusers'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('users', sa.Column('llm_provider', sa.String(), nullable=True))
    op.add_column('users', sa.Column('llm_api_key', sa.String(), nullable=True))
    op.add_column('users', sa.Column('llm_model', sa.String(), nullable=True))

def downgrade():
    op.drop_column('users', 'llm_model')
    op.drop_column('users', 'llm_api_key')
    op.drop_column('users', 'llm_provider')
