from typing import Annotated

from fastapi import Cookie, Depends

from app.core.db import DbSession
from app.core.errors import AppError
from app.features.auth.models import Admin
from app.features.auth.service import resolve_session


async def require_admin(db: DbSession, session: Annotated[str | None, Cookie()] = None) -> Admin:
    admin = await resolve_session(db, session) if session else None
    if admin is None:
        raise AppError(401, "not_authenticated", "Sign in required")
    return admin


CurrentAdmin = Annotated[Admin, Depends(require_admin)]
