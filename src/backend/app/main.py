from fastapi import FastAPI
from fastapi.routing import APIRoute
from pydantic.alias_generators import to_camel

from app.core.errors import register_error_handlers
from app.features.auth.router import router as auth_router
from app.features.health.router import router as health_router


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
    app.include_router(auth_router, prefix="/api")
    app.include_router(health_router, prefix="/api")
    return app


app = create_app()
