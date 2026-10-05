import json
from pathlib import Path


class ScientificRegistry:
    """
    Read-only access to committed scientific metadata.

    This service intentionally does not:
      - train models
      - run inference
      - modify rasters
      - create zones
      - create management rankings
      - promote Candidate D8
      - make real-time predictions
    """

    def __init__(self, paths):
        self.paths = paths

    def _read_json(self, path: Path):
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    def metadata(self):
        return self._read_json(self.paths.API_METADATA)

    def frontend_config(self):
        return self._read_json(self.paths.FRONTEND_CONFIG)

    def backend_config(self):
        return self._read_json(self.paths.BACKEND_CONFIG)

    def deployment_manifest(self):
        return self._read_json(self.paths.DEPLOYMENT_MANIFEST)

    def frozen_checksums(self):
        return self._read_json(self.paths.FROZEN_CHECKSUMS)

    def section40_manifest(self):
        return self._read_json(self.paths.SECTION40_MANIFEST)

    def section41_manifest(self):
        return self._read_json(self.paths.SECTION41_MANIFEST)

    def section41_success(self):
        return self._read_json(self.paths.SECTION41_SUCCESS)

    def web_inventory_text(self):
        return self.paths.WEB_LAYER_INVENTORY.read_text(
            encoding="utf-8"
        )

    def api_contract_text(self):
        return self.paths.API_CONTRACT.read_text(
            encoding="utf-8"
        )

    def scientific_disclaimer_text(self):
        return self.paths.SCIENTIFIC_DISCLAIMER.read_text(
            encoding="utf-8"
        )
