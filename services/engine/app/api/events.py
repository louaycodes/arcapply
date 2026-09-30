import asyncio
import json
from collections import defaultdict
from datetime import datetime, timezone
from typing import AsyncGenerator, Optional
from fastapi import APIRouter, Header, Query, Request
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select

from app.adapters.database import get_engine
from app.domain.models import User

router = APIRouter(prefix="/api/events", tags=["Server-Sent Events"])

# Registre associant chaque nom d'utilisateur à ses queues d'abonnés actives
_user_subscribers: dict[str, set[asyncio.Queue]] = defaultdict(set)


def utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _resolve_subscriber_user(
    token: Optional[str] = None,
    username: Optional[str] = None,
    auth_header: Optional[str] = None,
    x_username: Optional[str] = None,
) -> str:
    """Résout le tenant connecté pour le flux SSE (via query param ou headers HTTP)."""
    if username and username.strip():
        return username.strip().lower()
    if x_username and x_username.strip():
        return x_username.strip().lower()

    raw_token = token or ""
    if not raw_token and auth_header:
        raw_token = auth_header.replace("Bearer ", "").strip()

    if raw_token.startswith("arcapply-token-"):
        user_id = raw_token.replace("arcapply-token-", "").strip()
        try:
            with Session(get_engine()) as session:
                user = session.exec(select(User).where(User.id == user_id)).first()
                if user:
                    return user.username.lower()
        except Exception:
            pass

    return "louay"


async def broadcast_event(
    event_type: str,
    payload: dict,
    target_user: Optional[str] = None,
) -> None:
    """
    Diffuse un événement typé conforme à l'invariant AD-3.
    Si target_user est spécifié, l'événement est envoyé EXCLUSIVEMENT aux abonnés de cet utilisateur.
    Si target_user est None, l'événement est diffusé à l'ensemble des utilisateurs connectés.
    """
    message = {
        "event": event_type,
        "timestamp": utc_iso(),
        "payload": payload,
    }
    data_str = json.dumps(message, ensure_ascii=False)
    formatted = f"event: {event_type}\ndata: {data_str}\n\n"

    target_queues: list[asyncio.Queue] = []
    if target_user:
        target = target_user.strip().lower()
        target_queues = list(_user_subscribers.get(target, set()))
    else:
        for user_queues in list(_user_subscribers.values()):
            target_queues.extend(list(user_queues))

    for queue in target_queues:
        try:
            queue.put_nowait(formatted)
        except asyncio.QueueFull:
            pass


async def event_generator(request: Request, user_id: str) -> AsyncGenerator[str, None]:
    queue: asyncio.Queue = asyncio.Queue(maxsize=100)
    _user_subscribers[user_id].add(queue)

    try:
        # Événement de bienvenue / synchronisation initiale
        welcome = {
            "event": "CONNECTED",
            "timestamp": utc_iso(),
            "payload": {
                "status": "ok",
                "message": f"Connecté au flux télémétrique Radar ArcApply pour '{user_id}'.",
                "user": user_id,
            },
        }
        yield f"event: CONNECTED\ndata: {json.dumps(welcome)}\n\n"

        while True:
            if await request.is_disconnected():
                break
            try:
                # Récupère un message avec un timeout de 15s pour émettre un ping de maintien de connexion
                data = await asyncio.wait_for(queue.get(), timeout=15.0)
                yield data
            except asyncio.TimeoutError:
                yield f": ping - {utc_iso()}\n\n"
    finally:
        _user_subscribers[user_id].discard(queue)
        if not _user_subscribers[user_id]:
            _user_subscribers.pop(user_id, None)


@router.get("", response_class=StreamingResponse)
async def subscribe_events(
    request: Request,
    token: Optional[str] = Query(None),
    username: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    x_username: Optional[str] = Header(None, alias="X-Username"),
):
    """
    Abonnement au flux Server-Sent Events (SSE) cloisonné par tenant.
    Transmet en direct les découvertes d'offres (JOB_DISCOVERED),
    l'avancement de collecte (SCRAPE_PROGRESS) et les alertes pour l'utilisateur identifié.
    """
    user_id = _resolve_subscriber_user(
        token=token,
        username=username,
        auth_header=authorization,
        x_username=x_username,
    )

    return StreamingResponse(
        event_generator(request, user_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
