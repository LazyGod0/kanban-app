from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel

class BoardMemberResponse(BaseModel):
    """Member details for a board."""

    id: UUID = Field(description="Unique user identifier.")
    name: str = Field(description="Member display name.")
    email: EmailStr = Field(description="Member email address.")
    role: str = Field(description="Member role in the board.")
    joined_at: datetime = Field(description="Timestamp when the member joined.")

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        serialize_by_alias=True,
    )