from uuid import UUID
from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool
from app.repositories.board_member_repository import BoardMemberRepository
from app.services.notifications import notification_manager

class BoardInviteRepository:
    def __init__(self, pool: AsyncConnectionPool):
        self.pool = pool
        self.member_repository = BoardMemberRepository(pool)

    async def create_invite(
        self, board_id: UUID, invited_user_id: UUID, invited_email: str,
        created_by: UUID, expires_at,
    ):
        notification = None
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                async with conn.transaction():
                    await curr.execute(
                        """
                        INSERT INTO board_invites
                            (board_id, invited_user_id, invited_email, created_by, expires_at)
                        VALUES (%s, %s, %s, %s, %s)
                        RETURNING id, board_id, invited_email, status, expires_at
                        """,
                        (board_id, invited_user_id, invited_email, created_by, expires_at),
                    )
                    invite = await curr.fetchone()
                    await curr.execute(
                        """
                        INSERT INTO notifications (user_id, board_invite_id, type, message)
                        VALUES (%s, %s, 'board_invite', %s)
                        RETURNING id, board_invite_id, type, message, is_read, created_at
                        """,
                        (invited_user_id, invite["id"], "You have a new board invitation"),
                    )
                    notification = await curr.fetchone()

        if notification:
            await notification_manager.publish(
                invited_user_id,
                {
                    "id": notification["id"],
                    "boardInviteId": notification["board_invite_id"],
                    "type": notification["type"],
                    "message": notification["message"],
                    "isRead": notification["is_read"],
                    "createdAt": notification["created_at"],
                },
            )
        return invite

    async def has_pending_invite(self, board_id: UUID, user_id: UUID) -> bool:
        async with self.pool.connection() as conn:
            async with conn.cursor() as curr:
                await curr.execute(
                    """
                    SELECT 1 FROM board_invites
                    WHERE board_id = %s AND invited_user_id = %s
                      AND status = 'pending' AND expires_at > now()
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
                           bi.created_at, bi.expires_at
                    FROM board_invites AS bi
                    INNER JOIN boards AS b ON b.id = bi.board_id
                    INNER JOIN users AS u ON u.id = bi.created_by
                    WHERE bi.invited_user_id = %s AND bi.status = 'pending'
                      AND bi.expires_at > now()
                    ORDER BY bi.created_at DESC
                    """,
                    (user_id,),
                )
                return await curr.fetchall()

    async def accept_invite(self, invite_id: UUID, user_id: UUID):
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                async with conn.transaction():
                    await curr.execute(
                        """
                        UPDATE board_invites
                        SET status = 'accepted', responded_at = now()
                        WHERE id = %s AND invited_user_id = %s
                          AND expires_at > now() AND status = 'pending'
                        RETURNING board_id
                        """,
                        (invite_id, user_id),
                    )
                    invite = await curr.fetchone()
                    if not invite:
                        return None
                    await curr.execute(
                        """
                        UPDATE notifications SET is_read = TRUE
                        WHERE board_invite_id = %s AND user_id = %s
                        """,
                        (invite_id, user_id),
                    )
                    await self.member_repository.insert_member(
                        curr, user_id, invite["board_id"]
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
                        WHERE id = %s AND invited_user_id = %s
                          AND expires_at > now() AND status = 'pending'
                        RETURNING id, board_id
                        """,
                        (invite_id, user_id),
                    )
                    invite = await curr.fetchone()
                    if invite:
                        await curr.execute(
                            """
                            UPDATE notifications SET is_read = TRUE
                            WHERE board_invite_id = %s AND user_id = %s
                            """,
                            (invite_id, user_id),
                        )
                        invite["status"] = "rejected"
                    return invite