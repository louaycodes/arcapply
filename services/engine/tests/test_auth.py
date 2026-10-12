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


def test_auth_register_and_complete_onboarding():
    client = TestClient(app)
    import uuid
    random_email = f"onboard_{uuid.uuid4().hex[:8]}@example.com"
    res = client.post(
        "/api/auth/register",
        json={"email": random_email, "password": "password123", "full_name": "New Candidate"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["onboarding_completed"] is False

    token = data["token"]
    # Check /me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["onboarding_completed"] is False

    # Complete onboarding
    comp_res = client.post("/api/auth/complete-onboarding", headers={"Authorization": f"Bearer {token}"})
    assert comp_res.status_code == 200
    assert comp_res.json()["onboarding_completed"] is True

    # Verify /me reflects it
    me_after = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_after.json()["onboarding_completed"] is True


def test_jwt_token_claims_and_signature_verification():
    from app.domain.auth import decode_jwt_token
    client = TestClient(app)
    res = client.post("/api/auth/login", json={"username": "louay", "password": "louay"})
    assert res.status_code == 200
    token = res.json()["token"]
    assert token.count(".") == 2

    payload = decode_jwt_token(token)
    assert payload is not None
    assert payload["username"] == "louay"
    assert payload["role"] in ["user", "admin"]
    assert "exp" in payload
    assert "iat" in payload
    assert payload["exp"] > payload["iat"]


def test_jwt_tampered_token_rejected():
    client = TestClient(app)
    res = client.post("/api/auth/login", json={"username": "louay", "password": "louay"})
    valid_token = res.json()["token"]

    # Alter signature
    tampered_token = valid_token[:-4] + "fake"
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {tampered_token}"})
    assert me_res.status_code == 401


def test_jwt_expired_token_rejected():
    from app.domain.auth import create_jwt_token
    # Create token with -1 days expiry
    expired_token = create_jwt_token(user_id="1", username="louay", expires_in_days=-1)
    client = TestClient(app)
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert me_res.status_code == 401


def test_jwt_sse_subscriber_resolution():
    from app.api.events import _resolve_subscriber_user
    client = TestClient(app)
    res = client.post("/api/auth/login", json={"username": "chaima", "password": "chaima"})
    chaima_token = res.json()["token"]

    resolved = _resolve_subscriber_user(token=chaima_token)
    assert resolved == "chaima"


def test_forgot_password_anti_enumeration():
    client = TestClient(app)
    # Non existent email
    res1 = client.post("/api/auth/forgot-password", json={"email": "nonexistent@example.com"})
    assert res1.status_code == 200
    assert "lien de réinitialisation" in res1.json()["message"]

    # Existent email
    res2 = client.post("/api/auth/forgot-password", json={"email": "louay"})
    assert res2.status_code == 200
    assert "lien de réinitialisation" in res2.json()["message"]


def test_reset_password_full_lifecycle():
    import uuid
    import hashlib
    import time
    from sqlmodel import Session, select
    from app.adapters.database import get_engine, get_session
    from app.domain.models import PasswordResetToken

    client = TestClient(app)
    email = f"user_{uuid.uuid4().hex[:6]}@arcapply.tn"
    # Register user
    reg_res = client.post("/api/auth/register", json={"email": email, "password": "initialpassword"})
    assert reg_res.status_code == 200

    # Request forgot password
    forgot_res = client.post("/api/auth/forgot-password", json={"email": email})
    assert forgot_res.status_code == 200

    # Find token in DB
    raw_token = None
    with next(app.dependency_overrides[get_session]()) as session:
        tokens = session.exec(select(PasswordResetToken).where(PasswordResetToken.user_id == email)).all()
        assert len(tokens) >= 1
        active_t = tokens[-1]
        assert active_t.used is False

    # Calling with wrong token fails
    bad_res = client.post("/api/auth/reset-password", json={"token": "invalid_raw_token", "new_password": "newsecretpassword"})
    assert bad_res.status_code == 400

    # Simulate knowing token by hashing or generating a known raw token
    import secrets
    raw_token = secrets.token_hex(24)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    with next(app.dependency_overrides[get_session]()) as session:
        custom_t = PasswordResetToken(
            id=f"rst-test-{uuid.uuid4().hex[:6]}",
            user_id=email,
            token_hash=token_hash,
            expires_at=int(time.time()) + 900,
            used=False,
            created_at=int(time.time()),
        )
        session.add(custom_t)
        session.commit()

    # Reset with valid raw token
    reset_res = client.post("/api/auth/reset-password", json={"token": raw_token, "new_password": "newsecretpassword"})
    assert reset_res.status_code == 200
    assert "succès" in reset_res.json()["message"]

    # Re-using the same token fails
    reuse_res = client.post("/api/auth/reset-password", json={"token": raw_token, "new_password": "anotherpassword"})
    assert reuse_res.status_code == 400

    # Login with old password fails
    old_login = client.post("/api/auth/login", json={"username": email, "password": "initialpassword"})
    assert old_login.status_code == 401

    # Login with new password succeeds!
    new_login = client.post("/api/auth/login", json={"username": email, "password": "newsecretpassword"})
    assert new_login.status_code == 200
    assert "token" in new_login.json()



