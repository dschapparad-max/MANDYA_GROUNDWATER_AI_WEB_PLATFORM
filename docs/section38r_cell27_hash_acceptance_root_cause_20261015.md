# Section 38R Cell 27 — Hash Acceptance Root Cause

**Date:** 2026-10-15
**Type:** Versioned forensic finding
**Status:** Source-level cause identified; historical raster identity unresolved

## Confirmed source behavior

In `Untitled.ipynb`, cell 27, the `EXPECTED_SECTION8_SHA256["flow_pathway"]` constant is set to:

`4994c69f216171bbb7cbc99d9df8ea53aaa16e081ee94680bd1d2b740beeda05`

This is the SHA-256 of the currently available Section 8E candidate raster.

The documented historical frozen Section 8E checksum is:

`74d1f57d4af03d8eecab55c1656db5d90deeba1fa022443cbd469a8fd09c337b`

These hashes do not match.

The `resolve_exact_frozen_file` function compares a file's actual SHA-256 to the value supplied by its caller. Cell 27 supplies the candidate checksum, so the candidate passes that comparison. The saved message stating that the Section 8E hash was verified proves consistency with the cell's constant, not identity with the historical frozen raster.

## Threshold and population findings

Cell 27's executable constants include:

- `EXPECTED_PATHWAY_THRESHOLD = 10`
- `EXPECTED_PATHWAY_PIXELS_FULL_DOMAIN = 575592`
- `EXPECTED_PATHWAY_PIXELS = 575303`
- `EXPECTED_PATHWAY_AREA_KM2 = 517.7727`

The available Section 8E provenance and threshold-sensitivity records describe a P90 threshold of 12, with 575,592 pathway pixels and 518.0328 km² on the candidate's full domain.

Historical records separately expect 587,632 pixels and 528.8688 km². The original historical raster and an independent original generation result have not been recovered to establish those historical values.

## Disposition

- Section 8C and 8D byte hashes match their upstream QA records.
- Section 8E candidate hash acceptance mechanism: **root cause identified**.
- Historical Section 8E raster identity: **unresolved**.
- Historical pixel-count and area lineage: **unresolved**.
- Section 8F / Section 38R threshold discrepancy (10 versus 12): **open**.
- Section 38R `PASS` does not establish complete authoritative provenance.
- Candidate pathway promotion: **not authorized**.
- Independent groundwater-flow validation: **not established**.

## Preservation requirements

Do not alter the original notebook, checkpoint, frozen rasters, historical checksums, manifests, metrics or prior audit notes to force agreement. Any future correction must be separately versioned and reviewed. Historical recovery requires the original frozen raster or independently verifiable historical evidence.

This addendum documents the source-level finding. It does not recover the historical raster or establish independent hydrological validation.
