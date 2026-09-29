# Frontend

The frontend is intended to provide a map-based groundwater
decision-support interface for Mandya District.

Primary layers
FAHP recharge index
XGBoost recharge-index prediction
XGBoost five-zone recharge map
CNN-GRU recharge-index prediction
Required layer metadata

Each layer should expose:

layer name
source/model
spatial resolution
CRS
provenance status
scientific target
disclaimer
Candidate D8

Candidate D8 must be hidden by default.

If displayed for research diagnostics, it must carry a visible:

NON-AUTHORITATIVE / PROVENANCE-LIMITED

warning.

Unsupported claims prohibited

The frontend must not present:

measured groundwater recharge
real-time groundwater prediction
direct groundwater-flow validation
authoritative D8 pathway

unless future scientific validation explicitly establishes such claims.
