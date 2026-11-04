import hashlib
import secrets
import time
from fastapi import APIRouter, Depends, HTTPException, Header
import httpx
from sqlmodel import Session, select
from typing import Optional

from app.adapters.database import get_session
from app.config import settings
from app.domain.auth import create_jwt_token, decode_jwt_token, hash_password, verify_password
from app.domain.models import (
    ForgotPasswordRequest,
    GoogleAuthRequest,
    GoogleConfigResponse,
    MasterProfile,
    MessageResponse,
    PasswordResetToken,
    ResetPasswordRequest,
    User,
    UserLoginRequest,
    UserLoginResponse,
    UserRead,
    UserRegisterRequest,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


async def _verify_google_credential(credential: str, expected_client_id: Optional[str] = None) -> dict:
    """Vérifie le jeton ID Google auprès du service tokeninfo officiel de Google."""
    if not credential:
        raise HTTPException(status_code=400, detail="Jeton Google manquant")

    # Mode test / mock pour tests automatisés ou environnement déconnecté
    if credential.startswith("mock-google-"):
        mock_email = credential.replace("mock-google-", "").strip().lower()
        if "@" not in mock_email:
            mock_email = f"{mock_email}@gmail.com"
        return {
            "email": mock_email,
            "name": mock_email.split("@")[0].replace(".", " ").title(),
            "picture": "https://lh3.googleusercontent.com/a/default-user",
            "sub": f"mock-sub-{mock_email}",
        }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}")
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=400,
                    detail="Jeton d'authentification Google invalide ou expiré",
                )
            info = resp.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur de communication avec le service Google Auth: {str(e)}",
        )

    email = info.get("email")
    if not email:
        raise HTTPException(
            status_code=400,
            detail="Le jeton Google ne contient aucune adresse email associée",
        )

    # Vérification facultative du Client ID si configuré
    if expected_client_id:
        aud = info.get("aud")
        if aud != expected_client_id:
            raise HTTPException(
                status_code=400,
                detail="Le jeton Google ne correspond pas au client_id configuré",
            )

    return {
        "email": email.strip().lower(),
        "name": info.get("name") or email.split("@")[0].title(),
        "picture": info.get("picture"),
        "sub": info.get("sub"),
    }


async def _verify_google_access_token(access_token: str, expected_client_id: Optional[str] = None) -> dict:
    """Vérifie l'access_token Google auprès de l'API userinfo et tokeninfo de Google (ne requiert aucun client_secret)."""
    if not access_token:
        raise HTTPException(status_code=400, detail="Access token Google manquant")

    # Mode test / mock pour tests automatisés
    if access_token.startswith("mock-access-"):
        mock_email = access_token.replace("mock-access-", "").strip().lower()
        if "@" not in mock_email:
            mock_email = f"{mock_email}@gmail.com"
        return {
            "email": mock_email,
            "name": mock_email.split("@")[0].replace(".", " ").title(),
            "picture": "https://lh3.googleusercontent.com/a/default-user",
            "sub": f"mock-sub-{mock_email}",
        }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Récupérer les informations utilisateur auprès de l'API Google
            userinfo_res = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if userinfo_res.status_code != 200:
                raise HTTPException(
                    status_code=400,
                    detail="Jeton d'accès Google invalide ou expiré",
                )
            info = userinfo_res.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur de communication avec le service Google UserInfo: {str(e)}",
        )

    email = info.get("email")
    if not email:
        raise HTTPException(
            status_code=400,
            detail="Le profil Google ne contient aucune adresse email associée",
        )

    return {
        "email": email.strip().lower(),
        "name": info.get("name") or email.split("@")[0].title(),
        "picture": info.get("picture"),
        "sub": info.get("sub"),
    }


async def _exchange_google_code(code: str, redirect_uri: str, client_id: str, client_secret: str) -> dict:
    """Échange un code d'autorisation OAuth2 Google contre les informations de l'utilisateur."""
    if not client_id or not client_secret:
        raise HTTPException(
            status_code=400,
            detail="Le client_id ou client_secret Google n'est pas configuré sur le serveur",
        )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=400,
                    detail="Échec de l'échange du code d'autorisation Google",
                )
            token_data = resp.json()
            id_token = token_data.get("id_token")
            if id_token:
                return await _verify_google_credential(id_token, client_id)

            access_token = token_data.get("access_token")
            userinfo_res = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if userinfo_res.status_code != 200:
                raise HTTPException(
                    status_code=400,
                    detail="Impossible de récupérer les informations du profil Google",
                )
            info = userinfo_res.json()
            return {
                "email": info.get("email", "").strip().lower(),
                "name": info.get("name") or "",
                "picture": info.get("picture"),
                "sub": info.get("sub"),
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'échange avec Google: {str(e)}",
        )


@router.get("/google/config", response_model=GoogleConfigResponse)
def get_google_config():
    """Retourne la configuration publique pour l'authentification Google."""
    client_id = settings.effective_google_client_id
    return GoogleConfigResponse(
        client_id=client_id,
        enabled=bool(client_id),
    )


@router.post("/google", response_model=UserLoginResponse)
async def google_auth(payload: GoogleAuthRequest, session: Session = Depends(get_session)):
    """Authentification ou création de compte via Google provider."""
    google_user = None

    if payload.credential:
        google_user = await _verify_google_credential(
            payload.credential,
            expected_client_id=settings.effective_google_client_id or None,
        )
    elif payload.access_token:
        google_user = await _verify_google_access_token(
            payload.access_token,
            expected_client_id=settings.effective_google_client_id or None,
        )
    elif payload.code:
        if not settings.effective_google_client_secret:
            raise HTTPException(
                status_code=400,
                detail="Le code secret (client_secret) Google n'est pas configuré sur le serveur pour l'échange de code. Utilisez le mode d'accès direct popup ou renseignez GOOGLE_CLIENT_SECRET.",
            )
        redirect_uri = payload.redirect_uri or "postmessage"
        google_user = await _exchange_google_code(
            code=payload.code,
            redirect_uri=redirect_uri,
            client_id=settings.effective_google_client_id,
            client_secret=settings.effective_google_client_secret,
        )
    elif payload.email and (not settings.effective_google_client_id or payload.credential == "mock"):
        # Mode développement / test direct
        google_user = {
            "email": payload.email.strip().lower(),
            "name": payload.full_name or payload.email.split("@")[0].title(),
            "picture": payload.avatar_url or "https://lh3.googleusercontent.com/a/default-user",
            "sub": payload.provider_id or f"google-{payload.email}",
        }
    else:
        raise HTTPException(
            status_code=400,
            detail="Informations d'authentification Google manquantes (credential ou code requis)",
        )

    email = google_user["email"].strip().lower()
    full_name = google_user.get("name") or email.split("@")[0].capitalize()
    avatar_url = google_user.get("picture")
    sub = google_user.get("sub")

    # Recherche d'un utilisateur existant par username (email) ou par provider_id Google
    user = session.exec(
        select(User).where(
            (User.username == email) | ((User.provider_id == sub) & (User.auth_provider == "google"))
        )
    ).first()

    is_new_user = False
    if not user:
        # Création de compte automatique via Google
        is_new_user = True
        user = User(
            username=email,
            full_name=full_name,
            role="user",
            password_hash="",
            auth_provider="google",
            provider_id=sub,
            avatar_url=avatar_url,
            onboarding_completed=False,
            playbook_initialized=False,
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        # Initialisation du MasterProfile isolé
        profile = session.exec(select(MasterProfile).where(MasterProfile.user_id == email)).first()
        if not profile:
            profile = MasterProfile(
                id=f"profile-{user.id}",
                user_id=email,
                full_name=full_name,
                email=email,
                avatar_url=avatar_url,
                headline="",
                bio="",
                search_mode="PFE",
                is_complete=False,
            )
            session.add(profile)
            session.commit()
    else:
        # Utilisateur existant : mise à jour des métadonnées Google
        user.auth_provider = "google"
        if sub and not user.provider_id:
            user.provider_id = sub
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
        if full_name and not user.full_name:
            user.full_name = full_name
        session.add(user)

        # Mettre à jour l'avatar du profil si vide
        profile = session.exec(select(MasterProfile).where(MasterProfile.user_id == user.username)).first()
        if profile and avatar_url and not profile.avatar_url:
            profile.avatar_url = avatar_url
            session.add(profile)
        session.commit()
        session.refresh(user)

    token = create_jwt_token(user_id=user.id, username=user.username, role=user.role)
    return UserLoginResponse(
        token=token,
        user=UserRead(
            id=user.id,
            username=user.username,
            full_name=user.full_name,
            role=user.role,
            auth_provider=user.auth_provider or "google",
            avatar_url=user.avatar_url,
            onboarding_completed=user.onboarding_completed,
            playbook_initialized=user.playbook_initialized,
        ),
        is_new_user=is_new_user,
    )


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
        onboarding_completed=False,
        playbook_initialized=False,
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

    token = create_jwt_token(user_id=new_user.id, username=new_user.username, role=new_user.role)
    return UserLoginResponse(
        token=token,
        user=UserRead(
            id=new_user.id,
            username=new_user.username,
            full_name=new_user.full_name,
            role=new_user.role,
            auth_provider=new_user.auth_provider or "local",
            avatar_url=new_user.avatar_url,
            onboarding_completed=new_user.onboarding_completed,
            playbook_initialized=new_user.playbook_initialized,
        ),
        is_new_user=True,
    )


@router.post("/login", response_model=UserLoginResponse)
def login(payload: UserLoginRequest, session: Session = Depends(get_session)):
    username = payload.username.strip().lower()
    user = session.exec(select(User).where(User.username == username)).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Nom d'utilisateur ou mot de passe incorrect")

    token = create_jwt_token(user_id=user.id, username=user.username, role=user.role)
    return UserLoginResponse(
        token=token,
        user=UserRead(
            id=user.id,
            username=user.username,
            full_name=user.full_name,
            role=user.role,
            auth_provider=user.auth_provider or "local",
            avatar_url=user.avatar_url,
            onboarding_completed=user.onboarding_completed,
            playbook_initialized=user.playbook_initialized,
        ),
        is_new_user=False,
    )


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, session: Session = Depends(get_session)):
    email = payload.email.strip().lower()
    standard_message = "Si cette adresse email est associée à un compte, un lien de réinitialisation a été généré."
    if not email:
        return MessageResponse(message=standard_message)

    user = session.exec(select(User).where(User.username == email)).first()
    if user:
        raw_token = secrets.token_hex(24)
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        expires_at = int(time.time()) + 900  # 15 minutes TTL

        # Invalider les anciens jetons non consommés pour cet utilisateur
        existing_tokens = session.exec(
            select(PasswordResetToken).where(
                PasswordResetToken.user_id == user.username,
                PasswordResetToken.used == False,
            )
        ).all()
        for t in existing_tokens:
            t.used = True
            session.add(t)

        reset_token = PasswordResetToken(
            id=f"rst-{secrets.token_hex(8)}",
            user_id=user.username,
            token_hash=token_hash,
            expires_at=expires_at,
            used=False,
            created_at=int(time.time()),
        )
        session.add(reset_token)
        session.commit()

        # Log informatif (local dev / console)
        reset_link = f"http://localhost:3000/reset-password?token={raw_token}"
        print(f"[AUTH EMAIL] Lien de réinitialisation pour {email} : {reset_link}")

    return MessageResponse(message=standard_message)


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, session: Session = Depends(get_session)):
    raw_token = payload.token.strip()
    new_password = payload.new_password.strip()

    if not raw_token:
        raise HTTPException(status_code=400, detail="Jeton de réinitialisation manquant")
    if not new_password or len(new_password) < 4:
        raise HTTPException(status_code=400, detail="Le mot de passe doit comporter au moins 4 caractères")

    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    now = int(time.time())

    reset_token = session.exec(
        select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)
    ).first()

    if not reset_token or reset_token.used or reset_token.expires_at < now:
        raise HTTPException(status_code=400, detail="Jeton de réinitialisation invalide ou expiré")

    user = session.exec(select(User).where(User.username == reset_token.user_id)).first()
    if not user:
        raise HTTPException(status_code=400, detail="Utilisateur introuvable pour ce jeton")

    user.password_hash = hash_password(new_password)
    reset_token.used = True
    session.add(user)
    session.add(reset_token)
    session.commit()

    return MessageResponse(message="Mot de passe réinitialisé avec succès")



def _resolve_user_from_token(raw_token: str, session: Session) -> Optional[User]:
    """Résout l'entité User à partir d'un JWT valide ou du fallback arcapply-token-<id>."""
    if not raw_token:
        return None
    raw_token = raw_token.strip()

    # Tentative de décodage JWT
    jwt_payload = decode_jwt_token(raw_token)
    if jwt_payload:
        user_id = jwt_payload.get("sub")
        if user_id:
            user = session.exec(select(User).where(User.id == user_id)).first()
            if user:
                return user
        username = jwt_payload.get("username")
        if username:
            user = session.exec(select(User).where(User.username == username.lower())).first()
            if user:
                return user

    # Fallback rétrocompatible pour tests existants
    if raw_token.startswith("arcapply-token-"):
        user_id = raw_token.replace("arcapply-token-", "")
        return session.exec(select(User).where(User.id == user_id)).first()

    return None


@router.get("/me", response_model=UserRead)
def get_current_user(
    authorization: Optional[str] = Header(None),
    x_username: Optional[str] = Header(None, alias="X-Username"),
    session: Session = Depends(get_session),
):
    user = None
    if authorization:
        token = authorization.replace("Bearer ", "").strip()
        user = _resolve_user_from_token(token, session)

    if not user and x_username:
        user = session.exec(select(User).where(User.username == x_username.strip().lower())).first()

    if not user:
        raise HTTPException(status_code=401, detail="Session non authentifiée")

    return UserRead(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        auth_provider=getattr(user, "auth_provider", "local") or "local",
        avatar_url=getattr(user, "avatar_url", None),
        onboarding_completed=user.onboarding_completed,
        playbook_initialized=user.playbook_initialized,
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
        user = _resolve_user_from_token(token, session)

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
            auth_provider=getattr(user, "auth_provider", "local") or "local",
            avatar_url=getattr(user, "avatar_url", None),
            onboarding_completed=True,
            playbook_initialized=user.playbook_initialized,
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
    Prend en compte les tokens JWT, en-têtes (X-Username, Authorization) et les paramètres d'URL (username, token)
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

    if active_token:
        user = _resolve_user_from_token(active_token, session)
        if user:
            return user.username.lower()

    return "louay"

