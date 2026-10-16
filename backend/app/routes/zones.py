from fastapi import APIRouter

router = APIRouter()


@router.get("/zones")
def zones():

    return {
        "layer_id": "XGBOOST_FIVE_RECHARGE_ZONES",
        "type": "categorical_zone",
        "classes": [1, 2, 3, 4, 5],
        "description":
            "Five approximately equal-frequency percentile classes derived from the final "
            "XGBoost recharge-index prediction. Zone 1 has the lowest index values and "
            "Zone 5 has the highest. The classes describe relative index rank only; they "
            "are not independently validated for hydrogeologic recharge suitability or "
            "borewell siting.",
    }
