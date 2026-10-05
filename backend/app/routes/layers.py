import re

from fastapi import APIRouter, HTTPException

from app.services.dependencies import registry

router = APIRouter()


AUTHORITATIVE_LAYER_IDS = {
    "FAHP_RECHARGE_INDEX",
    "XGBOOST_RECHARGE_PREDICTION",
    "XGBOOST_FIVE_RECHARGE_ZONES",
    "CNN_GRU_RECHARGE_PREDICTION",
}


def _inventory_records():
    """
    The committed Section 40 inventory is the authoritative web-layer
    registry for this implementation stage.

    The parser deliberately extracts records by known layer IDs rather
    than assuming a particular CSV line layout.
    """

    text = registry.web_inventory_text()

    records = {}

    for layer_id in AUTHORITATIVE_LAYER_IDS:
        start = text.find(layer_id)

        if start < 0:
            continue

        next_positions = [
            text.find(other_id, start + len(layer_id))
            for other_id in AUTHORITATIVE_LAYER_IDS
            if other_id != layer_id
        ]

        next_positions = [
            position for position in next_positions
            if position >= 0
        ]

        end = min(next_positions) if next_positions else len(text)

        records[layer_id] = text[start:end]

    return records


@router.get("/layers")
def layers():
    records = _inventory_records()

    return {
        "layers": [
            {
                "layer_id": layer_id,
                "status": (
                    "AUTHORITATIVE_PROJECT_OUTPUT"
                    if "AUTHORITATIVE_PROJECT_OUTPUT" in records.get(
                        layer_id, ""
                    )
                    else "STATUS_NOT_AVAILABLE"
                ),
                "record_available": layer_id in records,
            }
            for layer_id in sorted(AUTHORITATIVE_LAYER_IDS)
        ]
    }


@router.get("/layers/{layer_id}")
def layer(layer_id: str):

    if layer_id not in AUTHORITATIVE_LAYER_IDS:
        raise HTTPException(
            status_code=404,
            detail="Layer is not an authoritative registered layer."
        )

    records = _inventory_records()

    if layer_id not in records:
        raise HTTPException(
            status_code=404,
            detail="Registered layer metadata is unavailable."
        )

    record = records[layer_id]

    return {
        "layer_id": layer_id,
        "status": "AUTHORITATIVE_PROJECT_OUTPUT",
        "record": record,
    }
