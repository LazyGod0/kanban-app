from uuid import UUID
from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

class BoardRepository:
    def __init__(self,pool: AsyncConnectionPool):
        self.pool = pool
        
    async def create_board(self, user_id: UUID, name: str):
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                async with conn.transaction():
                    await curr.execute(
                        "INSERT INTO boards (name) VALUES (%s) RETURNING *",
                        (name,)
                    )
                    new_board = await curr.fetchone()
                    
                    await curr.execute(
                        "INSERT INTO board_members (user_id, board_id, role) VALUES (%s, %s, %s)",
                        (user_id, new_board["id"], "owner")
                    )

                    return new_board
            
    async def update_board(self,board_id: UUID, owner_id: UUID, name:str):
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                async with conn.transaction():
                    await curr.execute(
                        """
                        UPDATE boards
                        SET name = %s, updated_at = now()
                        WHERE id = %s
                          AND EXISTS (
                              SELECT 1
                              FROM board_members
                              WHERE board_id = boards.id
                                AND user_id = %s
                                AND role = 'owner'
                          )
                        RETURNING *
                        """,
                        (name, board_id, owner_id)
                    )
                    return await curr.fetchone()

    async def find_board(self, board_id: UUID, user_id: UUID):
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                await curr.execute(
                    """
                    SELECT b.*
                    FROM boards AS b
                    INNER JOIN board_members AS bm ON bm.board_id = b.id
                    WHERE b.id = %s AND bm.user_id = %s
                    """,
                    (board_id, user_id)
                )
                return await curr.fetchone()

    async def find_many_boards(self, user_id: UUID):
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                await curr.execute(
                    """
                    SELECT DISTINCT b.*
                    FROM boards AS b
                    INNER JOIN board_members AS bm ON bm.board_id = b.id
                    WHERE bm.user_id = %s
                    ORDER BY b.created_at DESC
                    """,
                    (user_id,)
                )
                return await curr.fetchall()
        
    async def delete_board(self, board_id: UUID, owner_id: UUID):
        async with self.pool.connection() as conn:
            async with conn.cursor() as curr:
                async with conn.transaction():
                    await curr.execute(
                        """
                        DELETE FROM boards
                        WHERE id = %s
                          AND EXISTS (
                              SELECT 1
                              FROM board_members
                              WHERE board_id = boards.id
                                AND user_id = %s
                                AND role = 'owner'
                          )
                        """,
                        (board_id, owner_id),
                    )
                    return curr.rowcount > 0
                
    async def invite(self, user_id: UUID, board_id: UUID):
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                async with conn.transaction():
                    await curr.execute(
                        """
                        INSERT INTO board_members (user_id, board_id, role)
                        VALUES (%s, %s, 'member')
                        RETURNING *
                        """,
                        (user_id, board_id),
                    )
                    return await curr.fetchone()

    async def is_owner(self, board_id: UUID, user_id: UUID) -> bool:
        async with self.pool.connection() as conn:
            async with conn.cursor() as curr:
                await curr.execute(
                    """
                    SELECT 1 FROM board_members
                    WHERE board_id = %s AND user_id = %s AND role = 'owner'
                    LIMIT 1
                    """,
                    (board_id, user_id),
                )
                return await curr.fetchone() is not None

    async def create_invite(
        self,
        board_id: UUID,
        invited_email: str,
        created_by: UUID,
        token_hash: str,
        expires_at,
    ):
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                async with conn.transaction():
                    await curr.execute(
                        """
                        INSERT INTO board_invites
                            (board_id, token, invited_email, created_by, expires_at)
                        VALUES (%s, %s, %s, %s, %s)
                        RETURNING id, board_id, invited_email, expires_at
                        """,
                        (board_id, token_hash, invited_email, created_by, expires_at),
                    )
                    return await curr.fetchone()

    async def accept_invite(
        self,
        token_hash: str,
        user_id: UUID,
        invited_email: str,
    ):
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                async with conn.transaction():
                    await curr.execute(
                        """
                        UPDATE board_invites
                        SET accepted_at = now()
                        WHERE token = %s
                          AND lower(invited_email) = lower(%s)
                          AND expires_at > now()
                          AND accepted_at IS NULL
                        RETURNING board_id
                        """,
                        (token_hash, invited_email),
                    )
                    invite = await curr.fetchone()
                    if not invite:
                        return None

                    await curr.execute(
                        """
                        INSERT INTO board_members (user_id, board_id, role)
                        VALUES (%s, %s, 'member')
                        ON CONFLICT (board_id, user_id) DO NOTHING
                        """,
                        (user_id, invite["board_id"]),
                    )
                    return invite
