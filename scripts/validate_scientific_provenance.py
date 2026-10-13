
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def load_json(relative_path):
    return json.loads(
        (ROOT / relative_path).read_text(encoding="utf-8-sig")
    )

checksums = load_json("provenance/frozen_artifact_checksums.json")
data_manifest = load_json("data_manifest/scientific_data_manifest.json")
section41 = load_json("provenance/section41_success_manifest.json")

mapping = {
    "FAHP": "FAHP_RECHARGE_INDEX",
    "XGBoost": "XGBOOST_RECHARGE_PREDICTION",
    "XGBoost-five-zone": "XGBOOST_FIVE_RECHARGE_ZONES",
    "CNN-GRU": "CNN_GRU_RECHARGE_PREDICTION",
}

layers = {
    layer["id"]: layer
    for layer in data_manifest["layers"]
    if layer.get("sha256")
}

expected = checksums["expected"]
actual = checksums["actual"]
section41_hashes = section41["frozen_hashes"]

assert set(expected) == set(mapping), "Expected hash set is incomplete."
assert set(actual) == set(mapping), "Actual hash set is incomplete."
assert set(section41_hashes) == set(mapping), (
    "Section 41 frozen hash set is incomplete."
)

for name, layer_id in mapping.items():
    digest = expected[name].lower()

    assert re.fullmatch(r"[0-9a-f]{64}", digest), (
        f"Invalid SHA-256 format: {name}"
    )
    assert actual[name].lower() == digest, (
        f"Frozen checksum mismatch: {name}"
    )
    assert layers[layer_id]["sha256"].lower() == digest, (
        f"Scientific data manifest mismatch: {name}"
    )
    assert section41_hashes[name].lower() == digest, (
        f"Section 41 manifest mismatch: {name}"
    )

    print(f"PASS: {name}")

assert checksums["all_match"] is True

print("PASS: all four artifact hashes agree across tracked manifests.")
print("NOTE: this test validates manifest consistency, not source-file bytes.")
