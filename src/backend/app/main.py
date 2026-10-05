from fastapi import FastAPI
from fastapi.routing import APIRoute
from pydantic.alias_generators import to_camel

from app.core.errors import register_error_handlers


def operation_id(route: APIRoute) -> str:
    return to_camel(route.name)


def create_app() -> FastAPI:
    app = FastAPI(
        title="3D Lab Manager API",
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
        redoc_url=None,
        generate_unique_id_function=operation_id,
    )
    register_error_handlers(app)
    return app


app = create_app()
