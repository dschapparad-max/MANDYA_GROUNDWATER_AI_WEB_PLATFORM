from fastapi import APIRouter

from app.services.dependencies import registry

router = APIRouter()


@router.get("/claims")
def claims():

    deployment = registry.deployment_manifest()

    return {
        "geographic_scope": deployment.get(
            "geographic_scope",
            "Mandya District"
        ),
        "real_time_claim": deployment.get(
            "real_time_claim",
            False
        ),
        "candidate_d8_promoted": deployment.get(
            "candidate_d8_promoted",
            False
        ),
        "scientific_mutation": deployment.get(
            "scientific_mutation",
            False
        ),
        "model_training": deployment.get(
            "model_training",
            False
        ),
        "model_inference": deployment.get(
            "model_inference",
            False
        ),
        "new_management_ranking": deployment.get(
            "new_management_ranking",
            False
        ),
        "scientific_disclaimer":
            registry.scientific_disclaimer_text(),
    }
