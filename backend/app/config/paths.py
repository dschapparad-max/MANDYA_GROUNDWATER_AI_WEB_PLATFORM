from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]

CONFIG_DIR = REPO_ROOT / "config"
PROVENANCE_DIR = REPO_ROOT / "provenance"
DATA_MANIFEST_DIR = REPO_ROOT / "data_manifest"
DOCS_DIR = REPO_ROOT / "docs"

API_METADATA = CONFIG_DIR / "api_metadata.json"
FRONTEND_CONFIG = CONFIG_DIR / "frontend_layer_configuration.json"
BACKEND_CONFIG = CONFIG_DIR / "backend_scientific_configuration.json"
DEPLOYMENT_MANIFEST = CONFIG_DIR / "deployment_manifest.json"

FROZEN_CHECKSUMS = PROVENANCE_DIR / "frozen_artifact_checksums.json"
SECTION40_MANIFEST = PROVENANCE_DIR / "section40_final_web_platform_manifest.json"
SECTION41_MANIFEST = PROVENANCE_DIR / "section41_final_deployment_manifest.json"
SECTION41_SUCCESS = PROVENANCE_DIR / "section41_success_manifest.json"

WEB_LAYER_INVENTORY = (
    DATA_MANIFEST_DIR /
    "section40_web_layer_inventory.csv"
)

API_CONTRACT = DOCS_DIR / "API_CONTRACT.md"
SCIENTIFIC_DISCLAIMER = DOCS_DIR / "SCIENTIFIC_USE_DISCLAIMER.md"
