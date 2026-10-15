import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import numpy as np
import rasterio
from rasterio.transform import from_origin, xy
from rasterio.warp import transform

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))

from app.services.raster_sampling import sample_raster


class RasterSamplingTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        directory = Path(temporary.name)

        self.integer_path = directory / "integer.tif"
        self.float_path = directory / "float.tif"

        # Construct a small projected raster around a Mandya-area point.
        xs, ys = transform(
            "EPSG:4326", "EPSG:32643", [76.89], [12.52]
        )
        self.x, self.y = xs[0], ys[0]
        affine = from_origin(self.x - 15, self.y + 15, 30, 30)

        self._write_raster(
            self.integer_path,
            np.array([[7, -9999], [3, 4]], dtype=np.int16),
            "int16",
            -9999,
            affine,
        )
        self._write_raster(
            self.float_path,
            np.array([[0.75, 0.25], [0.40, 0.90]], dtype=np.float32),
            "float32",
            -9999.0,
            affine,
        )

    @staticmethod
    def _write_raster(path, values, dtype, nodata, affine):
        with rasterio.open(
            path,
            "w",
            driver="GTiff",
            height=values.shape[0],
            width=values.shape[1],
            count=1,
            dtype=dtype,
            crs="EPSG:32643",
            transform=affine,
            nodata=nodata,
        ) as dataset:
            dataset.write(values, 1)

    @staticmethod
    def _cell_coordinates(path, row, column):
        with rasterio.open(path) as dataset:
            x, y = xy(
                dataset.transform, row, column, offset="center"
            )
            longitudes, latitudes = transform(
                dataset.crs,
                "EPSG:4326",
                [x],
                [y],
            )
        return latitudes[0], longitudes[0]

    def test_wgs84_coordinates_are_transformed_and_integer_value_returned(self):
        lat, lon = self._cell_coordinates(self.integer_path, 0, 0)

        with patch(
            "app.services.raster_sampling._cached_raster_path",
            return_value=self.integer_path,
        ):
            result = sample_raster("TEST_LAYER", lat, lon)

        self.assertEqual(result["status"], "ok")
        self.assertEqual(result["value"], 7)
        self.assertIs(type(result["value"]), int)
        self.assertEqual(result["row"], 0)
        self.assertEqual(result["column"], 0)
        self.assertEqual(result["raster_crs"], "EPSG:32643")

    def test_nodata_cell_is_reported(self):
        lat, lon = self._cell_coordinates(self.integer_path, 0, 1)

        with patch(
            "app.services.raster_sampling._cached_raster_path",
            return_value=self.integer_path,
        ):
            result = sample_raster("TEST_LAYER", lat, lon)

        self.assertEqual(result["status"], "nodata")
        self.assertIsNone(result["value"])

    def test_location_outside_raster_is_reported(self):
        with patch(
            "app.services.raster_sampling._cached_raster_path",
            return_value=self.integer_path,
        ):
            result = sample_raster("TEST_LAYER", 0.0, 0.0)

        self.assertEqual(result["status"], "outside_coverage")
        self.assertIsNone(result["value"])

    def test_float_raster_returns_floating_point_value(self):
        lat, lon = self._cell_coordinates(self.float_path, 0, 0)

        with patch(
            "app.services.raster_sampling._cached_raster_path",
            return_value=self.float_path,
        ):
            result = sample_raster("TEST_LAYER", lat, lon)

        self.assertEqual(result["status"], "ok")
        self.assertIs(type(result["value"]), float)
        self.assertAlmostEqual(result["value"], 0.75, places=5)


if __name__ == "__main__":
    unittest.main(verbosity=2)
