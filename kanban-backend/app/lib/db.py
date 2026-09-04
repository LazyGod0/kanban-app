from logging import Logger,INFO
from psycopg_pool import AsyncConnectionPool
from app.config.setting import settings

logger = Logger(
    name="Postgres Pool",
    level=INFO,
)

db_name = settings.db_name
db_user = settings.db_user
db_password = settings.db_password
db_host = settings.db_host

connection_string = f"postgresql://{db_user}:{db_password}@{db_host}:5432/{db_name}"
pool = AsyncConnectionPool(connection_string, open=False)

async def check_database() -> None:
    async with pool.connection() as connection:
        async with connection.cursor() as cursor:
            await cursor.execute("SELECT version()")
            logger.info(await cursor.fetchone())

SCHEMA_STATEMENTS: list[str] = [
    "CREATE EXTENSION IF NOT EXISTS pgcrypto;",

    """
    CREATE TABLE IF NOT EXISTS users (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        TEXT NOT NULL,
        email       TEXT NOT NULL UNIQUE,
        password    TEXT NOT NULL,       
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """,
 
    """
    CREATE TABLE IF NOT EXISTS tokens (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash  TEXT NOT NULL,
        token_type  TEXT NOT NULL CHECK (token_type IN ('access', 'refresh')),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        exp_at      TIMESTAMPTZ NOT NULL,
        revoked     BOOLEAN NOT NULL DEFAULT FALSE
    );
    CREATE INDEX IF NOT EXISTS idx_tokens_user_id ON tokens(user_id);
    """,
 
    """
    CREATE TABLE IF NOT EXISTS boards (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        TEXT NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """,
 
    """
    CREATE TABLE IF NOT EXISTS board_members (
        board_id    UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role        TEXT NOT NULL DEFAULT 'member'
                    CHECK (role IN ('owner', 'member')),
        joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (board_id, user_id)
    );
    """,
 
    """
    CREATE TABLE IF NOT EXISTS board_invites (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        board_id    UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
        invited_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        invited_email TEXT NOT NULL,
        created_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status      TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'rejected')),
        expires_at  TIMESTAMPTZ NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        responded_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_board_invites_board_id ON board_invites(board_id);
    CREATE INDEX IF NOT EXISTS idx_board_invites_invited_user_id
        ON board_invites(invited_user_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_board_invites_pending_recipient
        ON board_invites(board_id, invited_user_id)
        WHERE status = 'pending';
    """,
    
    """
    CREATE TABLE IF NOT EXISTS columns (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        board_id    UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
        name        TEXT NOT NULL,
        position    INTEGER NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_columns_board_id ON columns(board_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_columns_board_position
        ON columns(board_id, position);
    """,
 
    """
    CREATE TABLE IF NOT EXISTS tasks (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        column_id   UUID NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
        title       TEXT NOT NULL,
        description TEXT,
        status      TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'done', 'overdue')),
        due_date    TIMESTAMPTZ,
        position    INTEGER NOT NULL DEFAULT 0,
        created_by  UUID NOT NULL REFERENCES users(id),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_column_position
    ON tasks(column_id, position);
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    """,
 
    """
    CREATE TABLE IF NOT EXISTS task_assignees (
        task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (task_id, user_id)
    );
    """,
 
    """
    CREATE TABLE IF NOT EXISTS tags (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        board_id    UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
        name        TEXT NOT NULL,
        color       TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_tags_board_id ON tags(board_id);
    """,
 
    """
    CREATE TABLE IF NOT EXISTS task_tags (
        task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        tag_id      UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (task_id, tag_id)
    );
    """,
 
    """
    CREATE TABLE IF NOT EXISTS notifications (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        task_id     UUID REFERENCES tasks(id) ON DELETE SET NULL,
        board_invite_id UUID REFERENCES board_invites(id) ON DELETE CASCADE,
        type        TEXT NOT NULL,  
        message     TEXT NOT NULL,
        is_read     BOOLEAN NOT NULL DEFAULT FALSE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    """,
]

async def generate_schema() -> None:
    async with pool.connection() as connection:
        async with connection.cursor() as cursor:
            for statement in SCHEMA_STATEMENTS:
                await cursor.execute(statement)
        await connection.commit()
        logger.info("Generate schema successfully")