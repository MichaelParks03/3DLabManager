from fastapi import APIRouter
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.db import DbSession
from app.core.errors import AppError, error_responses
from app.features.health.schemas import HealthRead

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", responses=error_responses(503))
async def get_health(db: DbSession) -> HealthRead:
    try:
        await db.execute(text("SELECT 1"))
    except (OSError, SQLAlchemyError) as exc:
        raise AppError(503, "database_unavailable", "Database is unavailable") from exc
    return HealthRead(status="ok")
