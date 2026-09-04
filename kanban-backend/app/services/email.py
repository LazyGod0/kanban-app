import html
import asyncio
import time
from collections import deque
import httpx
from app.config.setting import settings
class EmailRateLimitExceeded(Exception):
    pass
class EmailRateLimiter:
    def __init__(self, max_requests: int = 10, window_seconds: float = 1.0):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.request_times: deque[float] = deque()
        self.lock = asyncio.Lock()

    async def acquire(self) -> None:
        async with self.lock:
            now = time.monotonic()

            while (
                self.request_times
                and now - self.request_times[0] >= self.window_seconds
            ):
                self.request_times.popleft()

            if len(self.request_times) >= self.max_requests:
                raise EmailRateLimitExceeded(
                    "Email rate limit exceeded. Try again later."
                )

            self.request_times.append(now)


class EmailService:
    rate_limiter = EmailRateLimiter(max_requests=10)

    async def send_board_invite(
        self,
        recipient: str,
        board_name: str,
        invite_url: str,
    ) -> None:
        if not settings.resend_api_key or not settings.email_from:
            raise RuntimeError("Email service is not configured")

        await self.rate_limiter.acquire()

        safe_board_name = html.escape(board_name)
        safe_invite_url = html.escape(invite_url, quote=True)
        body = f"""
        <html>
          <body>
            <p>You have been invited to join <strong>{safe_board_name}</strong>.</p>
            <p><a href=\"{safe_invite_url}\">Accept invitation</a></p>
          </body>
        </html>
        """

        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.resend_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": settings.email_from,
                    "to": [recipient],
                    "subject": f"Invitation to join {board_name}",
                    "html": body,
                },
            )
            response.raise_for_status()
