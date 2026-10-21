# D8 Downstream Independent QA Disposition

Date: 2026-10-22

## Verified checks

- Section 8E V2 accumulation input SHA-256 matched the frozen manifest.
- Section 8E V2 pathway and domain hashes matched their recorded values.
- Grid alignment passed: 3643 x 3071, EPSG:32643.
- Threshold rule accumulation >= 12 reproduced 575592 pathway cells with zero disagreements across the 5497649-cell valid domain.
- Section 8F V2 input hashes and all six output hashes matched its manifest.
- Independent Euclidean distance recomputation had maximum absolute difference 0.0 m.
- Independent distance-band comparison had zero disagreements.
- Integration and high-recharge intersection initially differed at 12 and 1 cells under right=False binning.
- All mismatches were exactly on recorded RF quintile edges. Rechecking with right=True produced zero integration and intersection disagreements.

## Disposition

The Section 8F V2 integration and intersection products match the right-inclusive
quintile boundary convention. No raster correction or regeneration is required
for these checks. The original frozen outputs were preserved.

The historical Section 8E artifact remains unrecovered. Its expected hash
74d1f57d4af03d8eecab55c1656db5d90deeba1fa022443cbd469a8fd09c337b and
expected count 587632 remain unreconciled against the separately regenerated
V2 candidate with 575592 pathway cells.

D8 products remain terrain-derived pathway diagnostics. Independent validation
of subsurface groundwater-flow directions has not been established.

Status: V2 downstream computational QA passed; historical artifact
reconciliation remains open.
