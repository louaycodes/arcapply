import hashlib
import secrets


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
