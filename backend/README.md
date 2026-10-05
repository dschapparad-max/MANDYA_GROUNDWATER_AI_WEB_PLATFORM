# Mandya Groundwater AI Backend

Read-only FastAPI backend for the verified scientific web-platform
metadata and provenance contract.

## Endpoints

GET /health

GET /api/metadata

GET /api/layers

GET /api/layers/{layer_id}

GET /api/provenance

GET /api/claims

GET /api/zones

## Scientific restrictions

This backend does not:

- train models
- perform new model inference
- modify scientific rasters
- create recharge zones
- create management rankings
- promote Candidate D8
- make real-time groundwater predictions

The backend reads committed project configuration and provenance files.
