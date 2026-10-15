# API Contract

This document defines the intended read-only API contract.

It does not claim that the production API has already been deployed.

GET /api/metadata

Returns:

project name
geographic scope
CRS
spatial resolution
scientific target
deployment status
GET /api/layers

Returns the available web layers and their provenance status.

GET /api/layers/{layer_id}

Returns metadata for one layer.

GET /api/provenance

Returns frozen artifact checksums and provenance information.

GET /api/claims

Returns publication-safe claim status, including:

- `groundwater_flow_validation` (boolean; false while independent groundwater-flow validation has not been established).

GET /api/zones

Returns five-zone recharge-potential metadata.

Scientific restrictions

The API must not:

modify frozen scientific rasters
silently replace model versions
retrain models
silently perform new inference
promote Candidate D8
create new management rankings
Real-time

No real-time groundwater prediction claim is established by this API
contract.
