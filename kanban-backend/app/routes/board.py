from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies.auth import get_current_user_id
from app.errors.board import BoardNotFoundException
from app.lib.db import pool
from app.models.board import BoardPayload, BoardResponse
from app.repositories.board_repository import BoardRepository
from app.services.board.board import BoardService

router = APIRouter(prefix="/board", tags=["Kanban Board"])
board_repository = BoardRepository(pool)
board_service = BoardService(board_repository)

@router.post("", response_model=BoardResponse, status_code=status.HTTP_201_CREATED)
async def create_board(payload: BoardPayload,user_id: UUID = Depends(get_current_user_id)):
	return await board_service.create_board(user_id, payload.name)

@router.get("", response_model=list[BoardResponse])
async def get_many_boards(user_id: UUID = Depends(get_current_user_id)):
	return await board_service.get_many_boards(user_id)

@router.get("/{board_id}", response_model=BoardResponse)

async def get_board(board_id: UUID,user_id: UUID = Depends(get_current_user_id)):
	try:
		return await board_service.get_board(board_id, user_id)
	except BoardNotFoundException as error:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error

@router.patch("/{board_id}", response_model=BoardResponse)
async def update_board(
	board_id: UUID,
	payload: BoardPayload,
	user_id: UUID = Depends(get_current_user_id),
):
	try:
		return await board_service.update_board(board_id, user_id, payload.name)
	except BoardNotFoundException as error:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error

@router.delete("/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_board(board_id: UUID,user_id: UUID = Depends(get_current_user_id),):
	try:
		await board_service.delete_board(board_id, user_id)
	except BoardNotFoundException as error:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
