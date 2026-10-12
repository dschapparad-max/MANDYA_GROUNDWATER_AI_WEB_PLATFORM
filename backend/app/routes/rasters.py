from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.services.raster_storage import (
    B2RasterStorage,
    RasterStorageError,
)


router = APIRouter(
    prefix="/rasters",
    tags=["rasters"],
)


@router.get("/{layer_id}/data")
def raster_data(layer_id: str):
    try:
        storage = B2RasterStorage()
        obj = storage.get_object(layer_id)
    except RasterStorageError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    return StreamingResponse(
        obj["Body"].iter_chunks(chunk_size=1024 * 1024),
        media_type=obj.get("ContentType", "image/tiff"),
        headers={
            "Content-Length": str(obj["ContentLength"]),
            "Content-Disposition": (
                f'inline; filename="{layer_id}.tif"'
            ),
        },
    )

@router.get("/{layer_id}/metadata")
def raster_metadata(layer_id: str):
    try:
        storage = B2RasterStorage()
        return storage.raster_metadata(layer_id)
    except RasterStorageError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc