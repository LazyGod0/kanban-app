from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Path, status
from fastapi.responses import RedirectResponse
from app.dependencies.auth import get_current_user, get_current_user_id
from app.errors.board import BoardNotFoundException
from app.lib.db import pool
from app.models.board import BoardPayload, BoardResponse
from app.models.member import BoardMemberResponse
from app.models.invite import (
	BoardInvitePayload,
	BoardInviteResponse,
 PendingBoardInviteResponse,
 BoardInviteActionResponse,
)
from app.repositories.board_repository import BoardRepository
from app.repositories.board_member_repository import BoardMemberRepository
from app.repositories.board_invite_repository import BoardInviteRepository
from app.repositories.user_repository import UserRepository
from app.routes.column import router as column_router
from app.routes.tag import router as tag_router
from app.services.board.board import BoardService
from app.services.board.invitation import BoardInvitationService

router = APIRouter(prefix="/board")
board_repository = BoardRepository(pool)
member_repository = BoardMemberRepository(pool)
invite_repository = BoardInviteRepository(pool)
board_service = BoardService(board_repository, member_repository)
user_repository = UserRepository(pool)
invitation_service = BoardInvitationService(
	board_repository, member_repository, invite_repository, user_repository
)

@router.post(
	"",
	response_model=BoardResponse,
	status_code=status.HTTP_201_CREATED,
	tags=["Kanban Board"],
	summary="Create a board",
	description="Create a new board owned by the authenticated user.",
)
async def create_board(payload: BoardPayload,user_id: UUID = Depends(get_current_user_id)):
	return await board_service.create_board(user_id, payload.name)

@router.get(
	"",
	response_model=list[BoardResponse],
	tags=["Kanban Board"],
	summary="List boards",
	description="Return boards available to the authenticated user.",
)
async def get_many_boards(user_id: UUID = Depends(get_current_user_id)):
	return await board_service.get_many_boards(user_id)

@router.get(
	"/{board_id}/members",
	response_model=list[BoardMemberResponse],
	tags=["Board Members"],
	summary="List board members",
	description="Return members of a board the authenticated user can access.",
)
async def get_board_members(
	board_id: UUID = Path(description="Unique identifier of the board."),
	user_id: UUID = Depends(get_current_user_id),
):
	try:
		return await board_service.get_members(board_id, user_id)
	except BoardNotFoundException as error:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail=str(error),
		) from error

@router.delete(
	"/{board_id}/members/{member_id}",
	status_code=status.HTTP_204_NO_CONTENT,
	tags=["Board Members"],
	summary="Remove a board member",
	description="Remove a member from a board. Only the board owner can perform this action.",
)
async def remove_board_member(
	board_id: UUID = Path(description="Unique identifier of the board."),
	member_id: UUID = Path(description="Unique identifier of the member to remove."),
	owner_id: UUID = Depends(get_current_user_id),
):
	try:
		await board_service.remove_member(board_id, owner_id, member_id)
	except BoardNotFoundException as error:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail=str(error),
		) from error

@router.post(
	"/{board_id}/invites",
	response_model=BoardInviteResponse,
	status_code=status.HTTP_201_CREATED,
	tags=["Board Invitations"],
	summary="Invite a user",
	description="Send a board invitation to an email address. Only the board owner can invite users.",
)
async def invite_to_board(
	payload: BoardInvitePayload,
	board_id: UUID = Path(description="Unique identifier of the board."),
	owner_id: UUID = Depends(get_current_user_id),
):
	try:
		return await invitation_service.invite_by_email(
			board_id, owner_id, str(payload.email)
		)
	except ValueError as error:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail=str(error),
		) from error
	except BoardNotFoundException as error:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail=str(error),
		) from error

@router.get(
	"/invites",
	response_model=list[PendingBoardInviteResponse],
	tags=["Board Invitations"],
	summary="List pending invitations",
	description="Return pending board invitations for the authenticated user.",
)
async def get_pending_invites(user_id: UUID = Depends(get_current_user_id)):
	return await invitation_service.list_pending_invites(user_id)


@router.post(
	"/invites/{invite_id}/accept",
	response_model=BoardInviteActionResponse,
	tags=["Board Invitations"],
	summary="Accept an invitation",
	description="Accept a pending invitation to join a board.",
)
async def accept_board_invite(
	invite_id: UUID = Path(description="Unique identifier of the invitation."),
	user_id: UUID = Depends(get_current_user_id),
):
	try:
		invite = await invitation_service.accept_invite(invite_id, user_id)
		invite["status"] = "accepted"
		invite["id"] = invite_id
		return invite
	except BoardNotFoundException as error:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail=str(error),
		) from error


@router.post(
	"/invites/{invite_id}/reject",
	response_model=BoardInviteActionResponse,
	tags=["Board Invitations"],
	summary="Reject an invitation",
	description="Reject a pending invitation to join a board.",
)
async def reject_board_invite(
	invite_id: UUID = Path(description="Unique identifier of the invitation."),
	user_id: UUID = Depends(get_current_user_id),
):
	try:
		invite = await invitation_service.reject_invite(invite_id, user_id)
		return invite
	except BoardNotFoundException as error:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail=str(error),
		) from error

@router.get(
	"/{board_id}",
	response_model=BoardResponse,
	tags=["Kanban Board"],
	summary="Get a board",
	description="Return details for a board the authenticated user can access.",
)

async def get_board(
	board_id: UUID = Path(description="Unique identifier of the board."),
	user_id: UUID = Depends(get_current_user_id),
):
	try:
		return await board_service.get_board(board_id, user_id)
	except BoardNotFoundException as error:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error

@router.patch(
	"/{board_id}",
	response_model=BoardResponse,
	tags=["Kanban Board"],
	summary="Update a board",
	description="Update the name of a board owned by the authenticated user.",
)
async def update_board(
	payload: BoardPayload,
	board_id: UUID = Path(description="Unique identifier of the board."),
	user_id: UUID = Depends(get_current_user_id),
):
	try:
		return await board_service.update_board(board_id, user_id, payload.name)
	except BoardNotFoundException as error:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error

@router.delete(
	"/{board_id}",
	status_code=status.HTTP_204_NO_CONTENT,
	tags=["Kanban Board"],
	summary="Delete a board",
	description="Delete a board owned by the authenticated user.",
)
async def delete_board(
	board_id: UUID = Path(description="Unique identifier of the board."),
	user_id: UUID = Depends(get_current_user_id),
):
	try:
		await board_service.delete_board(board_id, user_id)
	except BoardNotFoundException as error:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error

router.include_router(column_router, prefix="/{board_id}")
router.include_router(tag_router, prefix="/{board_id}")
