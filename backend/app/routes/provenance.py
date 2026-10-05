from fastapi import APIRouter

from app.services.dependencies import registry

router = APIRouter()


@router.get("/provenance")
def provenance():

    return {
        "frozen_checksums": registry.frozen_checksums(),
        "section40_manifest": registry.section40_manifest(),
        "section41_manifest": registry.section41_manifest(),
        "section41_success": registry.section41_success(),
    }
