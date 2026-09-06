from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from pydantic.alias_generators import to_camel


class BoardPayload(BaseModel):
    """Fields required to create or update a board."""

    name: str = Field(
        min_length=1,
        max_length=100,
        description="Board name, between 1 and 100 characters.",
    )
    
    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_alias=True,
    )

class BoardResponse(BaseModel):
    """Board details visible to the authenticated user."""

    id: UUID = Field(description="Unique board identifier.")
    name: str = Field(
        min_length=1,
        max_length=100,
        description="Board name.",
    )
    created_at: datetime = Field(description="Board creation timestamp.")
    updated_at: datetime = Field(description="Last board update timestamp.")
    is_owner: bool = Field(description="Whether the current user owns the board.")

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        serialize_by_alias=True,
    )
