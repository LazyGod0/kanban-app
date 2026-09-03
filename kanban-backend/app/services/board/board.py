from uuid import UUID
from app.errors.board import BoardNotFoundException
from app.repositories.board_repository import BoardRepository


class BoardService:
    def __init__(self, board_repository: BoardRepository):
        self.board_repository = board_repository

    async def create_board(self, user_id: UUID, name: str):
        return await self.board_repository.create_board(user_id, name)

    async def get_board(self, board_id: UUID, user_id: UUID):
        board = await self.board_repository.find_board(board_id, user_id)
        if not board:
            raise BoardNotFoundException("Board not found")
        return board

    async def get_many_boards(self, user_id: UUID):
        return await self.board_repository.find_many_boards(user_id)

    async def update_board(self, board_id: UUID, owner_id: UUID, name: str):
        board = await self.board_repository.update_board(board_id, owner_id, name)
        if not board:
            raise BoardNotFoundException("Board not found or user is not the owner")
        return board

    async def delete_board(self, board_id: UUID, owner_id: UUID) -> None:
        deleted = await self.board_repository.delete_board(board_id, owner_id)
        if not deleted:
            raise BoardNotFoundException("Board not found or user is not the owner")

    async def invite_member(self, user_id: UUID, board_id: UUID):
        return await self.board_repository.invite(user_id, board_id)
