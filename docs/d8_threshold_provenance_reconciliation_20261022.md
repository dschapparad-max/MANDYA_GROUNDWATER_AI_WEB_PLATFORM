# D8 Threshold and Provenance Reconciliation

Date: 2026-10-22
Status: PARTIAL — historical artifact reconciliation remains open.

## 1. Evidence

The original Section 8F provenance records a threshold of 10 cells.
Its primary pathway SHA-256 is
4994c69f216171bbb7cbc99d9df8ea53aaa16e081ee94680bd1d2b740beeda05.

The Section 8F regeneration V2 manifest records historical expectations:
- Expected SHA-256: 74d1f57d4af03d8eecab55c1656db5d90deeba1fa022443cbd469a8fd09c337b
- Expected pathway cells: 587632

The available Section 8E V2 candidate has SHA-256:
126b9a74f913df8e6f384d4008dde3297a9352830a029ad1d1093c0ed892914f

Its recorded pathway count is 575592 cells. The documented Section 8E
V2 threshold is 12 accumulation cells.

## 2. Interpretation

The original Section 8F provenance and QA records are internally consistent
with each other, but they do not establish equivalence to the available
Section 8E V2 candidate. The V2 manifest retains historical expected hash
and pixel-count values that do not match the candidate.

The difference between the historical expected count (587632) and the
candidate count (575592) is 12040 cells. The historical artifact has not
been recovered and verified.

## 3. Required disposition

1. Preserve original Section 8E, 8F and Section 38R artifacts and manifests.
2. Treat the Section 8E V2 raster as a separately regenerated candidate.
3. Do not rewrite the historical expected hash or count to force a pass.
4. Before downstream regeneration, verify the exact candidate input hash,
   threshold predicate, NoData/domain mask, CRS, transform and dimensions.
5. Regenerate downstream Section 8F products into a new versioned directory
   only after input and mask checks pass.
6. Reconcile Section 38R input lineage separately before any promotion.
7. Keep all D8 products labelled terrain-derived diagnostics, not validated
   subsurface groundwater-flow directions.

## 4. Acceptance criteria

Reconciliation is complete only when the selected upstream raster bytes,
threshold rule, valid-data domain, pathway pixel count, and downstream
input hashes agree across the new versioned manifest and QA report.

Current disposition: NOT FULLY RESOLVED. No historical artifact is promoted
and no frozen scientific raster is modified by this report.
