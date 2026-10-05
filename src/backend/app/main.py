from fastapi import FastAPI


def create_app() -> FastAPI:
    return FastAPI(
        title="3D Lab Manager API",
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
        redoc_url=None,
    )


app = create_app()
