from psycopg_pool import AsyncConnectionPool    
from psycopg.rows import dict_row
from uuid import UUID

class UserRepository:
    def __init__(self,pool: AsyncConnectionPool):
        self.pool: AsyncConnectionPool = pool
    
    async def find_by_id(self,id: UUID):
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                await curr.execute(
                    """
                    SELECT id, name, email, created_at
                    FROM users
                    WHERE id = %s
                    """,
                    (id,),
                )
                return await curr.fetchone()
        
    async def find_by_email(self,email:str):
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as curr:
                await curr.execute(
                    "SELECT * FROM users WHERE email = %s",
                    (email,)
                )
                return await curr.fetchone()
        
    async def create(self,name:str,email:str, password:str):
          async with self.pool.connection() as conn:
              async with conn.cursor(row_factory=dict_row) as curr:
                  await curr.execute("""
                               INSERT INTO users (name,email,password)
                               VALUES (%s,%s,%s)
                               RETURNING id,name,email,created_at
                    """,(name,email,password))
                  created_user = await curr.fetchone()
              await conn.commit()
              return created_user
    