from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import delete, event, select, update
from sqlalchemy.orm import ORMExecuteState

from app.core.errors import AppError
from app.features.auth import service
from app.features.auth.models import AdminSession
from tests.conftest import PASSWORD


async def test_create_admin_normalizes_email_and_hashes_password(db_session):
    admin = await service.create_admin(
        db_session, email="  Steven@UTA.edu ", name="Steven", password=PASSWORD
    )
    assert admin.email == "steven@uta.edu"
    assert admin.password_hash.startswith("$argon2")


async def test_create_admin_rejects_duplicate_email_in_any_case(db_session):
    await service.create_admin(db_session, email="a@uta.edu", name="A", password=PASSWORD)
    with pytest.raises(AppError) as exc:
        await service.create_admin(db_session, email="A@UTA.EDU", name="B", password=PASSWORD)
    assert (exc.value.status_code, exc.value.code) == (409, "email_taken")


async def test_authenticate(db_session):
    admin = await service.create_admin(db_session, email="a@uta.edu", name="A", password=PASSWORD)
    assert await service.authenticate(db_session, email=" A@uta.edu", password=PASSWORD) == admin
    assert (
        await service.authenticate(db_session, email="a@uta.edu", password="wrong password!")
        is None
    )
    assert await service.authenticate(db_session, email="nobody@uta.edu", password=PASSWORD) is None
    admin.is_active = False
    await db_session.commit()
    assert await service.authenticate(db_session, email="a@uta.edu", password=PASSWORD) is None


async def test_session_token_is_stored_hashed_and_resolves(db_session):
    admin = await service.create_admin(db_session, email="a@uta.edu", name="A", password=PASSWORD)
    token = await service.create_session(db_session, admin)
    row = await db_session.scalar(select(AdminSession))
    assert row.token_hash == service.hash_token(token) != token
    before = row.expires_at
    assert await service.resolve_session(db_session, token) == admin
    await db_session.refresh(row)
    assert row.expires_at > before


async def test_expired_session_is_rejected_and_deleted(db_session):
    admin = await service.create_admin(db_session, email="a@uta.edu", name="A", password=PASSWORD)
    token = await service.create_session(db_session, admin)
    await db_session.execute(
        update(AdminSession).values(expires_at=datetime.now(UTC) - timedelta(seconds=1))
    )
    assert await service.resolve_session(db_session, token) is None
    assert await db_session.scalar(select(AdminSession)) is None


async def test_unknown_token_resolves_to_none(db_session):
    assert await service.resolve_session(db_session, "not-a-token") is None


async def test_orm_update_refreshes_updated_at(db_session):
    admin = await service.create_admin(db_session, email="a@uta.edu", name="A", password=PASSWORD)
    admin.name = "Renamed"
    await db_session.commit()
    assert admin.updated_at >= admin.created_at


async def test_session_deleted_after_lookup_resolves_to_none(db_session, make_admin):
    token = await service.create_session(db_session, await make_admin())
    deleted = False

    # simulates a logout in another tab landing between the lookup and the renewal
    def delete_after_lookup(state: ORMExecuteState):
        nonlocal deleted
        if deleted or not state.is_select:
            return None
        deleted = True
        loaded = state.invoke_statement().freeze()
        # unsynchronized like a delete from another transaction
        state.session.execute(delete(AdminSession).execution_options(synchronize_session=False))
        return loaded()

    event.listen(db_session.sync_session, "do_orm_execute", delete_after_lookup)
    assert await service.resolve_session(db_session, token) is None
