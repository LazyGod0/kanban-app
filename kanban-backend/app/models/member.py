from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr
from pydantic.alias_generators import to_camel

class BoardMemberResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    role: str
    joined_at: datetime

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        serialize_by_alias=True,
    )