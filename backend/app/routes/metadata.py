from fastapi import APIRouter

from app.services.dependencies import registry

router = APIRouter()


@router.get("/metadata")
def metadata():
    return registry.metadata()
