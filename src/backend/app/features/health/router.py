from typing import Literal

from fastapi import APIRouter
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.db import DbSession
from app.core.errors import AppError, error_responses
from app.core.schemas import ApiSchema

router = APIRouter(prefix="/health", tags=["health"])


class HealthRead(ApiSchema):
    status: Literal["ok"]


@router.get("", responses=error_responses(503))
async def get_health(db: DbSession) -> HealthRead:
    try:
        await db.execute(text("SELECT 1"))
    except (OSError, SQLAlchemyError) as exc:
        raise AppError(503, "database_unavailable", "Database is unavailable") from exc
    return HealthRead(status="ok")
