# Section 8 Flow Integration Disposition

**Date:** 2026-10-15
**Outcome:** UPSTREAM ROUTING QA RECORDED; DOWNSTREAM GROUNDWATER-FLOW PROMOTION NOT AUTHORIZED

## 1. Upstream routing evidence

Previously recorded project QA results report that the Section 8C D8 flow-direction raster passed 12 checks and the Section 8D accumulation raster passed 38 checks. These results are carried forward from the prior audit; this disposition does not rerun those checks.

The recorded shared grid is 3643 x 3071, EPSG:32643, 30 m resolution, with 5,497,649 valid-domain pixels.

These checks address raster and routing integrity. They do not independently validate actual groundwater-flow direction.

## 2. Downstream Section 8E evidence

Candidate raster:

`SECTION8E_primary_flow_pathways.tif`

Recorded candidate SHA-256:

`4994c69f216171bbb7cbc99d9df8ea53aaa16e081ee94680bd1d2b740beeda05`

The candidate is consistent with the Section 8E P90-derived accumulation threshold of 12 and contains 575,592 pathway pixels. Previously audited Section 8F/Section 38R metadata instead records threshold 10, for which 679,239 cells qualify. The difference is 103,647 cells at accumulation values 10 and 11.

The historical frozen Section 8E artifact has not been recovered and matched to its expected historical checksum. The Section 8E provenance record remains `FINAL_QA_PENDING`.

Supporting record:

`section8e_provenance_reconciliation_disposition_20261015_191635.md`

## 3. Decision

1. Keep the candidate pathway product non-authoritative and diagnostic only.
2. Do not register or present it as validated groundwater flow, authoritative recharge, or borewell suitability.
3. Do not alter frozen rasters, historical checksums, or threshold metadata to force agreement.
4. Keep the existing API safeguards: `candidate_d8_promoted`, `real_time_claim`, `scientific_mutation`, `model_training`, `model_inference`, and `new_management_ranking` remain false as verified by the production audit.
5. Do not claim downstream scientific integration is complete merely because upstream routing QA passed.

## 4. Conditions to reopen promotion

Promotion requires the exact historical frozen artifact or sufficient reliable historical evidence, reconciliation of threshold 10 versus 12, and independent downstream QA. Until then, the limitation is documented but scientifically unresolved.

**Final disposition:** upstream D8 routing integrity passed in previously recorded QA; downstream groundwater-flow validity is not established; candidate pathway promotion is not authorized.