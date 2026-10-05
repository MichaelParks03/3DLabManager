from collections.abc import AsyncIterator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import create_app


@pytest_asyncio.fixture
async def client() -> AsyncIterator[AsyncClient]:
    # https base url lets Secure cookies round-trip
    async with AsyncClient(transport=ASGITransport(app=create_app()), base_url="https://test") as c:
        yield c
