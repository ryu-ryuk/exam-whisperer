"""
Create topics table
"""

from alembic import op
import sqlalchemy as sa

# Revision identifiers, used by Alembic.
revision = '20250703createtop'
down_revision = '20250703addllm'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'topics',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('username', sa.String(length=255), nullable=False),
        sa.Column('topic_name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['username'], ['users.username'], ondelete='CASCADE')
    )

def downgrade():
    op.drop_table('topics')
