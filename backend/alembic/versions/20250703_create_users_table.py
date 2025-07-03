"""create users table

Revision ID: 20250703createusers
Revises: 
Create Date: 2025-07-03
"""

from alembic import op
import sqlalchemy as sa

revision = '20250703createusers'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('username', sa.String(), unique=True, nullable=False),
        sa.Column('email', sa.String(), unique=True, nullable=True),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now())
    )

def downgrade():
    op.drop_table('users')
