from typing import List
from psycopg.errors import UniqueViolation
from psycopg_pool import AsyncConnectionPool
from psycopg.rows import dict_row
from app.models.column import MultiColumnPayload    
from uuid import UUID 

class ColumnRepository:
    def __init__(self,pool: AsyncConnectionPool):
        self.pool = pool
        
    async def create_column(self, columns: List[MultiColumnPayload]):
        positions = [(column.board_id, column.position) for column in columns]
        if len(positions) != len(set(positions)):
            raise ValueError("Column positions must be unique within each board")

        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                try:
                    async with conn.transaction():
                        created_columns = []
                        for column in columns:
                            await curr.execute(
                                """
                                INSERT INTO columns (name, position, board_id)
                                VALUES (%s, %s, %s)
                                RETURNING *
                                """,
                                (column.name, column.position, column.board_id),
                            )
                            created_columns.append(await curr.fetchone())

                        return created_columns
                except UniqueViolation as error:
                    raise ValueError(
                        "A column position already exists in this board"
                    ) from error

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

    async def create_columns(self, board_id: UUID, columns):
        positions = [column.position for column in columns]
        if len(positions) != len(set(positions)):
            raise ValueError("Column positions must be unique within this board")

        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                try:
                    async with conn.transaction():
                        created_columns = []
                        for column in columns:
                            await curr.execute(
                                """
                                INSERT INTO columns (name, position, board_id)
                                VALUES (%s, %s, %s)
                                RETURNING *
                                """,
                                (column.name, column.position, board_id),
                            )
                            created_columns.append(await curr.fetchone())
                        return created_columns
                except UniqueViolation as error:
                    raise ValueError(
                        "A column position already exists in this board"
                    ) from error

    async def find_many_columns(self, board_id: UUID, user_id: UUID):
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                await curr.execute(
                    """
                    SELECT c.*
                    FROM columns AS c
                    INNER JOIN board_members AS bm ON bm.board_id = c.board_id
                    WHERE c.board_id = %s AND bm.user_id = %s
                    ORDER BY c.position ASC
                    """,
                    (board_id, user_id),
                )
                return await curr.fetchall()

    async def find_column(self, board_id: UUID, column_id: UUID, user_id: UUID):
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                await curr.execute(
                    """
                    SELECT c.*
                    FROM columns AS c
                    INNER JOIN board_members AS bm ON bm.board_id = c.board_id
                    WHERE c.id = %s AND c.board_id = %s AND bm.user_id = %s
                    """,
                    (column_id, board_id, user_id),
                )
                return await curr.fetchone()
            
    async def update_column(
        self,
        board_id: UUID,
        column_id: UUID,
        owner_id: UUID,
        name: str,
        position: int,
    ):
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                async with conn.transaction():
                    await curr.execute(
                        """
                        UPDATE columns
                        SET name = %s, position = %s, updated_at = now()
                        WHERE id = %s AND board_id = %s
                        AND EXISTS (
                        SELECT 1 FROM board_members
                        WHERE board_id = columns.board_id
                        AND user_id = %s AND role = 'owner'
                        )
                        RETURNING *
                        """,
                        (name, position, column_id, board_id, owner_id),
                    )
                    return await curr.fetchone()
                
    async def delete_column(self, board_id: UUID, column_id: UUID, owner_id: UUID):
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                async with conn.transaction():
                    await curr.execute(
                        """
                        DELETE FROM columns
                        WHERE id = %s AND board_id = %s
                        AND EXISTS (
                        SELECT 1 FROM board_members
                        WHERE board_id = columns.board_id
                        AND user_id = %s AND role = 'owner'
                        )
                        """,
                        (column_id, board_id, owner_id)
                    )
                    
                return curr.rowcount