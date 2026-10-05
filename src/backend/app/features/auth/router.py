from typing import Annotated

from fastapi import APIRouter, Cookie, Response

from app.core.config import get_settings
from app.core.db import DbSession
from app.core.errors import AppError, error_responses
from app.features.auth.dependencies import CurrentAdmin
from app.features.auth.schemas import AdminRead, LoginRequest
from app.features.auth.service import authenticate, create_session, delete_session

SESSION_COOKIE = "session"
COOKIE_PATH = "/api"

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", responses=error_responses(401))
async def login(body: LoginRequest, response: Response, db: DbSession) -> AdminRead:
    admin = await authenticate(db, email=body.email, password=body.password)
    if admin is None:
        raise AppError(401, "invalid_credentials", "Email or password is incorrect")
    settings = get_settings()
    response.set_cookie(
        SESSION_COOKIE,
        await create_session(db, admin),
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
        path=COOKIE_PATH,
        max_age=settings.session_ttl_days * 86400,
    )
    return AdminRead.model_validate(admin)


@router.post("/logout", status_code=204, responses=error_responses())
async def logout(
    response: Response, db: DbSession, session: Annotated[str | None, Cookie()] = None
) -> None:
    if session:
        await delete_session(db, session)
    response.delete_cookie(SESSION_COOKIE, path=COOKIE_PATH)


@router.get("/me", responses=error_responses(401))
async def get_me(admin: CurrentAdmin) -> AdminRead:
    return AdminRead.model_validate(admin)
