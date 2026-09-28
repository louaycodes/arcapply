import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.adapters.database import init_db


@pytest.fixture(autouse=True)
def ensure_db():
    init_db()


def test_auth_login_louay_success():
    client = TestClient(app)
    response = client.post(
        "/api/auth/login",
        json={"username": "louay", "password": "louay"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["user"]["username"] == "louay"
    assert data["user"]["full_name"] == "Louay"


def test_auth_login_chaima_success():
    client = TestClient(app)
    response = client.post(
        "/api/auth/login",
        json={"username": "chaima", "password": "chaima"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["user"]["username"] == "chaima"
    assert data["user"]["full_name"] == "Chaima"


def test_auth_login_invalid_password():
    client = TestClient(app)
    response = client.post(
        "/api/auth/login",
        json={"username": "louay", "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_auth_me_endpoint():
    client = TestClient(app)
    # Login first
    login_res = client.post(
        "/api/auth/login",
        json={"username": "louay", "password": "louay"},
    )
    token = login_res.json()["token"]

    # Call me with token
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["username"] == "louay"


def test_auth_available_users():
    client = TestClient(app)
    res = client.get("/api/auth/available-users")
    assert res.status_code == 200
    usernames = [u["username"] for u in res.json()]
    assert "louay" in usernames
    assert "chaima" in usernames
