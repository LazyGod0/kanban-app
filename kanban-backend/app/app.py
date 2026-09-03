from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.lib.db import check_database,generate_schema, pool

@asynccontextmanager
async def lifespan(app: FastAPI):
    await pool.open()
    try:
        await check_database()
        await generate_schema()
        yield
    finally:
        await pool.close()

app = FastAPI(lifespan=lifespan)