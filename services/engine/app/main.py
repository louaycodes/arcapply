from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.adapters.database import init_db
from app.api import events, jobs, profile
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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routeurs API
app.include_router(profile.router)
app.include_router(jobs.router)
app.include_router(events.router)


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
