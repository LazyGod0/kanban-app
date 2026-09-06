from uuid import UUID
from psycopg.errors import UniqueViolation
from psycopg_pool import AsyncConnectionPool
from psycopg.rows import dict_row

class TagRepository:
    def __init__(self, pool: AsyncConnectionPool):
        self.pool = pool

    async def list_for_board(self, board_id: UUID, user_id: UUID):
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                await curr.execute(
                    """
                    SELECT t.*
                    FROM tags AS t
                    INNER JOIN board_members AS bm ON bm.board_id = t.board_id
                    WHERE t.board_id = %s AND bm.user_id = %s
                    ORDER BY lower(t.name), t.id
                    """,
                    (board_id, user_id),
                )
                return await curr.fetchall()

    async def list_for_tasks(self, task_ids: list[UUID]) -> dict[UUID, list[dict]]:
        if not task_ids:
            return {}

        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                await curr.execute(
                    """
                    SELECT tt.task_id, t.id, t.board_id, t.name, t.color, t.created_at
                    FROM task_tags AS tt
                    INNER JOIN tags AS t ON t.id = tt.tag_id
                    WHERE tt.task_id = ANY(%s)
                    ORDER BY tt.task_id, lower(t.name), t.id
                    """,
                    (task_ids,),
                )
                tags_by_task: dict[UUID, list[dict]] = {
                    task_id: [] for task_id in task_ids
                }
                for row in await curr.fetchall():
                    tags_by_task[row["task_id"]].append(
                        {
                            "id": row["id"],
                            "boardId": row["board_id"],
                            "name": row["name"],
                            "color": row["color"],
                            "createdAt": row["created_at"],
                        }
                    )
                return tags_by_task

    async def create(self, board_id: UUID, user_id: UUID, name: str):
        normalized_name = name.strip()
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                try:
                    async with conn.transaction():
                        await curr.execute(
                            """
                            INSERT INTO tags (board_id, name)
                            SELECT %s, %s
                            WHERE EXISTS (
                                SELECT 1 FROM board_members
                                WHERE board_id = %s AND user_id = %s
                            )
                            RETURNING *
                            """,
                            (board_id, normalized_name, board_id, user_id),
                        )
                        return await curr.fetchone()
                except UniqueViolation as error:
                    raise ValueError("A tag with this name already exists") from error

    async def delete(self, board_id: UUID, tag_id: UUID, user_id: UUID) -> bool:
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                async with conn.transaction():
                    await curr.execute(
                        """
                        SELECT tags.id
                        FROM tags
                        WHERE tags.id = %s AND tags.board_id = %s
                          AND EXISTS (
                              SELECT 1 FROM board_members
                              WHERE board_id = tags.board_id AND user_id = %s
                          )
                        FOR UPDATE
                        """,
                        (tag_id, board_id, user_id),
                    )
                    if not await curr.fetchone():
                        return False

                    await curr.execute(
                        "SELECT 1 FROM task_tags WHERE tag_id = %s LIMIT 1",
                        (tag_id,),
                    )
                    if await curr.fetchone():
                        raise ValueError("Tag is still used by one or more tasks")

                    await curr.execute(
                        "DELETE FROM tags WHERE id = %s AND board_id = %s",
                        (tag_id, board_id),
                    )
                    return curr.rowcount > 0

    async def all_belong_to_board(
        self, board_id: UUID, tag_ids: list[UUID]
    ) -> bool:
        if not tag_ids:
            return True
        async with self.pool.connection() as conn:
            async with conn.cursor() as curr:
                await curr.execute(
                    """
                    SELECT COUNT(*)
                    FROM tags
                    WHERE board_id = %s AND id = ANY(%s)
                    """,
                    (board_id, tag_ids),
                )
                return (await curr.fetchone())[0] == len(set(tag_ids))