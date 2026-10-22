# Section 41 — Deployment Acceptance Record

**Date:** 2026-10-22  
**Project:** Mandya District Groundwater AI Decision-Support Platform  
**Acceptance status:** Deployment checks passed as reported by the project operator.

## 1. Deployment checks

- Backend health endpoint `/health`: PASS.
- Location-specific raster query: PASS; six result layers returned.
- API metadata endpoint `/api/metadata`: PASS; both hydrology diagnostic layers registered.
- Claims endpoint `/api/claims`: inspected; scientific safeguards remain present.
- Frontend acceptance: PASS as reported by the project operator.

## 2. Location-query layers

1. FAHP recharge index.
2. XGBoost predicted recharge index.
3. XGBoost five-zone class.
4. CNN-GRU predicted recharge index.
5. Terrain-derived D8 direction code.
6. Distance to terrain-derived flow pathways (m).

## 3. D8 encoding

The supplied Section 8C direction-frequency report documents:

- 0: No direction / outlet
- 1: East
- 2: Southeast
- 4: South
- 8: Southwest
- 16: West
- 32: Northwest
- 64: North
- 128: Northeast

The direction layer is a terrain-derived diagnostic and is not independent validation of subsurface groundwater flow.

## 4. Scientific limitations that remain open

- The documented 10-versus-12-cell pathway-threshold provenance discrepancy remains unresolved.
- Independent groundwater and field validation is incomplete.
- Recharge-index outputs are not calibrated recharge probabilities.
- Pathway distance is not verified distance to mapped streams.
- Borewell suitability and groundwater-flow claims require appropriate independent evidence.

## 5. Interpretation

This record documents deployment and interface acceptance only. It does not certify independent hydrological validation, field performance, or guaranteed borewell success. Frozen scientific outputs and their provenance records must remain unchanged unless a formally reviewed correction is approved.

## 6. Evidence references

- Backend query-layer commit: `b181c76`
- API metadata registration commit: `df06417`
- Live endpoints checked: `/health`, `/api/metadata`, `/api/raster-query`, `/api/claims`
- Acceptance date: 2026-10-22

**Record status:** Deployment acceptance recorded; scientific validation remains open.

## Final Deployment Verification — 23 October 2026

### Verified checks
- Backend health endpoint: PASS.
- Frontend deployment and functional smoke tests: PASS.
- CORS preflight for the deployed frontend origin: PASS (HTTP 200).
- Git branch synchronization: PASS (`main` aligned with `origin/main`).
- Authoritative raster checksum verification: previously completed and matched frozen expected hashes.

### Outstanding limitations
- Independent scientific validation of groundwater recharge predictions remains pending.
- D8 terrain-derived pathways are diagnostic proxies, not verified subsurface groundwater flow.
- Five recharge zones are not independently validated borewell-suitability rankings.
- Independent field assessment is required before operational borewell-siting decisions.
- Full production security review and farmer pilot readiness are not yet certified.

### Acceptance status
Deployment and functional verification: PASS.
Scientific field validation: PENDING.
Full production security and pilot certification: PENDING.

### Final Test Run
- Backend tests: 15 passed; 4 subtests passed in 1.83 seconds.
- Backend health, API metadata, and frontend reachability: HTTP 200.
- CORS preflight: HTTP 200 for the deployed frontend origin.
- Farmer-facing safeguards: reviewed and present.
- Independent scientific validation: pending.
- Full production security review and farmer pilot certification: pending.

## Remaining Roadmap Actions

1. Verified flow and field validation:
   Independent groundwater and field validation remains pending.
   D8 terrain-derived routing is diagnostic, not verified subsurface flow.

2. Farmer-facing decision support:
   Live functional checks and safeguards review passed.
   Maintain existing scientific disclaimers and before-drilling checklist.

3. Production security and pilot:
   Deployment, backend health, API metadata, CORS and frontend checks passed.
   Complete the full security review and obtain approval before a farmer pilot.

Overall: deployment verified; scientific validation and full security/pilot certification pending.

## Final Live Deployment Verification

Date: 2026-10-23

- Backend health endpoint: PASS (HTTP 200)
- API metadata endpoint: PASS (HTTP 200)
- Frontend deployment: PASS (HTTP 200)

These checks confirm that the listed endpoints responded successfully at verification time. They do not establish complete security certification or scientific field validation.

Remaining actions:
1. Independent groundwater/flow validation using reliable field observations or reference records.
2. Complete production security review and document findings.
3. Conduct a farmer pilot and document feedback before claiming pilot validation.

Scientific limitation: Modelled recharge indices are not direct groundwater measurements. D8 terrain routing does not verify underground flow. Borewell decisions require independent field assessment.


## Final Software Acceptance Update — 2026-10-23

### Deployment and functional verification

- Backend health endpoint: PASS — HTTP 200
- API metadata endpoint: PASS — HTTP 200
- Frontend availability: PASS — HTTP 200
- Backend automated tests: PASS — 15 passed, 4 subtests passed
- Frontend dependency audit: PASS — 0 vulnerabilities found
- Map loading and layer toggles: PASS — user-confirmed
- Village search: PASS — user-confirmed
- Farmer advisory: PASS — user-confirmed

### Outstanding acceptance conditions

- Independent groundwater and flow validation: PENDING
- Full production security review: PENDING
- Farmer pilot and feedback: PENDING

### Scientific limitations

Modelled recharge indices are not measured groundwater recharge. D8 terrain routing does not establish underground flow direction. Borewell decisions require independent field and hydrogeological assessment.

Conclusion: Software deployment and the listed functional checks passed. Scientific validation, full security sign-off, and farmer pilot completion are not yet certified.


