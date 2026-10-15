# Section 8E Provenance Reconciliation Disposition

**Date:** 2026-10-15 19:16:35
**Status:** DISPOSITION RECORDED — HISTORICAL FROZEN ARTIFACT NOT RECOVERED

## Evidence

- Provenance record: `SECTION8E_flow_pathway_provenance.json`.
- Candidate raster SHA-256: `4994c69f216171bbb7cbc99d9df8ea53aaa16e081ee94680bd1d2b740beeda05`.
- The candidate raster is consistent with the P90-derived accumulation threshold of 12.
- The Section 8F and Section 38R metadata records previously audited report threshold 10.
- The previously audited threshold comparison found 575,592 candidate pathway pixels at threshold 12, versus 679,239 eligible cells at threshold 10. The 103,647-cell difference consists of cells at accumulation 10/11 omitted by the candidate.
- Expected historical frozen Section 8E SHA-256: `74d1f57d4af03d8eecab55c1656db5d90deeba1fa022443cbd469a8fd09c337b`. The exact historical artifact has not been recovered or byte-verified.
- The existing recovery and threshold disposition records are retained as supporting evidence:
  - `section8_recovery_manifest_disposition_20261015_152607.txt`
  - `section8_threshold_forensic_disposition_20261015_155107.txt`

## Decision

1. Do not alter the frozen candidate raster, historical checksum manifests, or threshold metadata to force agreement.
2. Do not claim the original frozen Section 8E raster has been recovered.
3. Keep the candidate D8 pathway product **non-authoritative and diagnostic only**. Do not present it as validated groundwater flow or as an authoritative recharge/borewell-suitability layer.
4. Upstream D8 direction and accumulation QA establish routing integrity only; they do not independently validate groundwater-flow direction.
5. Preserve the existing scientific disclaimers and production query safeguards.

## Acceptance conditions for future promotion

Promotion requires recovering the exact historical raster with its expected SHA-256, reconciling threshold 10 versus 12 across the relevant provenance records, and completing independent downstream QA. Until those conditions are met, the candidate remains non-authoritative.

## Scope and limitation

This disposition records the evidence gap and the safe operational decision. It does **not** resolve the historical raster's identity or prove which conflicting threshold was intended by the original frozen workflow.

## Final local recovery search (2026-10-15)

A recursive filename-based search under `C:\Users\bhara\project` examined TIFF files whose names matched Section 8E or primary flow-pathway patterns, excluding `.git`, `node_modules`, and `.venv`.

Results:
- The known candidate raster retains SHA-256 `4994c69f216171bbb7cbc99d9df8ea53aaa16e081ee94680bd1d2b740beeda05`.
- The pathway-area raster and its checkpoint copy have SHA-256 `c0ef33571d45a35c1b73b3e12d58b3ed58d5731c990b1315ffc0e6de075c4327`.
- No searched raster matched the expected historical frozen Section 8E SHA-256 `74d1f57d4af03d8eecab55c1656db5d90deeba1fa022443cbd469a8fd09c337b`.
- No archive with a filename matching Section 8, flow pathway, or frozen artifact was found in the searched workspace.

This was a workspace filename/hash search, not proof that no copy exists on external storage, disconnected drives, or archives with unrelated names.

**Disposition:** the targeted local recovery attempt is complete without recovering the historical artifact. The threshold discrepancy (10 versus 12) remains unresolved. Keep the candidate pathway non-authoritative and diagnostic only. Reopen recovery only if a new, independently identifiable source becomes available.
