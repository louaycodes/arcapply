from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session, select
from typing import Optional

from app.adapters.database import get_session
from app.domain.auth import hash_password, verify_password
from app.domain.models import (
    MasterProfile,
    User,
    UserLoginRequest,
    UserLoginResponse,
    UserRead,
    UserRegisterRequest,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserLoginResponse)
def register(payload: UserRegisterRequest, session: Session = Depends(get_session)):
    email = payload.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Adresse email invalide")
    if not payload.password or len(payload.password) < 4:
        raise HTTPException(status_code=400, detail="Le mot de passe doit comporter au moins 4 caractères")

    existing_user = session.exec(select(User).where(User.username == email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Un compte existe déjà avec cette adresse email")

    full_name = payload.full_name.strip() if payload.full_name else email.split("@")[0].capitalize()
    new_user = User(
        username=email,
        full_name=full_name,
        role="user",
        password_hash=hash_password(payload.password),
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    # Initialize isolated MasterProfile for new user
    profile = session.exec(select(MasterProfile).where(MasterProfile.user_id == email)).first()
    if not profile:
        profile = MasterProfile(
            id=f"profile-{new_user.id}",
            user_id=email,
            full_name=full_name,
            email=email,
            headline="",
            bio="",
            search_mode="PFE",
            is_complete=False,
        )
        session.add(profile)
        session.commit()

    token = f"arcapply-token-{new_user.id}"
    return UserLoginResponse(
        token=token,
        user=UserRead(
            id=new_user.id,
            username=new_user.username,
            full_name=new_user.full_name,
            role=new_user.role,
            onboarding_completed=new_user.onboarding_completed,
        ),
    )


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
            onboarding_completed=user.onboarding_completed,
        ),
    )


@router.get("/me", response_model=UserRead)
def get_current_user(
    authorization: Optional[str] = Header(None),
    x_username: Optional[str] = Header(None, alias="X-Username"),
    session: Session = Depends(get_session),
):
    user = None
    if authorization:
        token = authorization.replace("Bearer ", "").strip()
        if token.startswith("arcapply-token-"):
            user_id = token.replace("arcapply-token-", "")
            user = session.exec(select(User).where(User.id == user_id)).first()

    if not user and x_username:
        user = session.exec(select(User).where(User.username == x_username.strip().lower())).first()

    if not user:
        raise HTTPException(status_code=401, detail="Session non authentifiée")

    return UserRead(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        onboarding_completed=user.onboarding_completed,
    )


@router.post("/complete-onboarding", response_model=UserRead)
def complete_onboarding(
    authorization: Optional[str] = Header(None),
    x_username: Optional[str] = Header(None, alias="X-Username"),
    session: Session = Depends(get_session),
):
    """Marque le walkthrough d'onboarding comme complété pour l'utilisateur."""
    user = None
    if authorization:
        token = authorization.replace("Bearer ", "").strip()
        if token.startswith("arcapply-token-"):
            user_id = token.replace("arcapply-token-", "")
            user = session.exec(select(User).where(User.id == user_id)).first()

    if not user and x_username:
        user = session.exec(select(User).where(User.username == x_username.strip().lower())).first()

    if not user:
        user = session.exec(select(User).where(User.username == "louay")).first()

    if user:
        user.onboarding_completed = True
        session.add(user)
        profile = session.exec(select(MasterProfile).where(MasterProfile.user_id == user.username)).first()
        if profile:
            profile.onboarding_completed = True
            session.add(profile)
        session.commit()
        session.refresh(user)
        return UserRead(
            id=user.id,
            username=user.username,
            full_name=user.full_name,
            role=user.role,
            onboarding_completed=True,
        )

    raise HTTPException(status_code=401, detail="Utilisateur non identifié")


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

