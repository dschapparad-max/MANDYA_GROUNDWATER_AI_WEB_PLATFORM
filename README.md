# Mandya District Groundwater AI Decision-Support Platform

## Overview

This repository contains the final publication and deployment package
for the Mandya District groundwater GIS/AI decision-support platform.

The project integrates GIS/remote-sensing thematic factors, FAHP,
spatially independent machine-learning evaluation, XGBoost prediction,
five recharge-potential zones, and hybrid CNN-GRU prediction.

## Geographic scope

Mandya District.

## Spatial reference

- CRS: EPSG:32643
- Resolution: 30 m
- Raster rows: 3071
- Raster columns: 3643

## Scientific target

The current AI target is:

**FAHP-derived groundwater recharge index**

Therefore the preferred scientific wording is:

**AI-based spatial prediction of the FAHP-derived groundwater recharge index**

The AI outputs must not be described as direct measurements of
groundwater recharge.

## Authoritative web layers

The publication package identifies these as authoritative project
outputs:

1. FAHP-derived groundwater recharge index
2. XGBoost recharge-index prediction
3. XGBoost five-zone recharge-potential map
4. CNN-GRU recharge-index prediction

## Candidate D8 pathway

Candidate D8 products remain:

**NON-AUTHORITATIVE / PROVENANCE-LIMITED**

They are not the recovered authoritative Section 8 pathway product.

They must not be described as direct groundwater-flow validation.

## Real-time status

The current deployment package does not establish instantaneous
real-time groundwater prediction.

A future live-data system must be implemented and validated separately.

## Repository architecture

```text
frontend/
backend/
config/
docs/
provenance/
data_manifest/
scripts/
.github/
  workflows/
Scientific raster policy

Large scientific GeoTIFF files are not blindly copied into this
repository.

The repository stores:

metadata
provenance
SHA-256 checksums
deployment configuration
API contracts
publication claim controls
QA workflows

Large scientific binary assets should be separately managed or
versioned with Git LFS when appropriate.

Frozen artifact hashes
FAHP

b30d4aabdd4ebe3a4d41ffe78a768bbb42b4c6ea6707b87a2570c90f920c0dae

XGBoost

8a7731dc61010ceae1cfd93cc1a69e3c6853bff753fa6075822637ac5faa728d

CNN-GRU

194714fe884802263a4fc954626dc4fd4dd4a8cb10413477bad55da2dbc5dc6a

Provenance principle

A frozen scientific artifact must never be silently replaced.

Any future model or raster update requires:

new version identifier
new checksum
source description
validation record
provenance record
Current status

Section 41 is the final GitHub/web deployment package generation
stage following the successful Section 40 web-platform QA.
