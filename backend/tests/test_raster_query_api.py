import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))

from app.main import app
from app.services.raster_storage import RasterStorageError


class RasterQueryApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_successful_query_returns_four_layers_and_scientific_caveats(self):
        def fake_sample(layer_id, latitude, longitude):
            return {
                "layer_id": layer_id,
                "status": "ok",
                "value": 0.5,
            }

        with patch(
            "app.routes.raster_query.sample_raster",
            side_effect=fake_sample,
        ) as sampler:
            response = self.client.get(
                "/api/raster-query",
                params={"lat": 12.52, "lon": 76.89},
            )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(
            body["coordinates"]["input_crs"],
            "EPSG:4326",
        )
        self.assertEqual(len(body["results"]), 4)
        self.assertIn("FAHP recharge index", body["results"])
        self.assertIn("XGBoost predicted recharge index", body["results"])
        self.assertIn("XGBoost five-zone class", body["results"])
        self.assertIn("CNN-GRU predicted recharge index", body["results"])
        self.assertIn("not direct measurements", body["interpretation"])
        self.assertIn("field investigation", body["disclaimer"])
        self.assertIn("percentile boundaries", body["disclaimer"])
        self.assertIn("ordinal direction", body["disclaimer"])
        self.assertIn("borewell-suitability ranking", body["disclaimer"])
        self.assertEqual(sampler.call_count, 4)

    def test_invalid_coordinates_return_422_without_sampling(self):
        with patch(
            "app.routes.raster_query.sample_raster"
        ) as sampler:
            response = self.client.get(
                "/api/raster-query",
                params={"lat": 100, "lon": 76.89},
            )

        self.assertEqual(response.status_code, 422)
        sampler.assert_not_called()

    def test_raster_storage_failure_returns_safe_503_message(self):
        with patch(
            "app.routes.raster_query.sample_raster",
            side_effect=RasterStorageError(
                "private storage diagnostic"
            ),
        ):
            response = self.client.get(
                "/api/raster-query",
                params={"lat": 12.52, "lon": 76.89},
            )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.json()["detail"],
            "Scientific raster query is temporarily unavailable.",
        )
        self.assertNotIn(
            "private storage diagnostic",
            response.text,
        )

    def test_zone_metadata_preserves_classes_and_warns_about_unverified_ranking(self):
        response = self.client.get("/api/zones")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["classes"], [1, 2, 3, 4, 5])
        self.assertIn("approximately equal-frequency percentile classes", body["description"])
        self.assertIn("Zone 1 has the lowest index", body["description"])
        self.assertIn("Zone 5 has the highest", body["description"])
        self.assertIn("not independently validated for hydrogeologic recharge suitability", body["description"])
        self.assertIn("borewell siting", body["description"])
    def test_configured_local_frontend_origin_is_allowed(self):
        response = self.client.get(
            "/health",
            headers={"Origin": "http://localhost:5173"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers.get("access-control-allow-origin"),
            "http://localhost:5173",
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
