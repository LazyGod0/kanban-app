from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class NotificationResponse(BaseModel):
    id: UUID
    task_id: UUID | None
    board_invite_id: UUID | None
    type: str
    message: str
    is_read: bool
    created_at: datetime
    task_title: str | None = None
    board_id: UUID | None = None

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        serialize_by_alias=True,
    )


class NotificationPageResponse(BaseModel):
    items: list[NotificationResponse]
    page: int
    page_size: int
    total: int
    unread_count: int

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        serialize_by_alias=True,
    )