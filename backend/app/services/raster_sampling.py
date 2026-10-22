
import os
import tempfile
from pathlib import Path
from tempfile import NamedTemporaryFile

import numpy as np
import rasterio
from rasterio.warp import transform

from app.services.raster_storage import (
    B2RasterStorage,
    LAYER_OBJECTS,
    RasterStorageError,
)

CACHE_DIR = Path(tempfile.gettempdir()) / "mandya_groundwater_rasters"


def _cached_raster_path(layer_id: str) -> Path:
    if layer_id not in LAYER_OBJECTS:
        raise RasterStorageError(f"Unknown raster layer: {layer_id}")

    # Prefer packaged local rasters when present.
    local_dir = Path(__file__).resolve().parents[2] / "data" / "rasters"
    local_path = local_dir / f"{layer_id}.tif"

    if local_path.is_file() and local_path.stat().st_size > 0:
        try:
            with rasterio.open(local_path) as dataset:
                if dataset.count < 1 or dataset.crs is None:
                    raise RasterStorageError(
                        f"Local raster lacks a band or CRS: {layer_id}"
                    )
            return local_path
        except RasterStorageError:
            raise
        except Exception as exc:
            raise RasterStorageError(
                f"Unable to validate local raster: {layer_id}"
            ) from exc

    # Retain the existing B2 cache/download fallback.
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    destination = CACHE_DIR / f"{layer_id}.tif"

    if destination.is_file() and destination.stat().st_size > 0:
        return destination

    response = B2RasterStorage().get_object(layer_id)
    body = response["Body"]
    temporary_path = None

    try:
        with NamedTemporaryFile(
            mode="wb",
            dir=CACHE_DIR,
            prefix=f"{layer_id}-",
            suffix=".partial",
            delete=False,
        ) as output:
            temporary_path = Path(output.name)
            for chunk in body.iter_chunks(chunk_size=1024 * 1024):
                if chunk:
                    output.write(chunk)

        if not temporary_path.exists() or temporary_path.stat().st_size == 0:
            raise RasterStorageError(f"Downloaded raster is empty: {layer_id}")

        with rasterio.open(temporary_path) as dataset:
            if dataset.count < 1 or dataset.crs is None:
                raise RasterStorageError(
                    f"Raster lacks a band or CRS: {layer_id}"
                )

        os.replace(temporary_path, destination)
        return destination

    except Exception as exc:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)
        if isinstance(exc, RasterStorageError):
            raise
        raise RasterStorageError(
            f"Unable to cache raster: {layer_id}"
        ) from exc
    finally:
        body.close()



def sample_raster(
    layer_id: str,
    latitude: float,
    longitude: float,
) -> dict:
    path = _cached_raster_path(layer_id)

    try:
        with rasterio.open(path) as dataset:
            x_values, y_values = transform(
                "EPSG:4326",
                dataset.crs,
                [longitude],
                [latitude],
            )
            x, y = x_values[0], y_values[0]

            row, column = dataset.index(x, y)

            result = {
                "layer_id": layer_id,
                "status": "ok",
                "value": None,
                "row": row,
                "column": column,
                "raster_crs": dataset.crs.to_string(),
                "dtype": dataset.dtypes[0],
                "nodata": dataset.nodata,
            }

            if (
                row < 0
                or column < 0
                or row >= dataset.height
                or column >= dataset.width
            ):
                result["status"] = "outside_coverage"
                return result

            pixel = dataset.read(
                1,
                window=((row, row + 1), (column, column + 1)),
                masked=True,
            )[0, 0]

            if np.ma.is_masked(pixel):
                result["status"] = "nodata"
                return result

            value = pixel.item()

            if not np.isfinite(value):
                result["status"] = "nodata"
                return result

            if np.issubdtype(dataset.dtypes[0], np.integer):
                result["value"] = int(value)
            else:
                result["value"] = float(value)

            return result

    except RasterStorageError:
        raise
    except Exception as exc:
        raise RasterStorageError(
            f"Unable to sample raster: {layer_id}"
        ) from exc
