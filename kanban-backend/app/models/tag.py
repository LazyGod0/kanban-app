from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from pydantic.alias_generators import to_camel


class TagPayload(BaseModel):
    name: str = Field(min_length=1, max_length=50)

    model_config = ConfigDict(alias_generator=to_camel, validate_by_alias=True)


class TagResponse(BaseModel):
    id: UUID
    board_id: UUID
    name: str
    color: str | None = None
    created_at: datetime

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        serialize_by_alias=True,
    )