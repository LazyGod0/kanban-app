from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel
class TaskPayload(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    due_date: datetime | None = None
    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_alias=True,
    )

class TaskUpdatePayload(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    due_date: datetime | None = None
    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_alias=True,
    )

class TaskResponse(BaseModel):
    id: UUID
    column_id: UUID
    title: str
    description: str | None
    due_date: datetime | None
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
    assigned_by: UUID | None = None
    
    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        serialize_by_alias=True,
    )