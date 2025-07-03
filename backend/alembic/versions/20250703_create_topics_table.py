"""
Create topics table
"""

from alembic import op
import sqlalchemy as sa

# Revision identifiers, used by Alembic.
revision = '20250703_create_topics_table'
down_revision = '20250703_add_llm_columns'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'topics',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer, nullable=False),
        sa.Column('topic_name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )

def downgrade():
    op.drop_table('topics')
