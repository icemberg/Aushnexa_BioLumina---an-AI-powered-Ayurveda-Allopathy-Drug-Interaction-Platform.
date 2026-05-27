"""add_role_check_constraint

Revision ID: 74b89e3a34a9
Revises: 6dc25d26cc7a
Create Date: 2026-05-27 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '74b89e3a34a9'
down_revision: Union[str, None] = '6dc25d26cc7a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_check_constraint(
        'valid_role',
        'users',
        "role IN ('PATIENT', 'CLINICIAN', 'PHARMACIST', 'RESEARCHER', 'ADMIN')"
    )


def downgrade() -> None:
    op.drop_constraint('valid_role', 'users', type_='check')
