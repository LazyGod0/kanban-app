import html

import httpx

from app.config.setting import settings


class EmailService:
    async def send_board_invite(
        self,
        recipient: str,
        board_name: str,
        invite_url: str,
    ) -> None:
        if not settings.resend_api_key or not settings.email_from:
            raise RuntimeError("Email service is not configured")

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
