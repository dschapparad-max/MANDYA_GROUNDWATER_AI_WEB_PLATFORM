import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.main import app


class ClaimsApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_claims_reports_groundwater_flow_validation_false(self):
        response = self.client.get("/api/claims")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("groundwater_flow_validation", data)
        self.assertIs(data["groundwater_flow_validation"], False)
        self.assertIs(data["candidate_d8_promoted"], False)

    def test_claims_defaults_validation_false_when_manifest_field_missing(self):
        with patch(
            "app.routes.claims.registry.deployment_manifest",
            return_value={"geographic_scope": "Mandya District"},
        ):
            response = self.client.get("/api/claims")

        self.assertEqual(response.status_code, 200)
        self.assertIs(response.json()["groundwater_flow_validation"], False)


if __name__ == "__main__":
    unittest.main(verbosity=2)