from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies.auth import get_current_user_id
from app.errors.board import BoardNotFoundException
from app.lib.db import pool
from app.models.tag import TagPayload, TagResponse
from app.repositories.tag_repository import TagRepository

router = APIRouter(prefix="/tags", tags=["Board Tags"])
tag_repository = TagRepository(pool)


@router.get("", response_model=list[TagResponse])
async def list_tags(
    board_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
):
    return await tag_repository.list_for_board(board_id, user_id)


@router.post("", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(
    board_id: UUID,
    payload: TagPayload,
    user_id: UUID = Depends(get_current_user_id),
):
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Tag name is required")
    try:
        tag = await tag_repository.create(board_id, user_id, payload.name)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    if not tag:
        raise HTTPException(status_code=404, detail="Board not found")
    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    board_id: UUID,
    tag_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
):
    try:
        deleted = await tag_repository.delete(board_id, tag_id, user_id)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    if not deleted:
        raise HTTPException(status_code=404, detail="Tag not found")