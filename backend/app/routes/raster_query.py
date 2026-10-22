
import logging

from fastapi import APIRouter, HTTPException, Query

from app.services.raster_sampling import sample_raster
from app.services.raster_storage import RasterStorageError

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/raster-query",
    tags=["location queries"],
)

QUERY_LAYERS = {
    "FAHP recharge index": "FAHP_RECHARGE_INDEX",
    "XGBoost predicted recharge index": "XGBOOST_RECHARGE_PREDICTION",
    "XGBoost five-zone class": "XGBOOST_FIVE_RECHARGE_ZONES",
    "CNN-GRU predicted recharge index": "CNN_GRU_RECHARGE_PREDICTION",
    "Terrain-derived D8 direction code": "SECTION38R_D8_DIRECTION",
    "Distance to terrain-derived flow pathways (m)": (
        "SECTION8F_V2_PATHWAY_DISTANCE"
    ),
}


@router.get("")
def query_location(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
):
    results = {}
    unavailable_layers = []

    for label, layer_id in QUERY_LAYERS.items():
        try:
            results[label] = sample_raster(layer_id, lat, lon)
        except RasterStorageError:
            logger.exception(
                "Raster query failed for layer_id=%s lat=%s lon=%s",
                layer_id,
                lat,
                lon,
            )
            unavailable_layers.append({
                "label": label,
                "layer_id": layer_id,
                "status": "temporarily_unavailable",
            })

    if not results:
        raise HTTPException(
            status_code=503,
            detail=(
                "Scientific raster query is temporarily unavailable."   
            ),
        )

    return {
        "coordinates": {
            "latitude": lat,
            "longitude": lon,
            "input_crs": "EPSG:4326",
        },
        "results": results,
        "unavailable_layers": unavailable_layers,
        "partial_result": bool(unavailable_layers),
        "interpretation": (
             "AI outputs are spatial predictions of the FAHP-derived recharge "
            "index, not direct measurements of recharge or calibrated recharge "
             "probabilities."
        ),
        "disclaimer": (
            "Decision-support information only. Borewell siting requires "
            "field investigation and compliance with applicable regulations. "
            "The five-zone output is a numeric class; percentile boundaries "
            "and ordinal direction are not verified. Do not interpret the "
            "class number as a borewell-suitability ranking. D8 outputs describe "
            "terrain-derived surface routing, not validated subsurface "
            "groundwater flow. Missing layers must not be interpreted as zero."
        ),
    }
