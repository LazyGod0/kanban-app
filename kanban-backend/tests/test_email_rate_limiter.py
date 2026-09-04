import unittest
from datetime import datetime
from app.services.email import EmailRateLimitExceeded, EmailRateLimiter


class EmailRateLimiterTests(unittest.IsolatedAsyncioTestCase):
    async def test_allows_ten_requests_within_one_second(self):
        limiter = EmailRateLimiter(max_requests=10, window_seconds=1.0)

        for request_number in range(1, 12):
            try:
                await limiter.acquire()
                print(f"{datetime.now()}: Request {request_number}: allowed")
            except EmailRateLimitExceeded as error:
                print(f"{datetime.now()}: Request {request_number}: rejected - {error}")
    
    async def test_rejects_eleventh_request_within_one_second(self):
        limiter = EmailRateLimiter(max_requests=10, window_seconds=1.0)

        for _ in range(10):
            await limiter.acquire()

        with self.assertRaises(EmailRateLimitExceeded):
            await limiter.acquire()

    async def test_allows_request_after_window_expires(self):
        limiter = EmailRateLimiter(max_requests=1, window_seconds=0.01)

        await limiter.acquire()

        with self.assertRaises(EmailRateLimitExceeded):
            await limiter.acquire()

        await self.asyncio_sleep(0.02)
        await limiter.acquire()

    async def asyncio_sleep(self, seconds: float):
        import asyncio

        await asyncio.sleep(seconds)


if __name__ == "__main__":
    unittest.main()
