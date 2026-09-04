from uuid import UUID
from app.errors.board import BoardNotFoundException
from app.repositories.col_repository import ColumnRepository


class ColumnService:
    def __init__(self, column_repository: ColumnRepository):
        self.column_repository = column_repository

    async def create_columns(self, board_id: UUID, user_id: UUID, columns):
        if not await self.column_repository.is_member(board_id, user_id):
            raise BoardNotFoundException("Board not found")

        return await self.column_repository.create_columns(board_id, columns)

    async def get_many_columns(self, board_id: UUID, user_id: UUID):
        if not await self.column_repository.is_member(board_id, user_id):
            raise BoardNotFoundException("Board not found")

        return await self.column_repository.find_many_columns(board_id, user_id)

    async def get_column(self, board_id: UUID, column_id: UUID, user_id: UUID):
        column = await self.column_repository.find_column(
            board_id, column_id, user_id
        )
        if not column:
            raise BoardNotFoundException("Column not found")
        return column

    async def update_column(
        self,
        board_id: UUID,
        column_id: UUID,
        user_id: UUID,
        name: str,
        position: int,
    ):
        column = await self.column_repository.update_column(
            board_id, column_id, user_id, name, position
        )
        if not column:
            raise BoardNotFoundException(
                "Column not found or user is not the board owner"
            )
        return column

    async def delete_column(
        self, board_id: UUID, column_id: UUID, user_id: UUID
    ) -> None:
        deleted = await self.column_repository.delete_column(
            board_id, column_id, user_id
        )
        if not deleted:
            raise BoardNotFoundException(
                "Column not found or user is not the board owner"
            )
