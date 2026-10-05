from tests.conftest import PASSWORD

INVALID = {
    "error": {
        "code": "invalid_credentials",
        "message": "Email or password is incorrect",
        "details": None,
    }
}


async def test_login_sets_session_cookie(client, make_admin):
    await make_admin()
    r = await client.post("/api/auth/login", json={"email": "admin@uta.edu", "password": PASSWORD})
    assert r.status_code == 200
    assert r.json()["email"] == "admin@uta.edu"
    assert r.json()["isActive"] is True
    cookie = r.headers["set-cookie"].lower()
    assert "session=" in cookie
    assert "httponly" in cookie
    assert "samesite=lax" in cookie
    assert "path=/api" in cookie


async def test_login_normalizes_email(client, make_admin):
    await make_admin(email="steven@uta.edu")
    r = await client.post(
        "/api/auth/login", json={"email": "  Steven@UTA.edu ", "password": PASSWORD}
    )
    assert r.status_code == 200


async def test_login_failures_are_indistinguishable(client, db_session, make_admin):
    await make_admin()
    inactive = await make_admin(email="gone@uta.edu")
    inactive.is_active = False
    await db_session.commit()
    attempts = [
        {"email": "admin@uta.edu", "password": "wrong password!"},
        {"email": "ghost@uta.edu", "password": PASSWORD},
        {"email": "gone@uta.edu", "password": PASSWORD},
    ]
    for body in attempts:
        r = await client.post("/api/auth/login", json=body)
        assert r.status_code == 401
        assert r.json() == INVALID


async def test_me_requires_session(client):
    r = await client.get("/api/auth/me")
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "not_authenticated"


async def test_me_rejects_garbage_cookie(client):
    r = await client.get("/api/auth/me", headers={"Cookie": "session=garbage"})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "not_authenticated"


async def test_me_returns_current_admin(admin_client):
    r = await admin_client.get("/api/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == "admin@uta.edu"


async def test_logout_ends_session(admin_client):
    assert (await admin_client.post("/api/auth/logout")).status_code == 204
    assert (await admin_client.get("/api/auth/me")).status_code == 401


async def test_logout_without_session_succeeds(client):
    assert (await client.post("/api/auth/logout")).status_code == 204


async def test_logout_with_unknown_session_succeeds(client):
    r = await client.post("/api/auth/logout", headers={"Cookie": "session=garbage"})
    assert r.status_code == 204
