from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.lib.db import check_database,generate_schema, pool
from app.routes.auth import router as auth_router
from app.routes.board import router as board_router
from app.routes.notification import router as notification_router
from app.config.setting import settings

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
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        settings.frontend_url,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(board_router)
app.include_router(notification_router)