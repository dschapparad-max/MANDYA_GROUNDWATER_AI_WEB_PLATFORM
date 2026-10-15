import csv
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))

from app.routes.layers import AUTHORITATIVE_LAYER_IDS, _inventory_records
from app.services.dependencies import registry


class LayerRegistryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.inventory_path = ROOT / "data_manifest" / "section40_web_layer_inventory.csv"
        with cls.inventory_path.open("r", encoding="utf-8-sig", newline="") as handle:
            cls.rows = list(csv.DictReader(handle))
        cls.records = _inventory_records()

    def test_four_authoritative_layers_are_registered(self):
        self.assertEqual(len(AUTHORITATIVE_LAYER_IDS), 4)
        self.assertEqual(set(self.records), AUTHORITATIVE_LAYER_IDS)

    def test_each_registered_layer_is_authoritative_in_inventory(self):
        by_id = {row["layer_id"]: row for row in self.rows}
        for layer_id in AUTHORITATIVE_LAYER_IDS:
            with self.subTest(layer_id=layer_id):
                self.assertIn(layer_id, by_id)
                self.assertEqual(
                    by_id[layer_id]["status"],
                    "AUTHORITATIVE_PROJECT_OUTPUT",
                )
                self.assertIn(
                    "AUTHORITATIVE_PROJECT_OUTPUT",
                    self.records[layer_id],
                )

    def test_candidate_d8_is_not_authoritatively_registered(self):
        candidate = "D8_CANDIDATE_PATHWAY_DIAGNOSTIC"
        self.assertIn(candidate, {row["layer_id"] for row in self.rows})
        self.assertNotIn(candidate, AUTHORITATIVE_LAYER_IDS)
        self.assertNotIn(candidate, self.records)

    def test_registry_uses_committed_inventory_path(self):
        self.assertEqual(
            Path(registry.paths.WEB_LAYER_INVENTORY).resolve(),
            self.inventory_path.resolve(),
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
