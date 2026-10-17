from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, Response

from app.core.db import DbSession
from app.core.errors import AppError, error_responses
from app.core.schemas import Page, Pagination, RowId
from app.features.auth import service
from app.features.auth.dependencies import (
    CurrentAdmin,
    clear_session_cookie,
    require_admin,
    set_session_cookie,
)
from app.features.auth.schemas import AdminCreate, AdminRead, AdminUpdate, LoginRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", responses=error_responses(401, 429))
async def login(body: LoginRequest, response: Response, db: DbSession) -> AdminRead:
    admin = await service.authenticate(db, email=body.email, password=body.password)
    if admin is None:
        raise AppError(401, "invalid_credentials", "Email or password is incorrect")
    set_session_cookie(response, await service.create_session(db, admin))
    return AdminRead.model_validate(admin)


@router.post("/logout", status_code=204, responses=error_responses())
async def logout(
    response: Response, db: DbSession, session: Annotated[str | None, Cookie()] = None
) -> None:
    if session:
        await service.delete_session(db, session)
    clear_session_cookie(response)


@router.get("/me", summary="Current admin", responses=error_responses(401))
async def get_me(admin: CurrentAdmin) -> AdminRead:
    return AdminRead.model_validate(admin)


admins_router = APIRouter(prefix="/admins", tags=["admins"], dependencies=[Depends(require_admin)])


@admins_router.get("", responses=error_responses(401))
async def list_admins(db: DbSession, page: Annotated[Pagination, Depends()]) -> Page[AdminRead]:
    admins, total = await service.list_admins(db, page)
    return Page(items=[AdminRead.model_validate(a) for a in admins], total=total)


@admins_router.post("", status_code=201, responses=error_responses(401, 409))
async def create_admin(body: AdminCreate, db: DbSession) -> AdminRead:
    admin = await service.create_admin(db, email=body.email, name=body.name, password=body.password)
    return AdminRead.model_validate(admin)


@admins_router.patch("/{admin_id}", responses=error_responses(401, 404, 409))
async def update_admin(
    admin_id: RowId, body: AdminUpdate, db: DbSession, actor: CurrentAdmin
) -> AdminRead:
    admin = await service.update_admin(db, admin_id=admin_id, actor=actor, changes=body)
    return AdminRead.model_validate(admin)
