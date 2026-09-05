from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies.auth import get_current_user_id
from app.lib.db import pool
from app.models.notification import NotificationPageResponse
from app.repositories.notification_repository import NotificationRepository

router = APIRouter(prefix="/notifications", tags=["Notifications"])
notification_repository = NotificationRepository(pool)


@router.get("", response_model=NotificationPageResponse)
async def get_notifications(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    user_id: UUID = Depends(get_current_user_id),
):
    return await notification_repository.list_for_user(user_id, page, page_size)


@router.patch("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_notification_read(
    notification_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
):
    updated = await notification_repository.mark_read(notification_id, user_id)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def clear_notification(
    notification_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
):
    deleted = await notification_repository.delete(notification_id, user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )