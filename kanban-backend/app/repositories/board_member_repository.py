from uuid import UUID
from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

class BoardMemberRepository:
    def __init__(self, pool: AsyncConnectionPool):
        self.pool = pool

    async def insert_member(self, cursor, user_id: UUID, board_id: UUID) -> None:
        await cursor.execute(
            """
            INSERT INTO board_members (user_id, board_id, role)
            VALUES (%s, %s, 'member')
            ON CONFLICT (board_id, user_id) DO NOTHING
            """,
            (user_id, board_id),
        )

    async def is_member(self, board_id: UUID, user_id: UUID) -> bool:
        async with self.pool.connection() as conn:
            async with conn.cursor() as curr:
                await curr.execute(
                    """
                    SELECT 1 FROM board_members
                    WHERE board_id = %s AND user_id = %s
                    LIMIT 1
                    """,
                    (board_id, user_id),
                )
                return await curr.fetchone() is not None

    async def find_members(self, board_id: UUID, user_id: UUID):
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                await curr.execute(
                    """
                    SELECT u.id, u.name, u.email, bm.role, bm.joined_at
                    FROM board_members AS bm
                    INNER JOIN users AS u ON u.id = bm.user_id
                    WHERE bm.board_id = %s
                      AND EXISTS (
                          SELECT 1 FROM board_members
                          WHERE board_id = %s AND user_id = %s
                      )
                    ORDER BY bm.role ASC, u.name ASC, u.id ASC
                    """,
                    (board_id, board_id, user_id),
                )
                return await curr.fetchall()

    async def remove_member(
        self, board_id: UUID, owner_id: UUID, member_id: UUID
    ) -> bool:
        async with self.pool.connection() as conn:
            async with conn.cursor() as curr:
                async with conn.transaction():
                    await curr.execute(
                        """
                        DELETE FROM board_members AS bm
                        WHERE bm.board_id = %s AND bm.user_id = %s
                          AND bm.role = 'member'
                          AND EXISTS (
                              SELECT 1 FROM board_members AS owner_members
                              WHERE owner_members.board_id = %s
                                AND owner_members.user_id = %s
                                AND owner_members.role = 'owner'
                          )
                        """,
                        (board_id, member_id, board_id, owner_id),
                    )
                    return curr.rowcount > 0

    async def is_member_email(self, board_id: UUID, email: str) -> bool:
        async with self.pool.connection() as conn:
            async with conn.cursor() as curr:
                await curr.execute(
                    """
                    SELECT 1 FROM board_members AS bm
                    INNER JOIN users AS u ON u.id = bm.user_id
                    WHERE bm.board_id = %s AND lower(u.email) = lower(%s)
                    LIMIT 1
                    """,
                    (board_id, email),
                )
                return await curr.fetchone() is not None
