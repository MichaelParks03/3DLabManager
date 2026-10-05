import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_settings_require_database_url(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_settings_defaults(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://u:p@h/db")
    settings = Settings(_env_file=None)
    assert settings.cookie_secure is True
    assert settings.session_ttl_days == 7


async def test_docs_served_under_api(client):
    assert (await client.get("/api/openapi.json")).status_code == 200
    assert (await client.get("/api/docs")).status_code == 200
    assert (await client.get("/openapi.json")).status_code == 404
