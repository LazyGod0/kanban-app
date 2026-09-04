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
                    SELECT b.*, (bm.role = 'owner') AS is_owner
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
                    SELECT DISTINCT b.*, (bm.role = 'owner') AS is_owner
                    FROM boards AS b
                    INNER JOIN board_members AS bm ON bm.board_id = b.id
                    WHERE bm.user_id = %s
                    ORDER BY b.created_at DESC
                    """,
                    (user_id,)
                )
                return await curr.fetchall()

    async def is_member(self, board_id: UUID, user_id: UUID) -> bool:
        async with self.pool.connection() as conn:
            async with conn.cursor() as curr:
                await curr.execute(
                    """
                    SELECT 1
                    FROM board_members
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
                          SELECT 1
                          FROM board_members
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
                        WHERE bm.board_id = %s
                          AND bm.user_id = %s
                          AND bm.role = 'member'
                          AND EXISTS (
                              SELECT 1
                              FROM board_members AS owner_members
                              WHERE owner_members.board_id = %s
                                AND owner_members.user_id = %s
                                AND owner_members.role = 'owner'
                          )
                        """,
                        (board_id, member_id, board_id, owner_id),
                    )
                    return curr.rowcount > 0
        
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

    async def is_member_email(self, board_id: UUID, email: str) -> bool:
        async with self.pool.connection() as conn:
            async with conn.cursor() as curr:
                await curr.execute(
                    """
                    SELECT 1
                    FROM board_members AS bm
                    INNER JOIN users AS u ON u.id = bm.user_id
                    WHERE bm.board_id = %s
                      AND lower(u.email) = lower(%s)
                    LIMIT 1
                    """,
                    (board_id, email),
                )
                return await curr.fetchone() is not None

    async def create_invite(
        self,
        board_id: UUID,
        invited_user_id: UUID,
        invited_email: str,
        created_by: UUID,
        expires_at,
    ):
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                async with conn.transaction():
                    await curr.execute(
                        """
                        INSERT INTO board_invites
                               (board_id, invited_user_id, invited_email,
                                created_by, expires_at)
                            VALUES (%s, %s, %s, %s, %s)
                            RETURNING id, board_id, invited_email, status, expires_at
                        """,
                        (
                            board_id,
                            invited_user_id,
                            invited_email,
                            created_by,
                            expires_at,
                        ),
                    )
                    invite = await curr.fetchone()
                    await curr.execute(
                        """
                        INSERT INTO notifications
                            (user_id, board_invite_id, type, message)
                        VALUES (%s, %s, 'board_invite', %s)
                        """,
                        (
                            invited_user_id,
                            invite["id"],
                            "You have a new board invitation",
                        ),
                    )
                    return invite

    async def has_pending_invite(self, board_id: UUID, user_id: UUID) -> bool:
        async with self.pool.connection() as conn:
            async with conn.cursor() as curr:
                await curr.execute(
                    """
                    SELECT 1
                    FROM board_invites
                    WHERE board_id = %s
                      AND invited_user_id = %s
                      AND status = 'pending'
                      AND expires_at > now()
                    LIMIT 1
                    """,
                    (board_id, user_id),
                )
                return await curr.fetchone() is not None

    async def list_pending_invites(self, user_id: UUID):
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                await curr.execute(
                    """
                    SELECT bi.id, bi.board_id, b.name AS board_name,
                                                     bi.invited_email, bi.created_by, u.name AS inviter_name,
                                                     bi.created_at,
                           bi.expires_at
                    FROM board_invites AS bi
                    INNER JOIN boards AS b ON b.id = bi.board_id
                                        INNER JOIN users AS u ON u.id = bi.created_by
                    WHERE bi.invited_user_id = %s
                                            AND bi.status = 'pending'
                      AND bi.expires_at > now()
                    ORDER BY bi.created_at DESC
                    """,
                    (user_id,),
                )
                return await curr.fetchall()

    async def accept_invite(
        self,
        invite_id: UUID,
        user_id: UUID,
    ):
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                async with conn.transaction():
                    await curr.execute(
                        """
                        UPDATE board_invites
                                                SET status = 'accepted', responded_at = now()
                                                WHERE id = %s
                                                    AND invited_user_id = %s
                          AND expires_at > now()
                                                    AND status = 'pending'
                        RETURNING board_id
                        """,
                                                (invite_id, user_id),
                    )
                    invite = await curr.fetchone()
                    if not invite:
                        return None

                    await curr.execute(
                        """
                        UPDATE notifications
                        SET is_read = TRUE
                        WHERE board_invite_id = %s AND user_id = %s
                        """,
                        (invite_id, user_id),
                    )

                    await curr.execute(
                        """
                        INSERT INTO board_members (user_id, board_id, role)
                        VALUES (%s, %s, 'member')
                        ON CONFLICT (board_id, user_id) DO NOTHING
                        """,
                        (user_id, invite["board_id"]),
                    )
                    return invite

    async def reject_invite(self, invite_id: UUID, user_id: UUID):
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                async with conn.transaction():
                    await curr.execute(
                        """
                        UPDATE board_invites
                        SET status = 'rejected', responded_at = now()
                        WHERE id = %s
                          AND invited_user_id = %s
                          AND expires_at > now()
                          AND status = 'pending'
                        RETURNING id, board_id
                        """,
                        (invite_id, user_id),
                    )
                    invite = await curr.fetchone()
                    if invite:
                        await curr.execute(
                            """
                            UPDATE notifications
                            SET is_read = TRUE
                            WHERE board_invite_id = %s AND user_id = %s
                            """,
                            (invite_id, user_id),
                        )
                        invite["status"] = "rejected"
                    return invite
