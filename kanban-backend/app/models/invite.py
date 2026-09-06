from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel


class BoardInvitePayload(BaseModel):
    """Fields required to invite a user to a board."""

    email: EmailStr = Field(description="Email address of the invited user.")

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_alias=True,
    )


class BoardInviteResponse(BaseModel):
    """Invitation details returned after creating an invitation."""

    id: UUID = Field(description="Unique invitation identifier.")
    board_id: UUID = Field(description="Board identifier for the invitation.")
    invited_email: EmailStr = Field(description="Email address of the invitee.")
    status: str = Field(description="Current invitation status.")
    expires_at: datetime = Field(description="Invitation expiration timestamp.")

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        serialize_by_alias=True,
    )


class PendingBoardInviteResponse(BaseModel):
    """Pending invitation visible to its recipient."""

    id: UUID = Field(description="Unique invitation identifier.")
    board_id: UUID = Field(description="Board identifier for the invitation.")
    board_name: str = Field(description="Name of the board.")
    invited_email: EmailStr = Field(description="Email address of the invitee.")
    created_by: UUID = Field(description="User identifier of the inviter.")
    inviter_name: str = Field(description="Display name of the inviter.")
    created_at: datetime = Field(description="Invitation creation timestamp.")
    expires_at: datetime = Field(description="Invitation expiration timestamp.")

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        serialize_by_alias=True,
    )


class BoardInviteActionResponse(BaseModel):
    """Result returned after accepting or rejecting an invitation."""

    id: UUID = Field(description="Unique invitation identifier.")
    board_id: UUID = Field(description="Board identifier for the invitation.")
    status: str = Field(description="Resulting invitation status.")

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        serialize_by_alias=True,
    )
