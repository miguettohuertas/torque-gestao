"""Vínculo explícito entre login e cadastro do cliente."""
from alembic import op
import sqlalchemy as sa

revision = "6c4e91a2b730"
down_revision = "2bd3550450a8"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("usuarios") as batch:
        batch.add_column(sa.Column("cliente_id", sa.String(), nullable=True))
        batch.create_foreign_key("fk_usuario_cliente", "clientes", ["cliente_id"], ["id"])
        batch.create_unique_constraint("uq_usuario_cliente", ["cliente_id"])


def downgrade():
    with op.batch_alter_table("usuarios") as batch:
        batch.drop_constraint("uq_usuario_cliente", type_="unique")
        batch.drop_constraint("fk_usuario_cliente", type_="foreignkey")
        batch.drop_column("cliente_id")
