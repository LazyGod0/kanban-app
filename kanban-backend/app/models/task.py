from datetime import datetime
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel
TaskStatus = Literal["active", "done", "overdue"]

class TaskPayload(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    status: TaskStatus = "active"
    due_date: datetime | None = None
    position: int = Field(default=0, ge=0)

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_alias=True,
    )

class TaskUpdatePayload(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: TaskStatus | None = None
    due_date: datetime | None = None
    position: int | None = Field(default=None, ge=0)

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_alias=True,
    )

class TaskResponse(BaseModel):
    id: UUID
    column_id: UUID
    title: str
    description: str | None
    status: TaskStatus
    due_date: datetime | None
    position: int
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        serialize_by_alias=True,
    )


class TaskAssigneeResponse(BaseModel):
    id: UUID
    name: str
    email: str

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        serialize_by_alias=True,
    )