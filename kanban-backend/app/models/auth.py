from uuid import UUID
from datetime import datetime
from typing_extensions import Self
from pydantic import BaseModel,Field,EmailStr,model_validator,ConfigDict
from pydantic.alias_generators import to_camel
  
class SignInPayload(BaseModel):
    """Credentials required to sign in."""

    email: EmailStr = Field(description="Account email address.")
    password: str = Field(
        min_length=8,
        pattern=r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%]).{8,}$",
        description="At least 8 characters with uppercase, lowercase, number, and one of !@#$%.",
    )
    
    model_config = ConfigDict(
        regex_engine="python-re",
        json_schema_extra={
            "examples": [
                {
                    "email": "alex@example.com",
                    "password": "Secure@123",
                }
            ]
        },
        
    )
    
class RegisterPayload(BaseModel):
    """User details required to create an account."""

    email: EmailStr = Field(description="Email address for the new account.")
    fname: str = Field(min_length=1, max_length=50, description="First name.")
    lname: str = Field(min_length=1, max_length=50, description="Last name.")
    password: str = Field(
        min_length=8,
        pattern=r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%]).{8,}$",
        description="At least 8 characters with uppercase, lowercase, number, and one of !@#$%.",
    )
    confirmed_password: str = Field(
        min_length=8,
        pattern=r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%]).{8,}$",
        description="Must match password and follow the same password policy.",
    )
    
    @model_validator(mode="after")
    def check_passwd_match(self)->Self:
        if self.password != self.confirmed_password:
            raise ValueError("Password do not match")
        return self
    
    model_config = ConfigDict(
        regex_engine="python-re",
        alias_generator=to_camel,
        validate_by_alias=True,
        json_schema_extra={
            "examples": [
                {
                    "email": "alex@example.com",
                    "fname": "Alex",
                    "lname": "Morgan",
                    "password": "Secure@123",
                    "confirmedPassword": "Secure@123",
                },
                {
                    "email": "alex@example.com",
                    "fname": "Alex",
                    "lname": "Morgan",
                    "password": "weakpassword",
                    "confirmedPassword": "weakpassword",
                },
                {
                    "email": "alex@example.com",
                    "fname": "Alex",
                    "lname": "Morgan",
                    "password": "Secure@123",
                    "confirmedPassword": "Different@123",
                },
            ]
        },
    )
    
class UserResponse(BaseModel):
    """Public user profile returned by authentication endpoints."""

    id: UUID = Field(description="Unique user identifier.")
    name: str = Field(description="User display name.")
    email: EmailStr = Field(description="User email address.")
    created_at: datetime = Field(description="Account creation timestamp.")

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        serialize_by_alias=True,
    )
    
