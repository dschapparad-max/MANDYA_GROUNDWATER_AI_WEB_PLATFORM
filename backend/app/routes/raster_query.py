
from fastapi import APIRouter, HTTPException, Query

from app.services.raster_sampling import sample_raster
from app.services.raster_storage import RasterStorageError

router = APIRouter(
    prefix="/raster-query",
    tags=["location queries"],
)

QUERY_LAYERS = {
    "FAHP recharge index": "FAHP_RECHARGE_INDEX",
    "XGBoost predicted recharge index": "XGBOOST_RECHARGE_PREDICTION",
    "XGBoost five-zone class": "XGBOOST_FIVE_RECHARGE_ZONES",
    "CNN-GRU predicted recharge index": "CNN_GRU_RECHARGE_PREDICTION",
}


@router.get("")
def query_location(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
):
    results = {}

    try:
        for label, layer_id in QUERY_LAYERS.items():
            results[label] = sample_raster(layer_id, lat, lon)

    except RasterStorageError as exc:
        raise HTTPException(
            status_code=503,
            detail="Scientific raster query is temporarily unavailable.",
        ) from exc

    return {
        "coordinates": {
            "latitude": lat,
            "longitude": lon,
            "input_crs": "EPSG:4326",
        },
        "results": results,
        "interpretation": (
            "AI values are spatial predictions of the FAHP-derived "
            "recharge index, not direct measurements or calibrated "
            "recharge probabilities."
        ),
        "disclaimer": (
            "Decision-support information only. Borewell siting requires "
            "field investigation and compliance with applicable regulations. "
            "The five-zone output is a numeric class; percentile boundaries "
            "and ordinal direction are not verified. Do not interpret the "
            "class number as a borewell-suitability ranking."
        ),
    }
