from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import (
    claims,
    layers,
    metadata,
    provenance,
    zones,
)

app = FastAPI(
    title="Mandya Groundwater AI API",
    version="1.0.0",
    description=(
        "Read-only API for the verified Mandya Groundwater AI "
        "scientific web platform."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(
    metadata.router,
    prefix="/api",
)

app.include_router(
    layers.router,
    prefix="/api",
)

app.include_router(
    provenance.router,
    prefix="/api",
)

app.include_router(
    claims.router,
    prefix="/api",
)

app.include_router(
    zones.router,
    prefix="/api",
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "mode": "read-only-scientific",
    }
