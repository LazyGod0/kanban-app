from datetime import datetime, timedelta, timezone
from hashlib import sha256
from secrets import token_urlsafe
from uuid import UUID
from app.errors.board import BoardNotFoundException
from app.config.setting import settings
from app.repositories.board_repository import BoardRepository
from app.services.email import EmailService


class BoardInvitationService:
    def __init__(
        self,
        board_repository: BoardRepository,
        email_service: EmailService,
    ):
        self.board_repository = board_repository
        self.email_service = email_service

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

        raw_token = token_urlsafe(32)
        token_hash = sha256(raw_token.encode("utf-8")).hexdigest()
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        invite = await self.board_repository.create_invite(
            board_id=board_id,
            invited_email=recipient_email,
            created_by=owner_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        invite_url = f"{settings.frontend_url}/invite/{raw_token}"
        await self.email_service.send_board_invite(
            recipient=recipient_email,
            board_name=board["name"],
            invite_url=invite_url,
        )
        return invite

    async def accept_invite(
        self,
        raw_token: str,
        user_id: UUID,
        user_email: str,
    ):
        token_hash = sha256(raw_token.encode("utf-8")).hexdigest()
        print(token_hash)
        invite = await self.board_repository.accept_invite(
            token_hash, user_id, user_email
        )
        if not invite:
            raise BoardNotFoundException("Invitation is invalid or expired")
        return invite
