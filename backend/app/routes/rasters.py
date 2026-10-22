from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import rasterio

from app.services.raster_sampling import _cached_raster_path
from app.services.raster_storage import LAYER_OBJECTS, RasterStorageError


router = APIRouter(
    prefix="/rasters",
    tags=["rasters"],
)


@router.get("/{layer_id}/data")
def raster_data(layer_id: str):
    try:
        path = _cached_raster_path(layer_id)
    except RasterStorageError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    return FileResponse(
        path=str(path),
        media_type="image/tiff",
        filename=f"{layer_id}.tif",
    )


@router.get("/{layer_id}/metadata")
def raster_metadata(layer_id: str):
    try:
        path = _cached_raster_path(layer_id)

        with rasterio.open(path) as dataset:
            bounds = dataset.bounds

            return {
                "layer_id": layer_id,
                "object_key": LAYER_OBJECTS[layer_id],
                "driver": dataset.driver,
                "crs": dataset.crs.to_string() if dataset.crs else None,
                "width": dataset.width,
                "height": dataset.height,
                "count": dataset.count,
                "dtype": dataset.dtypes[0],
                "nodata": dataset.nodata,
                "resolution": list(dataset.res),
                "bounds": {
                    "left": bounds.left,
                    "bottom": bounds.bottom,
                    "right": bounds.right,
                    "top": bounds.top,
                },
                "transform": list(dataset.transform)[:6],
            }

    except RasterStorageError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc