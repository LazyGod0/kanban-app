from hashlib import sha256
from datetime import datetime
from typing import Literal
from psycopg_pool import AsyncConnectionPool

class JWTRepository:
    def __init__(self,pool: AsyncConnectionPool):
        self.pool = pool
        
    async def create_token(self,
        token: str,
        user_id: str,
        token_type: Literal["access" , "refresh"],
        exp_at: datetime
    ):
        hashed_token = sha256(token.encode("utf-8")).hexdigest()
        
        async with self.pool.connection() as conn:
            async with conn.cursor() as curr:
                await curr.execute("""
                    INSERT INTO tokens (user_id,token_hash,token_type,exp_at)
                    VALUES (%s, %s,%s, %s)
                """,(user_id,hashed_token,token_type,exp_at))

    async def is_active(
        self,
        token: str,
        token_type: Literal["access", "refresh"],
    ) -> bool:
        token_hash = sha256(token.encode("utf-8")).hexdigest()

        async with self.pool.connection() as conn:
            async with conn.cursor() as curr:
                await curr.execute("""
                    SELECT 1
                    FROM tokens
                    WHERE token_hash = %s
                      AND token_type = %s
                      AND revoked = FALSE
                      AND exp_at > now()
                    LIMIT 1
                """, (token_hash, token_type))
                return await curr.fetchone() is not None

    async def revoke(self, token: str) -> None:
        token_hash = sha256(token.encode("utf-8")).hexdigest()

        async with self.pool.connection() as conn:
            async with conn.cursor() as curr:
                await curr.execute("""
                    UPDATE tokens
                    SET revoked = TRUE
                    WHERE token_hash = %s
                """, (token_hash,))