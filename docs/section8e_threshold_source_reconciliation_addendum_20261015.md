# Section 8E Threshold Source Reconciliation Addendum

**Date:** 2026-10-15

**Status:** DOWNSTREAM METADATA ROOT CAUSE IDENTIFIED; HISTORICAL RASTER PROVENANCE UNRESOLVED

## 1. Source-level finding

The existing forensic note `section8F_threshold_source_finding.txt` identifies the original Section 8F workflow constant `PRIMARY_THRESHOLD_CELLS = 10` at cell [8F-3]. The note traces this constant to Section 8F threshold QA [8F-10], summary JSON [8F-25], and provenance JSON [8F-26]. The recorded workflow consumes the Section 8E pathway raster and does not independently recalculate P90 before assigning this metadata value.

The Section 38R source audit separately identifies `EXPECTED_PATHWAY_THRESHOLD = 10` in notebook cell 27.

**Finding:** the downstream metadata discrepancy is explained by hardcoded constants. The existing Section 8F QA pass does not independently establish consistency with the Section 8E P90 threshold.

## 2. Conflicting evidence

The recorded Section 8E provenance specifies P90 of project-domain accumulation, rounded upward, with threshold 12. The available candidate contains 575,592 pathway pixels and has SHA-256:

`4994c69f216171bbb7cbc99d9df8ea53aaa16e081ee94680bd1d2b740beeda05`

This candidate has not been verified as the original frozen artifact. The expected historical SHA-256 remains:

`74d1f57d4af03d8eecab55c1656db5d90deeba1fa022443cbd469a8fd09c337b`

Section 19 records an expected count of 587,632 pixels, 12,040 more than the available candidate count. The original artifact is unavailable for byte-identical verification.

The previous threshold comparison recorded 679,239 cells eligible at accumulation >= 10 versus 575,592 candidate pathway cells at >= 12. This does not prove that the candidate was historically generated using either downstream constant.

Section 38R records 575,303 pathway pixels on its smaller valid domain. The domain difference alone does not prove raster regeneration.

## 3. Controlled disposition

1. Preserve original frozen Section 8F and Section 38R outputs, manifests, and threshold records unchanged.
2. Treat the downstream constant of 10 as the identified source of the metadata discrepancy.
3. Do not claim the original frozen Section 8E raster was recovered.
4. Keep the available candidate non-authoritative and diagnostic-only.
5. Any approved correction must be separately versioned and validated against source hashes, threshold semantics, valid-domain masks, pixel counts, and areas.
6. Do not claim groundwater-flow validation from upstream D8 QA alone.

## 4. Closure criteria

Step 2 requires recovery of the historical artifact or reliable original evidence, plus resolution of the expected pixel-count discrepancy and threshold definition. Step 5 additionally requires independent downstream validation before pathway promotion.

**Final decision:** the metadata root cause is identified. Historical raster identity, the 587,632 versus 575,592 pixel-count discrepancy, and independent groundwater-flow validation remain unresolved.
