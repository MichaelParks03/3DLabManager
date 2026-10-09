import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from pwdlib import PasswordHash
from sqlalchemy import delete, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from app.core.config import get_settings
from app.core.db import paginate
from app.core.errors import AppError
from app.core.schemas import Pagination
from app.features.auth.models import Admin, AdminSession
from app.features.auth.schemas import AdminUpdate

password_hasher = PasswordHash.recommended()
# verified against when the email is unknown so response time does not reveal it
DUMMY_HASH = password_hasher.hash("dummy password")


def normalize_email(email: str) -> str:
    return email.strip().lower()


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _session_expiry() -> datetime:
    return datetime.now(UTC) + timedelta(days=get_settings().session_ttl_days)


async def create_admin(db: AsyncSession, *, email: str, name: str, password: str) -> Admin:
    admin = Admin(
        email=normalize_email(email),
        name=name,
        password_hash=await run_in_threadpool(password_hasher.hash, password),
    )
    db.add(admin)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise AppError(409, "email_taken", "An admin with this email already exists") from exc
    return admin


async def list_admins(db: AsyncSession, pagination: Pagination) -> tuple[list[Admin], int]:
    return await paginate(db, select(Admin).order_by(Admin.id), pagination)


async def update_admin(
    db: AsyncSession, *, admin_id: int, actor: Admin, changes: AdminUpdate
) -> Admin:
    admin = await db.get(Admin, admin_id)
    if admin is None:
        raise AppError(404, "admin_not_found", "Admin not found")
    values = changes.changes()
    deactivating = values.get("is_active") is False
    if deactivating and admin.id == actor.id:
        raise AppError(409, "cannot_deactivate_self", "You cannot deactivate your own account")
    for field, value in values.items():
        setattr(admin, field, value)
    if deactivating:
        await db.execute(delete(AdminSession).where(AdminSession.admin_id == admin.id))
    await db.commit()
    return admin


async def authenticate(db: AsyncSession, *, email: str, password: str) -> Admin | None:
    admin = await db.scalar(select(Admin).where(Admin.email == normalize_email(email)))
    stored_hash = admin.password_hash if admin else DUMMY_HASH
    password_ok = await run_in_threadpool(password_hasher.verify, password, stored_hash)
    return admin if admin and admin.is_active and password_ok else None


async def create_session(db: AsyncSession, admin: Admin) -> str:
    token = secrets.token_urlsafe(32)
    await db.execute(
        delete(AdminSession).where(
            AdminSession.admin_id == admin.id, AdminSession.expires_at <= datetime.now(UTC)
        )
    )
    db.add(
        AdminSession(token_hash=hash_token(token), admin_id=admin.id, expires_at=_session_expiry())
    )
    await db.commit()
    return token


async def resolve_session(db: AsyncSession, token: str) -> Admin | None:
    row = (
        await db.execute(
            select(AdminSession, Admin)
            .join(Admin, Admin.id == AdminSession.admin_id)
            .where(AdminSession.token_hash == hash_token(token))
        )
    ).one_or_none()
    if row is None:
        return None
    session, admin = row
    now = datetime.now(UTC)
    if session.expires_at <= now:
        await db.execute(delete(AdminSession).where(AdminSession.id == session.id))
        await db.commit()
        return None
    if not admin.is_active:
        return None
    # a concurrent logout or deactivation may have deleted the row since the lookup
    renewed = await db.scalar(
        update(AdminSession)
        .where(AdminSession.id == session.id)
        .values(last_used_at=now, expires_at=_session_expiry())
        .returning(AdminSession.id)
    )
    await db.commit()
    return admin if renewed is not None else None


async def delete_session(db: AsyncSession, token: str) -> None:
    await db.execute(delete(AdminSession).where(AdminSession.token_hash == hash_token(token)))
    await db.commit()
