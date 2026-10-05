from typing import Annotated

from fastapi import APIRouter, Cookie, Response

from app.core.db import DbSession
from app.core.errors import AppError, error_responses
from app.features.auth.dependencies import (
    COOKIE_PATH,
    SESSION_COOKIE,
    CurrentAdmin,
    set_session_cookie,
)
from app.features.auth.schemas import AdminRead, LoginRequest
from app.features.auth.service import authenticate, create_session, delete_session

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", responses=error_responses(401))
async def login(body: LoginRequest, response: Response, db: DbSession) -> AdminRead:
    admin = await authenticate(db, email=body.email, password=body.password)
    if admin is None:
        raise AppError(401, "invalid_credentials", "Email or password is incorrect")
    set_session_cookie(response, await create_session(db, admin))
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
