import asyncio
import json
from datetime import datetime, timezone
from typing import AsyncGenerator
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/api/events", tags=["Server-Sent Events"])

# Liste des queues d'abonnés actifs
_subscribers: set[asyncio.Queue] = set()


def utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def broadcast_event(event_type: str, payload: dict) -> None:
    """
    Diffuse un événement typé conforme à l'invariant AD-3 à tous les clients connectés.
    Structure enveloppe : {"event": "...", "timestamp": "...", "payload": { ... }}
    """
    message = {
        "event": event_type,
        "timestamp": utc_iso(),
        "payload": payload,
    }
    data_str = json.dumps(message)
    formatted = f"event: {event_type}\ndata: {data_str}\n\n"

    for queue in list(_subscribers):
        try:
            queue.put_nowait(formatted)
        except asyncio.QueueFull:
            pass


async def event_generator(request: Request) -> AsyncGenerator[str, None]:
    queue: asyncio.Queue = asyncio.Queue(maxsize=100)
    _subscribers.add(queue)

    try:
        # Événement de bienvenue / synchronisation initiale
        welcome = {
            "event": "CONNECTED",
            "timestamp": utc_iso(),
            "payload": {"status": "ok", "message": "Connecté au flux télémétrique Radar ArcApply."},
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
                ping = {
                    "event": "PING",
                    "timestamp": utc_iso(),
                    "payload": {},
                }
                yield f": ping - {utc_iso()}\n\n"
    finally:
        _subscribers.discard(queue)


@router.get("", response_class=StreamingResponse)
async def subscribe_events(request: Request):
    """
    Abonnement au flux Server-Sent Events (SSE).
    Transmet en direct les découvertes d'offres (JOB_DISCOVERED),
    l'avancement de collecte (SCRAPE_PROGRESS) et les alertes.
    """
    return StreamingResponse(
        event_generator(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
