import pytest
from fastapi import APIRouter
from httpx import ASGITransport, AsyncClient
from pydantic import Field

from app.core.errors import AppError, error_responses
from app.core.schemas import ApiSchema
from app.main import create_app


class Widget(ApiSchema):
    display_name: str = Field(max_length=5)


@pytest.fixture
async def widget_client():
    app = create_app()
    router = APIRouter()

    @router.post("/widgets", response_model=Widget, status_code=201, responses=error_responses(409))
    async def create_widget(body: Widget) -> Widget:
        if body.display_name == "taken":
            raise AppError(409, "widget_taken", "Widget exists")
        return body

    app.include_router(router, prefix="/api")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as c:
        yield c


async def test_response_uses_camel_case(widget_client):
    r = await widget_client.post("/api/widgets", json={"displayName": "ab"})
    assert r.status_code == 201
    assert r.json() == {"displayName": "ab"}


async def test_app_error_uses_envelope(widget_client):
    r = await widget_client.post("/api/widgets", json={"displayName": "taken"})
    assert r.status_code == 409
    assert r.json() == {
        "error": {"code": "widget_taken", "message": "Widget exists", "details": None}
    }


async def test_validation_error_uses_envelope(widget_client):
    r = await widget_client.post("/api/widgets", json={"displayName": "toolong"})
    assert r.status_code == 422
    body = r.json()["error"]
    assert body["code"] == "validation_error"
    assert body["details"][0]["field"] == "body.displayName"


async def test_unknown_route_uses_envelope(widget_client):
    r = await widget_client.get("/api/nope")
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "not_found"


async def test_openapi_uses_camel_operation_ids_and_error_schema(widget_client):
    spec = (await widget_client.get("/api/openapi.json")).json()
    op = spec["paths"]["/api/widgets"]["post"]
    assert op["operationId"] == "createWidget"
    for status in ("409", "422"):
        ref = op["responses"][status]["content"]["application/json"]["schema"]["$ref"]
        assert ref.endswith("/ErrorResponse")
