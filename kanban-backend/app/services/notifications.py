import asyncio
from collections import defaultdict
from uuid import UUID

from fastapi import WebSocket
from fastapi.encoders import jsonable_encoder


class NotificationConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[UUID, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, user_id: UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections[user_id].add(websocket)

    async def disconnect(self, user_id: UUID, websocket: WebSocket) -> None:
        async with self._lock:
            connections = self._connections.get(user_id)
            if not connections:
                return
            connections.discard(websocket)
            if not connections:
                self._connections.pop(user_id, None)

    async def publish(self, user_id: UUID, notification: dict) -> None:
        async with self._lock:
            connections = tuple(self._connections.get(user_id, ()))

        for websocket in connections:
            try:
                await websocket.send_json(jsonable_encoder(notification))
            except Exception:
                await self.disconnect(user_id, websocket)


notification_manager = NotificationConnectionManager()