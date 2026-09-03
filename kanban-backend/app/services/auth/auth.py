from uuid import UUID
from psycopg_pool import AsyncConnectionPool
from app.services.auth.lib.bcrypt import hash_passwd,check_passwd
from app.repositories.user_repository import UserRepository
from app.models.auth import RegisterPayload , SignInPayload
from app.services.auth.jwt_token import token_service
from app.errors.auth import UnauthorizedException

class AuthService:
    def __init__(self,pool: AsyncConnectionPool):
        self.user_repo = UserRepository(pool)    

    async def register(self,payload: RegisterPayload):    
        created_user = await self.user_repo.create(
            name=f"{payload.fname} {payload.lname}",
            email=str(payload.email),
            password=hash_passwd(payload.password),
        )
        return {
            "user": created_user,
            "tokens": await token_service.create_token_pair(created_user["id"]),
        }
    
    async def signin(self,payload: SignInPayload):
        user = await self.user_repo.find_by_email(payload.email)
        
        if not user:
            raise UnauthorizedException("Invalid email or password")
        
        if not check_passwd(payload.password,user["password"]):
            raise UnauthorizedException("Invalid email or password")

        user.pop("password", None)
        return {
            "user": user,
            "tokens": await token_service.create_token_pair(user["id"]),
        }

    async def regenerate_access_token(self, refresh_token: str) -> str:
        return await token_service.regenerate_access_token(refresh_token)

    async def signout(self, access_token: str | None, refresh_token: str | None) -> None:
        if access_token:
            await token_service.revoke_token(access_token)
        if refresh_token:
            await token_service.revoke_token(refresh_token)

    async def get_current_user(self, access_token: str) -> dict:
        user_id = await token_service.verify_access_token(access_token)
        try:
            user_uuid = UUID(user_id)
        except ValueError as error:
            raise UnauthorizedException("Invalid access token") from error

        user = await self.user_repo.find_by_id(user_uuid)
        if not user:
            raise UnauthorizedException("User not found")
        return user






