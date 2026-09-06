from uuid import UUID

from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool


class NotificationRepository:
    def __init__(self, pool: AsyncConnectionPool):
        self.pool = pool

    async def list_for_user(self, user_id: UUID, page: int, page_size: int):
        offset = (page - 1) * page_size

        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                await curr.execute(
                    """
                    SELECT n.id, n.task_id, n.board_invite_id, n.type,
                           n.message, n.is_read, n.created_at,
                           t.title AS task_title, c.board_id
                    FROM notifications AS n
                    LEFT JOIN tasks AS t ON t.id = n.task_id
                    LEFT JOIN columns AS c ON c.id = t.column_id
                    WHERE n.user_id = %s
                    ORDER BY n.created_at DESC, n.id DESC
                    LIMIT %s OFFSET %s
                    """,
                    (user_id, page_size, offset),
                )
                items = await curr.fetchall()

                await curr.execute(
                    "SELECT COUNT(*) FROM notifications WHERE user_id = %s",
                    (user_id,),
                )
                total = (await curr.fetchone())["count"]

                await curr.execute(
                    """
                    SELECT COUNT(*) FROM notifications
                    WHERE user_id = %s AND is_read = FALSE
                    """,
                    (user_id,),
                )
                unread_count = (await curr.fetchone())["count"]

                return {
                    "items": items,
                    "page": page,
                    "page_size": page_size,
                    "total": total,
                    "unread_count": unread_count,
                }

    async def mark_read(self, notification_id: UUID, user_id: UUID) -> bool:
        async with self.pool.connection() as conn:
            async with conn.cursor() as curr:
                await curr.execute(
                    """
                    UPDATE notifications
                    SET is_read = TRUE
                    WHERE id = %s AND user_id = %s
                    """,
                    (notification_id, user_id),
                )
                await conn.commit()
                return curr.rowcount > 0

    async def mark_all_read(self, user_id: UUID) -> None:
        async with self.pool.connection() as conn:
            async with conn.cursor() as curr:
                await curr.execute(
                    """
                    UPDATE notifications
                    SET is_read = TRUE
                    WHERE user_id = %s AND is_read = FALSE
                    """,
                    (user_id,),
                )
                await conn.commit()

    async def delete_all(self, user_id: UUID) -> None:
        async with self.pool.connection() as conn:
            async with conn.cursor() as curr:
                await curr.execute(
                    """
                    DELETE FROM notifications
                    WHERE user_id = %s
                    """,
                    (user_id,),
                )
                await conn.commit()

    async def delete(self, notification_id: UUID, user_id: UUID) -> bool:
        async with self.pool.connection() as conn:
            async with conn.cursor() as curr:
                await curr.execute(
                    """
                    DELETE FROM notifications
                    WHERE id = %s AND user_id = %s
                    """,
                    (notification_id, user_id),
                )
                await conn.commit()
                return curr.rowcount > 0