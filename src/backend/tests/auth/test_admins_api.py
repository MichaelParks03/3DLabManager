import pytest

from tests.conftest import PASSWORD


@pytest.mark.parametrize(
    ("method", "path"),
    [("GET", "/api/admins"), ("POST", "/api/admins"), ("PATCH", "/api/admins/1")],
)
async def test_admin_routes_require_session(client, method, path):
    r = await client.request(method, path, json={})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "not_authenticated"


async def test_list_admins(admin_client):
    r = await admin_client.get("/api/admins")
    assert r.status_code == 200
    assert r.json()["total"] == 1
    assert r.json()["items"][0]["email"] == "admin@uta.edu"


async def test_list_admins_paginates(admin_client, make_admin):
    await make_admin(email="ta@uta.edu")
    r = await admin_client.get("/api/admins?limit=1&offset=1")
    assert r.json()["total"] == 2
    assert [a["email"] for a in r.json()["items"]] == ["ta@uta.edu"]


async def test_list_admins_rejects_bad_pagination(admin_client):
    assert (await admin_client.get("/api/admins?limit=0")).status_code == 422
    assert (await admin_client.get("/api/admins?limit=101")).status_code == 422


async def test_create_admin_then_login(admin_client, client):
    body = {"email": "ta@uta.edu", "name": "TA", "password": PASSWORD}
    assert (await admin_client.post("/api/admins", json=body)).status_code == 201
    r = await client.post("/api/auth/login", json={"email": "ta@uta.edu", "password": PASSWORD})
    assert r.status_code == 200


async def test_create_admin_duplicate_email(admin_client):
    body = {"email": "ADMIN@uta.edu", "name": "Dup", "password": PASSWORD}
    r = await admin_client.post("/api/admins", json=body)
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "email_taken"


async def test_create_admin_short_password(admin_client):
    body = {"email": "ta@uta.edu", "name": "TA", "password": "x" * 11}
    assert (await admin_client.post("/api/admins", json=body)).status_code == 422


async def test_deactivation_revokes_existing_session(admin_client, make_admin, login):
    other = await make_admin(email="ta@uta.edu")
    ta_client = await login("ta@uta.edu", PASSWORD)
    r = await admin_client.patch(f"/api/admins/{other.id}", json={"isActive": False})
    assert r.status_code == 200
    assert r.json()["isActive"] is False
    assert (await ta_client.get("/api/auth/me")).status_code == 401


async def test_partial_update_keeps_other_fields(admin_client, make_admin):
    other = await make_admin(email="ta@uta.edu")
    r = await admin_client.patch(f"/api/admins/{other.id}", json={"name": "Renamed"})
    assert r.json()["name"] == "Renamed"
    assert r.json()["isActive"] is True


async def test_cannot_deactivate_self(admin_client):
    me = (await admin_client.get("/api/auth/me")).json()
    r = await admin_client.patch(f"/api/admins/{me['id']}", json={"isActive": False})
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "cannot_deactivate_self"


async def test_update_unknown_admin(admin_client):
    r = await admin_client.patch("/api/admins/999999", json={"name": "Ghost"})
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "admin_not_found"


@pytest.mark.parametrize("field", ["name", "isActive"])
async def test_update_rejects_explicit_null(admin_client, make_admin, field):
    other = await make_admin(email="ta@uta.edu")
    r = await admin_client.patch(f"/api/admins/{other.id}", json={field: None})
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "validation_error"
