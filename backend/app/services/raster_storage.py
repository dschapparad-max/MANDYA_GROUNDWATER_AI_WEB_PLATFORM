import os

import boto3
import rasterio
from botocore.client import Config


LAYER_OBJECTS = {
    "FAHP_RECHARGE_INDEX": (
        "mandya/authoritative/fahp/"
        "groundwater_recharge_fahp_FINAL_10factor.tif"
    ),
    "XGBOOST_RECHARGE_PREDICTION": (
        "mandya/authoritative/xgboost/"
        "SECTION13_final_XGBoost_recharge_index_prediction.tif"
    ),
    "XGBOOST_FIVE_RECHARGE_ZONES": (
        "mandya/authoritative/xgboost-zones/"
        "SECTION14_XGBoost_recharge_index_5zone.tif"
    ),
    "CNN_GRU_RECHARGE_PREDICTION": (
        "mandya/authoritative/cnn-gru/"
        "section38N_CNN_GRU_recharge_index_prediction_30m.tif"
    ),
    'SECTION38R_D8_DIRECTION': 'mandya/authoritative/hydrology/section38R_flow_direction_30m.tif',
    'SECTION8F_V2_PATHWAY_DISTANCE': 'mandya/authoritative/hydrology/SECTION8F_distance_to_primary_flow_pathways_v2_20261016.tif',
}


class RasterStorageError(RuntimeError):
    """Raised when the configured raster storage cannot be accessed."""


class B2RasterStorage:
    """
    Read-only access to verified scientific rasters stored in Backblaze B2.

    This service does not train models, perform inference, modify rasters,
    create zones, or promote diagnostic layers.
    """

    def __init__(self) -> None:
        self.endpoint = os.getenv("B2_ENDPOINT", "").strip()
        self.bucket = os.getenv("B2_BUCKET", "").strip()
        self.key_id = os.getenv("B2_KEY_ID", "").strip()
        self.application_key = os.getenv("B2_APPLICATION_KEY", "").strip()

        missing = [
            name
            for name, value in {
                "B2_ENDPOINT": self.endpoint,
                "B2_BUCKET": self.bucket,
                "B2_KEY_ID": self.key_id,
                "B2_APPLICATION_KEY": self.application_key,
            }.items()
            if not value
        ]

        if missing:
            raise RasterStorageError(
                "Missing required B2 configuration: "
                + ", ".join(missing)
            )

        self.client = boto3.client(
            "s3",
            endpoint_url=self.endpoint,
            aws_access_key_id=self.key_id,
            aws_secret_access_key=self.application_key,
            config=Config(signature_version="s3v4"),
        )

    @staticmethod
    def object_key(layer_id: str) -> str:
        try:
            return LAYER_OBJECTS[layer_id]
        except KeyError as exc:
            raise RasterStorageError(
                f"Raster layer is not available: {layer_id}"
            ) from exc

    def head(self, layer_id: str) -> dict:
        key = self.object_key(layer_id)

        try:
            response = self.client.head_object(
                Bucket=self.bucket,
                Key=key,
            )
        except Exception as exc:
            raise RasterStorageError(
                f"Unable to access raster object for {layer_id}"
            ) from exc

        return {
            "layer_id": layer_id,
            "object_key": key,
            "content_length": response.get("ContentLength"),
            "content_type": response.get("ContentType"),
            "etag": response.get("ETag"),
            "version_id": response.get("VersionId"),
            "server_side_encryption": response.get(
                "ServerSideEncryption"
            ),
        }

    def get_object(self, layer_id: str):
        key = self.object_key(layer_id)

        try:
            response = self.client.get_object(
                Bucket=self.bucket,
                Key=key,
            )
        except Exception as exc:
            raise RasterStorageError(
                f"Unable to read raster object for {layer_id}"
            ) from exc

        return response

    def raster_metadata(self, layer_id: str) -> dict:
        response = self.get_object(layer_id)

        try:
            raster_bytes = response["Body"].read()

            with rasterio.MemoryFile(raster_bytes) as memfile:
                with memfile.open() as dataset:
                    bounds = dataset.bounds

                    return {
                        "layer_id": layer_id,
                        "object_key": self.object_key(layer_id),
                        "driver": dataset.driver,
                        "crs": (
                            dataset.crs.to_string()
                            if dataset.crs
                            else None
                        ),
                        "width": dataset.width,
                        "height": dataset.height,
                        "count": dataset.count,
                        "dtype": dataset.dtypes[0],
                        "nodata": dataset.nodata,
                        "resolution": [
                            dataset.res[0],
                            dataset.res[1],
                        ],
                        "bounds": {
                            "left": bounds.left,
                            "bottom": bounds.bottom,
                            "right": bounds.right,
                            "top": bounds.top,
                        },
                        "transform": [
                            dataset.transform.a,
                            dataset.transform.b,
                            dataset.transform.c,
                            dataset.transform.d,
                            dataset.transform.e,
                            dataset.transform.f,
                        ],
                    }

        except Exception as exc:
            raise RasterStorageError(
                f"Unable to inspect raster metadata for {layer_id}"
            ) from exc

        finally:
            response["Body"].close()