from datetime import datetime
from uuid import UUID
from psycopg_pool import AsyncConnectionPool
from psycopg.rows import dict_row

class TaskRepository:
    def __init__(self, pool: AsyncConnectionPool):
        self.pool = pool

    async def create_task(
        self,
        board_id: UUID,
        column_id: UUID,
        title: str,
        description: str | None,
        due_date: datetime | None,
        created_by: UUID,
    ):
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                async with conn.transaction():
                    await curr.execute(
                        """
                        INSERT INTO tasks
                            (column_id, title, description, due_date, created_by)
                        SELECT %s, %s, %s, %s, %s
                        WHERE EXISTS (
                            SELECT 1 FROM columns
                            WHERE id = %s AND board_id = %s
                        )
                        RETURNING *
                        """,
                        (
                            column_id,
                            title,
                            description,
                            due_date,
                            created_by,
                            column_id,
                            board_id,
                        ),
                    )
                    return await curr.fetchone()

    async def find_many_tasks(
        self, board_id: UUID, column_id: UUID
    ):
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                await curr.execute(
                    """
                    SELECT t.*
                    FROM tasks AS t
                    INNER JOIN columns AS c ON c.id = t.column_id
                    WHERE c.board_id = %s
                      AND c.id = %s
                    ORDER BY t.created_at ASC
                    """,
                    (board_id, column_id),
                )
                return await curr.fetchall()

    async def find_task(
        self,
        board_id: UUID,
        column_id: UUID,
        task_id: UUID,
    ):
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                await curr.execute(
                    """
                    SELECT t.*
                    FROM tasks AS t
                    INNER JOIN columns AS c ON c.id = t.column_id
                    WHERE t.id = %s
                      AND c.id = %s
                      AND c.board_id = %s
                    """,
                    (task_id, column_id, board_id),
                )
                return await curr.fetchone()

    async def update_task(
        self,
        board_id: UUID,
        column_id: UUID,
        task_id: UUID,
        values: dict,
    ):
        if not values:
            return await self.find_task(board_id, column_id, task_id)

        assignments = []
        parameters = []
        for field, value in values.items():
            assignments.append(f"{field} = %s")
            parameters.append(value)
        parameters.extend([task_id, column_id, board_id])

        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                async with conn.transaction():
                    await curr.execute(
                        f"""
                        UPDATE tasks AS t
                        SET {", ".join(assignments)}, updated_at = now()
                        FROM columns AS c
                        WHERE t.id = %s
                          AND t.column_id = c.id
                          AND c.id = %s
                          AND c.board_id = %s
                        RETURNING t.*
                        """,
                        parameters,
                    )
                    return await curr.fetchone()

    async def delete_task(
        self, board_id: UUID, column_id: UUID, task_id: UUID, user_id: UUID
    ) -> bool:
        async with self.pool.connection() as conn:
            async with conn.cursor() as curr:
                async with conn.transaction():
                    await curr.execute(
                        """
                        DELETE FROM tasks AS t
                        USING columns AS c
                        WHERE t.id = %s
                          AND t.column_id = c.id
                          AND c.id = %s
                          AND c.board_id = %s
                                                    AND t.created_by = %s
                        """,
                                                (task_id, column_id, board_id, user_id),
                    )
                    return curr.rowcount > 0

    async def assign_task(
        self,
        board_id: UUID,
        column_id: UUID,
        task_id: UUID,
        assignee_id: UUID,
        assigned_by: UUID,
    ):
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                async with conn.transaction():
                    await curr.execute(
                        """
                        INSERT INTO task_assignees (task_id, user_id, assigned_by)
                        SELECT t.id, %s, %s
                        FROM tasks AS t
                        INNER JOIN columns AS c ON c.id = t.column_id
                        INNER JOIN board_members AS bm ON bm.board_id = c.board_id
                        WHERE t.id = %s
                          AND c.id = %s
                          AND c.board_id = %s
                          AND bm.user_id = %s
                          AND EXISTS (
                              SELECT 1 FROM board_members
                              WHERE board_id = c.board_id AND user_id = %s
                          )
                        ON CONFLICT (task_id, user_id) DO NOTHING
                        """,
                        (
                            assignee_id,
                            assigned_by,
                            task_id,
                            column_id,
                            board_id,
                            assignee_id,
                            assignee_id,
                        ),
                    )
                    assignment_created = curr.rowcount > 0
                    if assignment_created:
                        await curr.execute(
                            """
                            INSERT INTO notifications
                                (user_id, task_id, type, message)
                            SELECT %s, t.id, 'task_assignment',
                                   format('%%s assigned you to task "%%s"', assigner.name, t.title)
                            FROM tasks AS t
                            INNER JOIN users AS assigner ON assigner.id = %s
                            WHERE t.id = %s
                            """,
                            (assignee_id, assigned_by, task_id),
                        )
                    await curr.execute(
                        """
                        SELECT u.id, u.name, u.email, ta.assigned_by,
                               assigner.name AS assigned_by_name,
                               assigner.email AS assigned_by_email
                        FROM task_assignees AS ta
                        INNER JOIN users AS u ON u.id = ta.user_id
                        LEFT JOIN users AS assigner ON assigner.id = ta.assigned_by
                        WHERE ta.task_id = %s AND ta.user_id = %s
                        """,
                        (task_id, assignee_id),
                    )
                    return await curr.fetchone()

    async def find_task_assignees(
        self, board_id: UUID, column_id: UUID, task_id: UUID
    ):
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                await curr.execute(
                    """
                    SELECT u.id, u.name, u.email
                    FROM task_assignees AS ta
                    INNER JOIN users AS u ON u.id = ta.user_id
                    INNER JOIN tasks AS t ON t.id = ta.task_id
                    INNER JOIN columns AS c ON c.id = t.column_id
                    WHERE ta.task_id = %s
                      AND c.id = %s
                      AND c.board_id = %s
                    ORDER BY u.name ASC, u.id ASC
                    """,
                    (task_id, column_id, board_id),
                )
                return await curr.fetchall()

    async def find_task_assigner(
        self, board_id: UUID, column_id: UUID, task_id: UUID
    ):
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                await curr.execute(
                    """
                    SELECT DISTINCT assigner.id,
                                    assigner.name,
                                    assigner.email
                    FROM task_assignees AS ta
                    INNER JOIN tasks AS t ON t.id = ta.task_id
                    INNER JOIN columns AS c ON c.id = t.column_id
                    INNER JOIN users AS assigner ON assigner.id = ta.assigned_by
                    WHERE ta.task_id = %s
                      AND c.id = %s
                      AND c.board_id = %s
                    LIMIT 1
                    """,
                    (task_id, column_id, board_id),
                )
                return await curr.fetchone()

    async def unassign_task(
        self,
        board_id: UUID,
        column_id: UUID,
        task_id: UUID,
        assignee_id: UUID,
    ) -> bool:
        async with self.pool.connection() as conn:
            async with conn.cursor() as curr:
                async with conn.transaction():
                    await curr.execute(
                        """
                        DELETE FROM task_assignees AS ta
                        USING tasks AS t, columns AS c
                        WHERE ta.task_id = t.id
                          AND t.column_id = c.id
                          AND ta.task_id = %s
                          AND ta.user_id = %s
                          AND c.id = %s
                          AND c.board_id = %s
                        """,
                        (task_id, assignee_id, column_id, board_id),
                    )
                    return curr.rowcount > 0
