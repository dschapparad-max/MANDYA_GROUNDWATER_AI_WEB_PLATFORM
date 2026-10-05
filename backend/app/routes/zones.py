from fastapi import APIRouter

router = APIRouter()


@router.get("/zones")
def zones():

    return {
        "layer_id": "XGBOOST_FIVE_RECHARGE_ZONES",
        "type": "categorical_zone",
        "classes": [1, 2, 3, 4, 5],
        "description":
            "Five recharge-potential zones from the authoritative "
            "XGBoost decision-support layer.",
    }
