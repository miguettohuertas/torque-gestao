"""RF07: vínculo do cliente com o Telegram."""
from alembic import op
import sqlalchemy as sa

revision = "8d2f5b7c1a94"
down_revision = "6c4e91a2b730"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("clientes") as batch:
        batch.add_column(sa.Column("telegram_chat_id", sa.String(length=32), nullable=True))
        batch.add_column(
            sa.Column("notificar_telegram", sa.Boolean(), nullable=False, server_default=sa.true())
        )
        batch.create_unique_constraint("uq_cliente_telegram_chat", ["telegram_chat_id"])

    op.create_table(
        "telegram_vinculos",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("cliente_id", sa.String(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expira_em", sa.DateTime(), nullable=False),
        sa.Column("usado_em", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["cliente_id"], ["clientes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )


def downgrade():
    op.drop_table("telegram_vinculos")
    with op.batch_alter_table("clientes") as batch:
        batch.drop_constraint("uq_cliente_telegram_chat", type_="unique")
        batch.drop_column("notificar_telegram")
        batch.drop_column("telegram_chat_id")
