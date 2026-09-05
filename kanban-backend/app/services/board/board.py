from uuid import UUID
from app.errors.board import BoardNotFoundException
from app.repositories.board_member_repository import BoardMemberRepository
from app.repositories.board_repository import BoardRepository


class BoardService:
    def __init__(
        self,
        board_repository: BoardRepository,
        member_repository: BoardMemberRepository,
    ):
        self.board_repository = board_repository
        self.member_repository = member_repository

    async def create_board(self, user_id: UUID, name: str):
        board = await self.board_repository.create_board(user_id, name)
        return {**board, "is_owner": True}

    async def get_board(self, board_id: UUID, user_id: UUID):
        board = await self.board_repository.find_board(board_id, user_id)
        if not board:
            raise BoardNotFoundException("Board not found")
        return board

    async def get_many_boards(self, user_id: UUID):
        return await self.board_repository.find_many_boards(user_id)

    async def get_members(self, board_id: UUID, user_id: UUID):
        if not await self.member_repository.is_member(board_id, user_id):
            raise BoardNotFoundException("Board not found")
        return await self.member_repository.find_members(board_id, user_id)

    async def remove_member(
        self, board_id: UUID, owner_id: UUID, member_id: UUID
    ) -> None:
        if not await self.board_repository.is_owner(board_id, owner_id):
            raise BoardNotFoundException(
                "Board not found or user is not the board owner"
            )
        removed = await self.member_repository.remove_member(
            board_id, owner_id, member_id
        )
        if not removed:
            raise BoardNotFoundException("Member not found or cannot be removed")

    async def update_board(self, board_id: UUID, owner_id: UUID, name: str):
        board = await self.board_repository.update_board(board_id, owner_id, name)
        if not board:
            raise BoardNotFoundException("Board not found or user is not the owner")
        return {**board, "is_owner": True}

    async def delete_board(self, board_id: UUID, owner_id: UUID) -> None:
        deleted = await self.board_repository.delete_board(board_id, owner_id)
        if not deleted:
            raise BoardNotFoundException("Board not found or user is not the owner")

