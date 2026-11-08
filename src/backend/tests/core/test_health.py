from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.core.db import get_session
from app.main import create_app


async def test_health_ok(client):
    r = await client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


async def test_health_reports_database_unavailable():
    dead = create_async_engine("postgresql+asyncpg://x:y@127.0.0.1:1/none")
    app = create_app()

    async def dead_session():
        async with AsyncSession(dead) as s:
            yield s

    app.dependency_overrides[get_session] = dead_session
    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as c:
        r = await c.get("/api/health")
    assert r.status_code == 503
    assert r.json()["error"]["code"] == "database_unavailable"
