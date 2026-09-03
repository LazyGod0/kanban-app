import jwt
from psycopg_pool import AsyncConnectionPool
from datetime import datetime, timedelta, timezone
from typing import Literal
from jwt import ExpiredSignatureError, InvalidTokenError
from app.errors.auth import ForbiddenException, UnauthorizedException
from app.config.setting import settings
from app.lib.db import pool
from app.repositories.jwt_repository import JWTRepository	

TokenType = Literal["access", "refresh"]

class JWTTokenService:
	def __init__(
     		self, 
			pool: AsyncConnectionPool,
            secret: str, 
            algorithm: str = "HS256"
        ):
		self.secret = secret
		self.algorithm = algorithm
		self.jwt_repo = JWTRepository(pool=pool)

	async def create_token(
		self,
		user_id: str,
		token_type: TokenType,
		expires_in: timedelta,
	) -> str:
		issued_at = datetime.now(timezone.utc)
		expires_at = issued_at + expires_in
		payload = {
			"iat": issued_at,
			"exp": expires_at,
			"type": token_type,
			"user_id": str(user_id),
		}
		
		token = jwt.encode(payload, self.secret, algorithm=self.algorithm)
		
		await self.jwt_repo.create_token(
					token=token,
					token_type=token_type,
					user_id=str(user_id),
					exp_at=expires_at
				)
  
		return token

	async def create_token_pair(self, user_id: str) -> dict[str, str]:
		return {
			"access_token": await self.create_token(
				user_id,
				"access",
				timedelta(minutes=15),
			),
			"refresh_token": await self.create_token(
				user_id,
				"refresh",
				timedelta(days=7),
			),
		}

	async def regenerate_access_token(self, refresh_token: str) -> str:
		try:
			payload = jwt.decode(
				refresh_token,
				self.secret,
				algorithms=[self.algorithm],
			)
			if payload.get("type") != "refresh":
				raise ForbiddenException("Refresh token required")
			user_id = payload.get("user_id")
			if not user_id:
				raise ForbiddenException("Invalid refresh token")
			
			if not await self.jwt_repo.is_active(refresh_token, "refresh"):
				raise ForbiddenException("Refresh token is revoked or expired")

		except ExpiredSignatureError as error:
			raise ForbiddenException("Refresh token has expired") from error
		except InvalidTokenError as error:
			raise ForbiddenException("Invalid refresh token") from error

		return await self.create_token(
			user_id=str(user_id),
			token_type="access",
			expires_in=timedelta(minutes=15),
		)

	async def verify_access_token(self, access_token: str) -> str:
		try:
			payload = jwt.decode(
				access_token,
				self.secret,
				algorithms=[self.algorithm],
			)
		except ExpiredSignatureError as error:
			raise UnauthorizedException("Access token has expired") from error
		except InvalidTokenError as error:
			raise UnauthorizedException("Invalid access token") from error

		if payload.get("type") != "access":
			raise UnauthorizedException("Access token required")

		user_id = payload.get("user_id")
		if not user_id:
			raise UnauthorizedException("Invalid access token")

		if not await self.jwt_repo.is_active(access_token, "access"):
			raise UnauthorizedException("Access token is revoked or expired")

		return str(user_id)

	async def revoke_token(self, token: str) -> None:
		await self.jwt_repo.revoke(token)


token_service = JWTTokenService(pool=pool, secret=settings.jwt_secret)
