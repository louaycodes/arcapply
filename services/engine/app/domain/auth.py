import base64
import hashlib
import hmac
import json
import secrets
import time
from typing import Any, Dict, Optional

from app.config import settings


def hash_password(password: str) -> str:
    """Hash password using salt + sha256."""
    salt = secrets.token_hex(8)
    digest = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    return f"{salt}${digest}"


def verify_password(plain_password: str, hashed: str) -> bool:
    """Verify password against salt$digest format."""
    if not hashed or "$" not in hashed:
        return False
    salt, expected_digest = hashed.split("$", 1)
    actual_digest = hashlib.sha256((salt + plain_password).encode("utf-8")).hexdigest()
    return secrets.compare_digest(actual_digest, expected_digest)


def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _base64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def create_jwt_token(
    user_id: str,
    username: str,
    role: str = "user",
    expires_in_days: Optional[int] = None,
    custom_claims: Optional[Dict[str, Any]] = None,
) -> str:
    """Génère un jeton JWT signé avec HS256."""
    exp_days = expires_in_days if expires_in_days is not None else settings.jwt_expiration_days
    now = int(time.time())
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": str(user_id),
        "username": username.strip().lower(),
        "role": role,
        "iat": now,
        "exp": now + (exp_days * 86400),
    }
    if custom_claims:
        payload.update(custom_claims)

    header_b64 = _base64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _base64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")

    signature = hmac.new(
        settings.jwt_secret.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()
    sig_b64 = _base64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{sig_b64}"


def decode_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """Décode et valide un jeton JWT HS256. Retourne le payload ou None si invalide/expiré."""
    if not token or not isinstance(token, str):
        return None
    token = token.strip()
    parts = token.split(".")
    if len(parts) != 3:
        return None

    header_b64, payload_b64, sig_b64 = parts
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")

    expected_sig = hmac.new(
        settings.jwt_secret.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()

    try:
        actual_sig = _base64url_decode(sig_b64)
        if not secrets.compare_digest(expected_sig, actual_sig):
            return None

        payload_bytes = _base64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))

        # Vérification expiration
        if "exp" in payload and payload["exp"] < int(time.time()):
            return None

        return payload
    except Exception:
        return None

