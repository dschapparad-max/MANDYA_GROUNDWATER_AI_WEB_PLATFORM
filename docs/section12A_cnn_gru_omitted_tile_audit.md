# Section 12A — CNN-GRU Omitted-Tile Coverage Audit

## Finding
The CNN-GRU tile inventory contains fewer tiles than the XGBoost
inventory. Investigation tested the 1,146 XGBoost tile coordinates
absent from the CNN-GRU inventory.

## Source integrity
The frozen CNN-GRU source raster SHA-256 matched the expected hash:

194714FE884802263A4FC954626DC4FD4DD4A8CB10413477BAD55DA2DBC5DC6A

## Test results
- XGBoost tile count: 2,525
- CNN-GRU tile count: 1,379
- CNN-GRU coordinates absent relative to XGBoost: 1,146
- Absent coordinates tested: 1,146
- Coordinates empty after generator-style reprojection: 1,146
- Absent coordinates with valid pixels: 0

## Interpretation
The tested omissions are consistent with the CNN-GRU generator's
rule to skip a tile when its reprojected values contain no finite
pixels. This test did not find evidence that the omitted coordinates
contain valid CNN-GRU pixels under the tested reprojection procedure.

## Disposition
CLOSE THIS SPECIFIC OMISSION INVESTIGATION — CONSISTENT WITH
EMPTY-TILE SKIPPING.

This disposition does not establish complete geographic footprint
correctness, pixel-level alignment with other model products, visual
rendering correctness at every coordinate, or scientific model accuracy.

## Change control
No raster, tile, generator, frontend, backend, or deployed service
was modified by this investigation. No regeneration is justified by
this finding alone.

## Evidence basis
- User-provided PowerShell output from the read-only coverage test.
- Inspected generator: generate_cnn_gru_tiles.py.
- Verification scope: the 1,146 coordinates absent from the CNN-GRU
  inventory relative to XGBoost.

## Section 10X — Section 36 temporal eligibility reconciliation

**Status: PASS — exact coordinate-level mask reconciliation**

### Purpose

Investigate why the CNN-GRU prediction raster contains fewer valid pixels than the FAHP target and XGBoost prediction raster.

### Evidence examined

- Authoritative eligibility CSV:
  `SECTION_36_OUTPUT/02_TABLES/section36_authoritative_pixel_temporal_eligibility.csv`
- Eligibility NPZ:
  `SECTION_36_OUTPUT/00_PROVENANCE/section36_cnn_gru_temporal_eligibility_mask.npz`
- CNN-GRU raster:
  `section38N_CNN_GRU_recharge_index_prediction_30m.tif`
- FAHP target and Section 13 XGBoost prediction rasters.

### Coordinate-level reconciliation

| Check | Result |
|---|---:|
| Unique eligible CSV coordinates | 5,475,833 |
| FAHP valid cells | 5,497,649 |
| XGBoost valid cells | 5,497,630 |
| CNN-GRU valid cells | 5,475,833 |
| Eligible CSV coordinates absent from FAHP validity mask | 0 |
| Eligible CSV coordinates absent from XGBoost validity mask | 19 |
| Eligible CSV coordinates absent from CNN-GRU validity mask | 0 |
| FAHP/XGBoost-valid cells excluded from CNN-GRU | 21,816 |
| Those 21,816 cells absent from eligibility coordinates | 21,816 |
| Those 21,816 cells unexpectedly eligible | 0 |
| CNN-GRU-valid cells absent from eligibility coordinates | 0 |

The eligible coordinate set and CNN-GRU valid-cell set reconcile exactly.

### Interpretation

The 21,816 cells that are valid in both FAHP and XGBoost but invalid in CNN-GRU correspond exactly to cells absent from the authoritative Section 36 temporal eligibility coordinate table.

Section 36 defines eligibility as complete rainfall and NDVI observations across all 36 months. Its authoritative manifest reports 5,497,649 domain pixels, 5,475,833 eligible pixels, complete rainfall across the domain, and 5,475,833 pixels with complete NDVI observations.

The evidence therefore supports the conclusion that the CNN-GRU validity mask is consistent with the Section 36 temporal eligibility mask.

### Limitations and open items

- This establishes coordinate-level mask consistency, not independent model accuracy or scientific correctness of prediction values.
- The separate 19-cell discrepancy between FAHP and XGBoost remains unresolved.
- No scientific raster, model, dataset, or prediction was modified during this investigation.
- No raster regeneration or retraining is authorized or implied by this finding.

### Reproducibility

The finding was established by comparing the CSV row/column coordinates with the valid-data masks of the three rasters using Rasterio and NumPy. The reconciliation reported zero eligible coordinates missing from CNN-GRU and zero CNN-GRU-valid coordinates absent from the eligibility CSV.


## 10X — Verification of 19 XGBoost LULC exclusions

**Status: PASS — all 19 exclusions reconciled at source coordinates.**

### Evidence
- Section 13 diagnostics record project domain = 5,497,649 pixels,
  `lulc0_excluded` = 19, and final XGBoost prediction domain = 5,497,630.
- The aligned LULC raster SHA-256 matches the recorded checksum:
  `82b71c3f86c4dec441c97351a4baddfa734e76ffd650f887a935e50c8f50dd63`.
- Original and aligned LULC grids are both EPSG:32643, 3643 x 3071.
- All 19 previously identified FAHP-valid/XGBoost-invalid coordinates
  were sampled in both the original and aligned LULC rasters.
- Every sampled value equals 0. No sampled value was NoData or non-finite.
- Counts reconcile: 5,497,649 - 19 = 5,497,630.

### Interpretation
The 19-cell XGBoost mask discrepancy is explained by the documented
LULC=0 exclusion rule. No raster repair or filling is warranted.

### Coordinates verified (zero-based row, column)
(93,1619), (94,1622), (159,1708), (181,1098), (182,1096),
(183,1093), (183,1094), (431,1011), (431,1012), (771,833),
(771,834), (976,2378), (2430,3521), (2430,3522), (2430,3523),
(2498,2082), (2500,2078), (2502,2075), (2504,2072).

### Scope limitation
This closes the 19-cell mask investigation only. It does not establish
independent model accuracy or resolve the separate XGBoost tile-sampling
value mismatches documented elsewhere in the investigation.

## 10X — XGBoost tile-sampling provenance discrepancy

**Status: UNRESOLVED — historical generator provenance not established.**

### Evidence
- Source raster SHA-256:
  `8A7731DC61010CEAE1CFD93CC1A69E3C6853BFF753FA6075822637AC5FAA728D`.
- The inspected production generator currently uses `np.floor()` for
  source pixel row and column sampling.
- A read-only reconstruction using the same source raster and the
  tested `np.rint()` sampling procedure reproduced the existing
  reference PNG exactly: 65,536 of 65,536 pixels matched.
- The `np.floor()` reconstruction differed at 48,277 of 65,536 pixels.

### Interpretation
The reference PNG is consistent with the tested `np.rint()` sampling
procedure, not the inspected generator's current `np.floor()` procedure.
The test does not establish which historical generator version or
configuration produced the PNG.

### Disposition and change control
Historical tile-generation provenance remains unresolved. Do not claim
that the current generator reproduces the historical tile. No source
raster, tile, generator, model, or deployed service was modified by
this investigation. No tile regeneration or model retraining is
authorized or implied by this finding.
