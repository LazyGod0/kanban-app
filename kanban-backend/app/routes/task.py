from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies.auth import get_current_user_id
from app.errors.board import BoardNotFoundException
from app.lib.db import pool
from app.models.task import (
    TaskAssigneeResponse,
    TaskPayload,
    TaskResponse,
    TaskUpdatePayload,
)
from app.repositories.col_repository import ColumnRepository
from app.repositories.task_repository import TaskRepository
from app.repositories.tag_repository import TagRepository
from app.services.task.task import TaskService

router = APIRouter(prefix="/tasks")
task_service = TaskService(
    TaskRepository(pool), ColumnRepository(pool), TagRepository(pool)
)

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED, tags=["Column Tasks"])
async def create_task(
    board_id: UUID,
    column_id: UUID,
    payload: TaskPayload,
    user_id: UUID = Depends(get_current_user_id),
):
    try:
        return await task_service.create_task(board_id, column_id, user_id, payload)
    except BoardNotFoundException as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

@router.get("", response_model=list[TaskResponse], tags=["Column Tasks"])
async def get_many_tasks(
    board_id: UUID,
    column_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
):
    try:
        return await task_service.get_many_tasks(board_id, column_id, user_id)
    except BoardNotFoundException as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

@router.get("/{task_id}", response_model=TaskResponse, tags=["Column Tasks"])
async def get_task(
    board_id: UUID,
    column_id: UUID,
    task_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
):
    try:
        return await task_service.get_task(board_id, column_id, task_id, user_id)
    except BoardNotFoundException as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

@router.patch("/{task_id}", response_model=TaskResponse, tags=["Column Tasks"])
async def update_task(
    board_id: UUID,
    column_id: UUID,
    task_id: UUID,
    payload: TaskUpdatePayload,
    user_id: UUID = Depends(get_current_user_id),
):
    try:
        return await task_service.update_task(
            board_id, column_id, task_id, user_id, payload
        )
    except BoardNotFoundException as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Column Tasks"])
async def delete_task(
    board_id: UUID,
    column_id: UUID,
    task_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
):
    try:
        await task_service.delete_task(board_id, column_id, task_id, user_id)
    except BoardNotFoundException as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

@router.post(
    "/{task_id}/assignees/{assignee_id}",
    response_model=TaskAssigneeResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Task Assignments"],
)
async def assign_task(
    board_id: UUID,
    column_id: UUID,
    task_id: UUID,
    assignee_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
):
    try:
        return await task_service.assign_task(
            board_id, column_id, task_id, user_id, assignee_id
        )
    except BoardNotFoundException as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

@router.get(
    "/{task_id}/assignees",
    response_model=list[TaskAssigneeResponse],
    tags=["Task Assignments"],
)
async def get_task_assignees(
    board_id: UUID,
    column_id: UUID,
    task_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
):
    try:
        return await task_service.get_task_assignees(
            board_id, column_id, task_id, user_id
        )
    except BoardNotFoundException as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

@router.delete(
    "/{task_id}/assignees/{assignee_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Task Assignments"],
)
async def unassign_task(
    board_id: UUID,
    column_id: UUID,
    task_id: UUID,
    assignee_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
):
    try:
        await task_service.unassign_task(
            board_id, column_id, task_id, user_id, assignee_id
        )
    except BoardNotFoundException as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error