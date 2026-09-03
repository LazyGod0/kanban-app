from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from pydantic.alias_generators import to_camel


class BoardPayload(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    
    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_alias=True,
    )

class BoardResponse(BaseModel):
    id: UUID
    name: str = Field(min_length=1, max_length=100)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        serialize_by_alias=True,
    )
