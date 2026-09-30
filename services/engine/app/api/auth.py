from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session, select
from typing import Optional

from app.adapters.database import get_session
from app.domain.auth import verify_password
from app.domain.models import User, UserLoginRequest, UserLoginResponse, UserRead

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=UserLoginResponse)
def login(payload: UserLoginRequest, session: Session = Depends(get_session)):
    username = payload.username.strip().lower()
    user = session.exec(select(User).where(User.username == username)).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Nom d'utilisateur ou mot de passe incorrect")

    token = f"arcapply-token-{user.id}"
    return UserLoginResponse(
        token=token,
        user=UserRead(
            id=user.id,
            username=user.username,
            full_name=user.full_name,
            role=user.role,
        ),
    )


@router.get("/me", response_model=UserRead)
def get_current_user(
    authorization: Optional[str] = Header(None),
    session: Session = Depends(get_session),
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Session non authentifiée")

    token = authorization.replace("Bearer ", "").strip()
    if not token.startswith("arcapply-token-"):
        raise HTTPException(status_code=401, detail="Jeton de session invalide")

    user_id = token.replace("arcapply-token-", "")
    user = session.exec(select(User).where(User.id == user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    return UserRead(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
    )


@router.get("/available-users")
def get_available_users(session: Session = Depends(get_session)):
    """Retourne la liste des profils de démonstration disponibles."""
    users = session.exec(select(User)).all()
    return [
        {"username": u.username, "full_name": u.full_name, "role": u.role}
        for u in users
    ]


def get_current_username(
    authorization: Optional[str] = Header(None),
    x_username: Optional[str] = Header(None, alias="X-Username"),
    token: Optional[str] = None,
    username: Optional[str] = None,
    session: Session = Depends(get_session),
) -> str:
    """Détermine l'utilisateur actif (Louay ou Chaima).
    Prend en compte les en-têtes (X-Username, Authorization) et les paramètres d'URL (username, token)
    utiles notamment pour les iframes PDF / preview sans en-tête.
    Par défaut, retombe sur 'louay' pour préserver la rétrocompatibilité des tests existants.
    """
    if username and username.strip():
        return username.strip().lower()

    if x_username and x_username.strip():
        return x_username.strip().lower()

    active_token = None
    if authorization:
        active_token = authorization.replace("Bearer ", "").strip()
    elif token and token.strip():
        active_token = token.strip()

    if active_token and active_token.startswith("arcapply-token-"):
        user_id = active_token.replace("arcapply-token-", "")
        user = session.exec(select(User).where(User.id == user_id)).first()
        if user:
            return user.username.lower()

    return "louay"

