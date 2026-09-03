from uuid import UUID
from fastapi import Cookie, Depends, HTTPException, status
from app.errors.auth import UnauthorizedException
from app.lib.db import pool
from app.repositories.user_repository import UserRepository
from app.services.auth.jwt_token import token_service


async def get_current_user_id(
    access_token: str | None = Cookie(default=None),
) -> UUID:
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Access token is required")
    try:
        return await token_service.verify_access_token(access_token)
    except UnauthorizedException as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Invalid access token") from error


async def get_current_user(
    user_id: str = Depends(get_current_user_id),
) -> dict:
    try:
        id = UUID(user_id)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Invalid user id format") from error
    user_repo = UserRepository(pool)
    user = await user_repo.find_by_id(id=id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="User not found",)
    return user
