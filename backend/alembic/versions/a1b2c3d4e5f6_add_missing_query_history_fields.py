"""add_missing_query_history_fields

Revision ID: a1b2c3d4e5f6
Revises: 74b89e3a34a9
Create Date: 2026-07-19 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '74b89e3a34a9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('query_history', sa.Column('items_checked', ARRAY(sa.String()), nullable=True))
    op.add_column('query_history', sa.Column('request_json', sa.JSON(), nullable=True))
    op.add_column('query_history', sa.Column('overall_score', sa.Float(), nullable=True))
    op.add_column('query_history', sa.Column('interactions_found', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('query_history', 'interactions_found')
    op.drop_column('query_history', 'overall_score')
    op.drop_column('query_history', 'request_json')
    op.drop_column('query_history', 'items_checked')
