from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from app.dependencies.auth import get_current_user
from app.lib.db import pool
from app.models.auth import RegisterPayload,SignInPayload, UserResponse
from app.services.auth.auth import AuthService
from app.errors.auth import ForbiddenException, UnauthorizedException
from app.config.setting import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])
auth_service = AuthService(pool)

def set_auth_cookies(response: Response, tokens: dict[str, str]) -> None:
    response.set_cookie(
        key="access_token",
        value=tokens["access_token"],
        max_age=15 * 60,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
    )
    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
    )

def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
    )
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
    )

@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    response_model=UserResponse,
    summary="Register an account",
    description="Create a new user account.",
)
async def register(payload: RegisterPayload, response: Response):
    try:
        result = await auth_service.register(payload)
        set_auth_cookies(response, result["tokens"])
        return result["user"]
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


@router.post(
    "/signin",
    response_model=UserResponse,
    summary="Sign in",
    description="Sign in and set authentication cookies.",
)
async def signin(payload: SignInPayload, response: Response):
    try:
        result = await auth_service.signin(payload)
        set_auth_cookies(response, result["tokens"])
        
        return result["user"]
    except UnauthorizedException as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error),
        ) from error


@router.post(
    "/refresh",
    summary="Refresh access token",
    description="Issue a new access token from the refresh cookie.",
)
async def refresh(
    response: Response,
    refresh_token: str | None = Cookie(
        default=None,
        description="Refresh token stored in the authentication cookie.",
    ),
):
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is required",
        )

    try:
        access_token = await auth_service.regenerate_access_token(refresh_token)
    except ForbiddenException as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(error)
        ) from error
    except UnauthorizedException as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error)
        )

    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=15 * 60,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Return the signed-in user's profile.",
)
async def me(user: dict = Depends(get_current_user)):
    return user


@router.post(
    "/signout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Sign out",
    description="Clear authentication cookies and end the session.",
)
async def signout(
    response: Response,
    access_token: str | None = Cookie(
        default=None,
        description="Access token stored in the authentication cookie.",
    ),
    refresh_token: str | None = Cookie(
        default=None,
        description="Refresh token stored in the authentication cookie.",
    ),
):
    await auth_service.signout(access_token, refresh_token)
    clear_auth_cookies(response)