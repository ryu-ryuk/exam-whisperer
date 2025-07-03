"""add foreign key: topics.username → users.username"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250705adusernamefk1'
down_revision = '20250704notesqh'
branch_labels = None
depends_on = None

def upgrade():
    op.create_foreign_key(
        constraint_name="fk_topics_username_users",
        source_table="topics",
        referent_table="users",
        local_cols=["username"],
        remote_cols=["username"],
        ondelete="CASCADE"
    )

def downgrade():
    op.drop_constraint(
        constraint_name="fk_topics_username_users",
        table_name="topics",
        type_="foreignkey"
    )
