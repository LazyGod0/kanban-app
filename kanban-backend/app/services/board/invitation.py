from datetime import datetime, timedelta, timezone
from uuid import UUID
from app.errors.board import BoardNotFoundException
from app.repositories.board_repository import BoardRepository
from app.repositories.user_repository import UserRepository


class BoardInvitationService:
    def __init__(
        self,
        board_repository: BoardRepository,
        user_repository: UserRepository,
    ):
        self.board_repository = board_repository
        self.user_repository = user_repository

    async def invite_by_email(
        self,
        board_id: UUID,
        owner_id: UUID,
        recipient_email: str,
    ):
        board = await self.board_repository.find_board(board_id, owner_id)
        is_owner = await self.board_repository.is_owner(board_id, owner_id)
        if not board or not is_owner:
            raise BoardNotFoundException(
                "Board not found or user is not the owner"
            )

        recipient = await self.user_repository.find_by_email(recipient_email)
        if not recipient:
            raise ValueError("User not found")

        if recipient["id"] == owner_id:
            raise ValueError("You cannot invite yourself")

        if await self.board_repository.is_member(board_id, recipient["id"]):
            raise ValueError("User is already a member of this board")

        if await self.board_repository.has_pending_invite(
            board_id, recipient["id"]
        ):
            raise ValueError("User already has a pending invitation")

        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        return await self.board_repository.create_invite(
            board_id=board_id,
            invited_user_id=recipient["id"],
            invited_email=recipient_email,
            created_by=owner_id,
            expires_at=expires_at,
        )

    async def list_pending_invites(self, user_id: UUID):
        return await self.board_repository.list_pending_invites(user_id)

    async def accept_invite(
        self,
        invite_id: UUID,
        user_id: UUID,
    ):
        invite = await self.board_repository.accept_invite(invite_id, user_id)
        if not invite:
            raise BoardNotFoundException("Invitation is invalid or expired")
        return invite

    async def reject_invite(self, invite_id: UUID, user_id: UUID):
        invite = await self.board_repository.reject_invite(invite_id, user_id)
        if not invite:
            raise BoardNotFoundException("Invitation is invalid or expired")
        return invite
