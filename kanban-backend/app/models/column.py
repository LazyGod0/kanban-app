from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field,ConfigDict
from pydantic.alias_generators import to_camel

class MultiColumnPayload(BaseModel):
    name: str = Field(min_length=1,max_length=50)
    position: int = Field(default=1)
    board_id: UUID
    
    model_config = ConfigDict(alias_generator=to_camel,validate_by_alias=True)

class ColumnPayload(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    position: int = Field(default=1, ge=0)

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_alias=True,
    )

class ColumnResponse(BaseModel):
    id: UUID
    board_id: UUID
    name: str
    position: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        serialize_by_alias=True,
    )