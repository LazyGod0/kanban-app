from fastapi import APIRouter, Cookie, HTTPException, Response, status
from app.lib.db import pool
from app.models.auth import RegisterPayload,SignInPayload, UserResponse
from app.services.auth.auth import AuthService
from app.errors.auth import ForbiddenException, UnauthorizedException

router = APIRouter(prefix="/auth", tags=["auth"])
auth_service = AuthService(pool)

def set_auth_cookies(response: Response, tokens: dict[str, str]) -> None:
    response.set_cookie(
        key="access_token",
        value=tokens["access_token"],
        max_age=15 * 60,
        httponly=True,
        samesite="lax",
    )
    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        samesite="lax",
    )

def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(key="access_token", httponly=True, samesite="lax")
    response.delete_cookie(key="refresh_token", httponly=True, samesite="lax")

@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    response_model=UserResponse,
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


@router.post("/signin", response_model=UserResponse)
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


@router.post("/refresh")
async def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
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
    )


@router.get("/me", response_model=UserResponse)
async def me(access_token: str | None = Cookie(default=None)):
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token is required",
        )

    try:
        return await auth_service.get_current_user(access_token)
    except UnauthorizedException as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error),
        ) from error


@router.post("/signout", status_code=status.HTTP_204_NO_CONTENT)
async def signout(
    response: Response,
    access_token: str | None = Cookie(default=None),
    refresh_token: str | None = Cookie(default=None),
):
    await auth_service.signout(access_token, refresh_token)
    clear_auth_cookies(response)