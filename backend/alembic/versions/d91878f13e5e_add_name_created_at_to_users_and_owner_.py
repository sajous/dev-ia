"""add_name_created_at_to_users_and_owner_role

Revision ID: d91878f13e5e
Revises: 8806c30ab0f2
Create Date: 2026-03-30 21:08:05.902738

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

revision: str = 'd91878f13e5e'
down_revision: Union[str, Sequence[str], None] = '8806c30ab0f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('name', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('users', sa.Column('created_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'created_at')
    op.drop_column('users', 'name')
