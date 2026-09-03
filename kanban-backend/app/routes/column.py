from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies.auth import get_current_user_id
from app.errors.board import BoardNotFoundException
from app.lib.db import pool
from app.models.column import ColumnPayload, ColumnResponse
from app.repositories.col_repository import ColumnRepository
from app.services.column.column import ColumnService

router = APIRouter(prefix="/column", tags=["Board Columns"])
column_service = ColumnService(ColumnRepository(pool))

@router.post("",response_model=list[ColumnResponse],status_code=status.HTTP_201_CREATED,)
async def create_columns(board_id: UUID,columns: list[ColumnPayload],user_id: UUID = Depends(get_current_user_id),):
    try:
        return await column_service.create_columns(board_id, user_id, columns)
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

@router.get("",response_model=list[ColumnResponse])
async def get_many_columns(
    board_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
):
    try:
        return await column_service.get_many_columns(board_id, user_id)
    except BoardNotFoundException as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error


@router.get("/{column_id}",response_model=ColumnResponse)
async def get_column(board_id: UUID,column_id: UUID,user_id: UUID = Depends(get_current_user_id),):
    try:
        return await column_service.get_column(board_id, column_id, user_id)
    except BoardNotFoundException as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

@router.patch("/{column_id}",response_model=ColumnResponse)
async def update_column(
    board_id: UUID,
    column_id: UUID,
    payload: ColumnPayload,
    user_id: UUID = Depends(get_current_user_id),
):
    try:
        return await column_service.update_column(
            board_id, column_id, user_id, payload.name, payload.position
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


@router.delete("/{column_id}",status_code=status.HTTP_204_NO_CONTENT)
async def delete_column(
    board_id: UUID,
    column_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
):
    try:
        await column_service.delete_column(board_id, column_id, user_id)
    except BoardNotFoundException as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error
