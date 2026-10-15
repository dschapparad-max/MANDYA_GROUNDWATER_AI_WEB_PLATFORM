from fastapi import APIRouter

router = APIRouter()


@router.get("/zones")
def zones():

    return {
        "layer_id": "XGBOOST_FIVE_RECHARGE_ZONES",
        "type": "categorical_zone",
        "classes": [1, 2, 3, 4, 5],
        "description":
            "Five percentile-based spatial classes derived from the final "
            "XGBoost recharge-index prediction. The available metadata "
            "confirms classes 1-5 but does not define their percentile "
            "boundaries or ordinal direction. Do not treat the numeric "
            "class as a verified borewell-suitability ranking.",
    }
