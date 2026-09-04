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
    expires_at: datetime

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        serialize_by_alias=True,
    )


class AcceptInviteResponse(BaseModel):
    board_id: UUID

    model_config = ConfigDict(
        alias_generator=to_camel,
        serialize_by_alias=True,
    )
