# Final Raster Scientific Sanity-Check Report

Audit time (UTC): 2026-10-21T19:00:20.698187+00:00

## Scope

Read-only inspection of authoritative B2 raster objects. This is a technical raster-integrity check, not field validation.

## Results

- All four authoritative layers opened: FAIL
- Expected EPSG:32643, 30 m, 3643 x 3071 grid and shared transform: FAIL
- Valid finite pixels found in every layer: FAIL
- XGBoost five-zone layer contains exactly five integer classes: FAIL
- Overall technical raster sanity checks: FAIL / INVESTIGATION REQUIRED

## Layer metadata and descriptive statistics

| Layer | Dimensions | CRS | Resolution | Valid pixels | Min | Max | Mean |
|---|---:|---|---|---:|---:|---:|---:|
| FAHP_RECHARGE_INDEX | NOT OPENED | ? | ? | ? | ? | ? | ? |
| XGBOOST_RECHARGE_PREDICTION | NOT OPENED | ? | ? | ? | ? | ? | ? |
| XGBOOST_FIVE_RECHARGE_ZONES | NOT OPENED | ? | ? | ? | ? | ? | ? |
| CNN_GRU_RECHARGE_PREDICTION | NOT OPENED | ? | ? | ? | ? | ? | ? |

## Per-layer checks

- **FAHP_RECHARGE_INDEX: FAIL / UNVERIFIED**
- **XGBOOST_RECHARGE_PREDICTION: FAIL / UNVERIFIED**
- **XGBOOST_FIVE_RECHARGE_ZONES: FAIL / UNVERIFIED**
- **CNN_GRU_RECHARGE_PREDICTION: FAIL / UNVERIFIED**

## Valid-mask overlap with FAHP

These are descriptive comparisons only. Differences are not automatically failures because the layers may have different valid-data masks.


## Frozen checksum evidence

The immediately preceding audit reported independent SHA-256 matches for all four authoritative B2 objects. This script does not repeat that hash calculation.

## Scientific validation still required

- Independent evaluation against geographically matched groundwater observations or measured recharge data has NOT been performed by this script.
- The CNN-GRU and XGBoost outputs represent predictions of an FAHP-derived recharge-potential index, not measured recharge volume or borewell yield.
- The D8 pathway layer remains a non-authoritative terrain diagnostic; it is not validated subsurface groundwater flow.
- Field suitability, farmer usability, uncertainty calibration and operational borewell recommendations remain unvalidated.

## Release decision

Technical raster sanity checks: FAIL / INVESTIGATION REQUIRED.
Full farmer-ready scientific certification: NOT GRANTED; independent hydrogeological and field validation is still required.
Appropriate current designation: deployment decision-support prototype, subject to the technical findings above.

## Errors encountered

- FAHP_RECHARGE_INDEX: unable to complete raster inspection (RasterStorageError)
- XGBOOST_RECHARGE_PREDICTION: unable to complete raster inspection (RasterStorageError)
- XGBOOST_FIVE_RECHARGE_ZONES: unable to complete raster inspection (RasterStorageError)
- CNN_GRU_RECHARGE_PREDICTION: unable to complete raster inspection (RasterStorageError)
