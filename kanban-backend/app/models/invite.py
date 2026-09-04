from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr
from pydantic.alias_generators import to_camel


class BoardInvitePayload(BaseModel):
    email: EmailStr

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_alias=True,
    )


class BoardInviteResponse(BaseModel):
    id: UUID
    board_id: UUID
    invited_email: EmailStr
    status: str
    expires_at: datetime

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        serialize_by_alias=True,
    )


class PendingBoardInviteResponse(BaseModel):
    id: UUID
    board_id: UUID
    board_name: str
    invited_email: EmailStr
    created_by: UUID
    inviter_name: str
    created_at: datetime
    expires_at: datetime

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        serialize_by_alias=True,
    )


class BoardInviteActionResponse(BaseModel):
    id: UUID
    board_id: UUID
    status: str

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        serialize_by_alias=True,
    )
