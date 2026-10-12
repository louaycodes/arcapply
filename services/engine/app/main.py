from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.adapters.database import init_db
from app.api import ats, auth, cv, emails, events, jobs, letter, playbook, profile, recon
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Démarrage : Initialisation de la base SQLite locale
    init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="ArcApply Local Automation & AI Engine API",
    lifespan=lifespan,
)

# Configuration CORS pour autoriser le Cockpit Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https://.*\.louaycodes\.tn",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Inclusion des routeurs API
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(jobs.router)
app.include_router(events.router)
app.include_router(ats.router)
app.include_router(cv.router)
app.include_router(letter.router)
app.include_router(emails.router)
app.include_router(playbook.router)
app.include_router(recon.router)



def _get_cors_headers(request: Request) -> dict[str, str]:
    origin = request.headers.get("origin") or ""
    headers: dict[str, str] = {}
    if origin and (
        origin in settings.cors_origins
        or "louaycodes.tn" in origin
        or origin.startswith("http://localhost")
        or origin.startswith("http://127.0.0.1")
    ):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Access-Control-Allow-Methods"] = "*"
        headers["Access-Control-Allow-Headers"] = "*"
    return headers


@app.exception_handler(HTTPException)
async def http_exception_rfc7807_handler(request: Request, exc: HTTPException):
    detail = exc.detail if isinstance(exc.detail, dict) else {"message": str(exc.detail)}
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "type": "https://datatracker.ietf.org/doc/html/rfc7807",
            "title": "Erreur applicative",
            "status": exc.status_code,
            "detail": detail,
            "path": str(request.url.path),
        },
        headers=_get_cors_headers(request),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "type": "https://datatracker.ietf.org/doc/html/rfc7807",
            "title": "Erreur interne",
            "status": 500,
            "detail": {"message": str(exc)},
            "path": str(request.url.path),
        },
        headers=_get_cors_headers(request),
    )



@app.get("/")
def read_root():
    return {
        "name": settings.app_name,
        "version": settings.version,
        "status": "online",
        "database": str(settings.db_path),
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
