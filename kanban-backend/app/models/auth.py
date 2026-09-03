from uuid import UUID
from datetime import datetime
from typing_extensions import Self
from pydantic import BaseModel,Field,EmailStr,model_validator,ConfigDict
from pydantic.alias_generators import to_camel
  
class SignInPayload(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8,pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%]).{8,}$")
    
    model_config = ConfigDict(
        regex_engine="python-re",
        
    )
    
class RegisterPayload(BaseModel):
    email: EmailStr
    fname: str = Field(min_length=1,max_length=50)
    lname:str = Field(min_length=1,max_length=50)
    password: str = Field(
        min_length=8,
        pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%]).{8,}$"
    )
    confirmed_password:str =Field(min_length=8,pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%]).{8,}$")
    
    @model_validator(mode="after")
    def check_passwd_match(self)->Self:
        if self.password != self.confirmed_password:
            raise ValueError("Password do not match")
        return self
    
    model_config = ConfigDict(
        regex_engine="python-re",
        alias_generator=to_camel,
        validate_by_alias=True,
    )
    
class UserResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    created_at: datetime

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        serialize_by_alias=True,
    )
    
