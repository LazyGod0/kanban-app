from uuid import UUID

from fastapi import (
    APIRouter,
    Cookie,
    Depends,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
    status,
)

from app.dependencies.auth import get_current_user_id
from app.lib.db import pool
from app.models.notification import NotificationPageResponse
from app.repositories.notification_repository import NotificationRepository
from app.errors.auth import UnauthorizedException
from app.services.auth.jwt_token import token_service
from app.services.notifications import notification_manager

router = APIRouter(prefix="/notifications", tags=["Notifications"])
notification_repository = NotificationRepository(pool)


@router.websocket("/ws")
async def notification_websocket(
    websocket: WebSocket,
    access_token: str | None = Cookie(default=None),
):
    if not access_token:
        await websocket.close(code=1008, reason="Authentication required")
        return

    try:
        user_id = UUID(await token_service.verify_access_token(access_token))
    except (UnauthorizedException, ValueError):
        await websocket.close(code=1008, reason="Invalid access token")
        return

    await notification_manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await notification_manager.disconnect(user_id, websocket)


@router.get("", response_model=NotificationPageResponse)
async def get_notifications(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    user_id: UUID = Depends(get_current_user_id),
):
    return await notification_repository.list_for_user(user_id, page, page_size)


@router.patch("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_notifications_read(
    user_id: UUID = Depends(get_current_user_id),
):
    await notification_repository.mark_all_read(user_id)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_all_notifications(
    user_id: UUID = Depends(get_current_user_id),
):
    await notification_repository.delete_all(user_id)


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