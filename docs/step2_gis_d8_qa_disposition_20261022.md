# Step 2 — GIS and D8 Hydrological QA Disposition

**Date:** 2026-10-22  
**Project:** Mandya District Groundwater AI Decision-Support Platform  
**Disposition:** COMPLETE FOR RESEARCH-PROTOTYPE SUBMISSION; SCIENTIFIC LIMITATIONS RETAINED

## 1. Authoritative raster grid

The recorded cross-artifact audit passed for all four authoritative rasters:

- CRS: EPSG:32643
- Dimensions: 3,643 columns x 3,071 rows
- Resolution: 30 m
- Single-band raster data
- Frozen SHA-256 checksums: matched
- Expected valid-pixel counts: matched
- API metadata: declares all four layers and the expected CRS and resolution

Recorded valid-pixel counts:
- FAHP recharge index: 5,497,649
- XGBoost prediction: 5,497,630
- XGBoost five-zone classification: 5,497,630
- CNN-GRU prediction: 5,475,833

## 2. Mask consistency

The recorded audit established:
- XGBoost prediction and five-zone validity masks match exactly.
- The 19 FAHP-valid cells excluded by XGBoost were reconciled to the documented LULC=0 exclusion rule.
- The 21,816 FAHP/XGBoost-valid cells excluded by CNN-GRU match the recorded temporal eligibility exclusions.
- The recorded CNN-GRU eligible-coordinate and valid-cell sets reconcile exactly.

These findings establish the documented grid and mask relationships, not independent hydrological accuracy.

## 3. D8 interpretation and unresolved threshold discrepancy

D8 products are terrain-derived surface-flow diagnostics. They must not be presented as independently validated subsurface groundwater-flow directions.

The recorded flow-integration disposition identifies a threshold discrepancy:
- Section 8E candidate threshold: 12 accumulation cells.
- Downstream Section 8F/38R metadata: threshold 10 cells.
- Historical frozen Section 8E artifact has not been recovered and matched to its expected historical checksum.
- The Section 8E provenance record remains FINAL_QA_PENDING.

The candidate flow-pathway raster therefore remains diagnostic and non-authoritative. Do not promote it to validated groundwater flow or use it to claim borewell suitability.

## 4. Current storage limitation

A later B2 retrieval attempt returned HTTP 403 AccessDenied because the configured download bandwidth or Class B transaction cap was exceeded. This blocks subsequent B2-dependent reads; it does not establish raster corruption. The previously recorded checksum and grid audit results remain historical evidence and are not represented as a new successful live retrieval.

## 5. Release decision

Step 2 is closed for research-prototype submission with limitations explicitly documented. This is not a claim that every hydrological uncertainty has been resolved.

No frozen checksum, raster, model prediction, or scientific threshold is changed by this disposition.

The project must not claim independently validated groundwater-flow direction, confirmed recharge, guaranteed borewell success, or farmer-ready certification.
