from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.adapters.database import init_db
from app.api import profile
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
