from typing import Annotated

from fastapi import Cookie, Depends, Response

from app.core.config import get_settings
from app.core.db import DbSession
from app.core.errors import AppError
from app.features.auth.models import Admin
from app.features.auth.service import resolve_session

SESSION_COOKIE = "session"
COOKIE_PATH = "/api"


def set_session_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        SESSION_COOKIE,
        token,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
        path=COOKIE_PATH,
        max_age=settings.session_ttl_days * 86400,
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        SESSION_COOKIE,
        httponly=True,
        samesite="lax",
        secure=get_settings().cookie_secure,
        path=COOKIE_PATH,
    )


async def require_admin(
    db: DbSession, response: Response, session: Annotated[str | None, Cookie()] = None
) -> Admin:
    if not session or (admin := await resolve_session(db, session)) is None:
        raise AppError(401, "not_authenticated", "Sign in required")
    # the server slides expiry on use, so the cookie slides with it
    set_session_cookie(response, session)
    return admin


CurrentAdmin = Annotated[Admin, Depends(require_admin)]
