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


def test_account_isolation_profile_and_jobs():
    client = TestClient(app)

    # 1. Login louay and chaima
    louay_token = client.post("/api/auth/login", json={"username": "louay", "password": "louay"}).json()["token"]
    chaima_token = client.post("/api/auth/login", json={"username": "chaima", "password": "chaima"}).json()["token"]

    # 2. Verify profiles are distinct
    louay_prof = client.get("/api/profile", headers={"Authorization": f"Bearer {louay_token}"}).json()
    chaima_prof = client.get("/api/profile", headers={"Authorization": f"Bearer {chaima_token}"}).json()
    assert chaima_prof["user_id"] == "chaima"
    assert louay_prof["user_id"] == "louay"

    # 3. Update Chaima's headline
    client.put(
        "/api/profile",
        headers={"Authorization": f"Bearer {chaima_token}"},
        json={"headline": "Ingénieure DevOps & Data", "full_name": "Chaima Z"},
    )
    chaima_updated = client.get("/api/profile", headers={"Authorization": f"Bearer {chaima_token}"}).json()
    assert chaima_updated["headline"] == "Ingénieure DevOps & Data"
    assert chaima_updated["full_name"] == "Chaima Z"

    # Verify Louay's profile did not change
    louay_check = client.get("/api/profile", headers={"Authorization": f"Bearer {louay_token}"}).json()
    assert louay_check["full_name"] != "Chaima Z"

    # 4. Verify job isolation
    louay_jobs = client.get("/api/jobs", headers={"Authorization": f"Bearer {louay_token}"}).json()
    chaima_jobs = client.get("/api/jobs", headers={"Authorization": f"Bearer {chaima_token}"}).json()
    assert isinstance(louay_jobs, list)
    assert isinstance(chaima_jobs, list)


def test_auth_register_new_user_success():
    client = TestClient(app)
    import uuid
    random_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    res = client.post(
        "/api/auth/register",
        json={"email": random_email, "password": "supersecretpassword", "full_name": "Test User"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "token" in data
    assert data["user"]["username"] == random_email
    assert data["user"]["full_name"] == "Test User"

    # Profile should exist and be isolated
    token = data["token"]
    prof_res = client.get("/api/profile", headers={"Authorization": f"Bearer {token}"})
    assert prof_res.status_code == 200
    assert prof_res.json()["user_id"] == random_email


def test_auth_register_validation_and_duplicate():
    client = TestClient(app)
    # Invalid email
    res1 = client.post("/api/auth/register", json={"email": "invalidemail", "password": "pass"})
    assert res1.status_code == 400

    # Short password
    res2 = client.post("/api/auth/register", json={"email": "valid@email.com", "password": "12"})
    assert res2.status_code == 400

    # Existing user
    res3 = client.post("/api/auth/register", json={"email": "louay", "password": "pass"})
    assert res3.status_code == 400

