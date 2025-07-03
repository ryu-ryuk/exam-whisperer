"""
Add user_topic_notes and user_quiz_history tables
"""
from alembic import op
import sqlalchemy as sa

revision = '20250704notesqh'
down_revision = '20250703createtop'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'user_topic_notes',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('username', sa.String(), nullable=False, index=True),
        sa.Column('topic', sa.String(), nullable=False, index=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )
    op.create_table(
        'user_quiz_history',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('username', sa.String(), nullable=False, index=True),
        sa.Column('topic', sa.String(), nullable=False, index=True),
        sa.Column('question', sa.Text(), nullable=False),
        sa.Column('answer', sa.Text(), nullable=True),
        sa.Column('correct', sa.String(), nullable=True),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
    )

def downgrade():
    op.drop_table('user_topic_notes')
    op.drop_table('user_quiz_history')
