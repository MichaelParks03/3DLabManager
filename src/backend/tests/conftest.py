import asyncio
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import AsyncExitStack
from pathlib import Path

import pytest
import pytest_asyncio
from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine

from app.core.config import get_settings
from app.core.db import get_session
from app.features.auth.models import Admin
from app.features.auth.service import create_admin
from app.main import create_app

ALEMBIC_INI = Path(__file__).parents[1] / "alembic.ini"
PASSWORD = "correct horse battery"

MakeAdmin = Callable[..., Awaitable[Admin]]
Login = Callable[..., Awaitable[AsyncClient]]


def new_client(app: FastAPI) -> AsyncClient:
    # https base url lets Secure cookies round-trip
    return AsyncClient(transport=ASGITransport(app=app), base_url="https://test")


@pytest_asyncio.fixture(scope="session")
async def database() -> AsyncIterator[AsyncEngine]:
    dev_url = make_url(get_settings().database_url)
    test_url = dev_url.set(database=f"{dev_url.database}_test")
    admin = create_async_engine(dev_url.set(database="postgres"), isolation_level="AUTOCOMMIT")
    async with admin.connect() as conn:
        await conn.execute(text(f'DROP DATABASE IF EXISTS "{test_url.database}" WITH (FORCE)'))
        await conn.execute(text(f'CREATE DATABASE "{test_url.database}"'))
    await admin.dispose()

    # alembic's async env calls asyncio.run, so it needs its own thread
    cfg = Config(ALEMBIC_INI)
    cfg.set_main_option("sqlalchemy.url", test_url.render_as_string(hide_password=False))
    await asyncio.to_thread(command.upgrade, cfg, "head")

    engine = create_async_engine(test_url)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(database: AsyncEngine) -> AsyncIterator[AsyncSession]:
    async with database.connect() as conn:
        transaction = await conn.begin()
        async with AsyncSession(
            bind=conn, expire_on_commit=False, join_transaction_mode="create_savepoint"
        ) as session:
            yield session
        await transaction.rollback()


@pytest.fixture
def app(db_session: AsyncSession) -> FastAPI:
    app = create_app()
    app.dependency_overrides[get_session] = lambda: db_session
    return app


@pytest_asyncio.fixture
async def client(app: FastAPI) -> AsyncIterator[AsyncClient]:
    async with new_client(app) as c:
        yield c


@pytest.fixture
def make_admin(db_session: AsyncSession) -> MakeAdmin:
    async def factory(email: str = "admin@uta.edu", name: str = "Admin", password: str = PASSWORD):
        return await create_admin(db_session, email=email, name=name, password=password)

    return factory


@pytest_asyncio.fixture
async def login(app: FastAPI) -> AsyncIterator[Login]:
    async with AsyncExitStack() as stack:

        async def factory(email: str, password: str = PASSWORD) -> AsyncClient:
            c = await stack.enter_async_context(new_client(app))
            r = await c.post("/api/auth/login", json={"email": email, "password": password})
            assert r.status_code == 200
            return c

        yield factory


@pytest_asyncio.fixture
async def admin_client(make_admin: MakeAdmin, login: Login) -> AsyncClient:
    admin = await make_admin()
    return await login(admin.email, PASSWORD)
