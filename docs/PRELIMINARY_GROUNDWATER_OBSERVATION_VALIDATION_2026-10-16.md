# Preliminary Groundwater Observation Validation

**Date:** 2026-10-16
**Study area:** Mandya District, Karnataka
**Status:** Exploratory analysis; not formal model validation

## 1. Objective

Compare the spatial XGBoost recharge-potential index with independently recorded groundwater-level observations. The analysis evaluates exploratory association only. It does not calibrate recharge probability or establish borewell suitability.

## 2. Observation dataset

The downloaded Karnataka CGWB quarterly manual groundwater-level dataset contained 18,851 records. Filtering by district name yielded:

- 600 Mandya records from 71 station names.
- 593 records with numeric groundwater-level measurements.
- Observation dates from 2021-01-10 to 2024-01-05.
- No duplicate station-date groups in the audit.
- No stations with multiple coordinate pairs in the audit.
- Quarterly observations were available in January, May, August and November, but not for every station or year.

Although the downloaded filename references 2021-2025, the Mandya records inspected here extend only through 2024-01-05. Coverage through 2025 is not established.

The recorded measurement is groundwater level in metres. The May-to-August difference is calculated as August depth minus May depth. Negative values mean the recorded depth became smaller (water became shallower); positive values mean the recorded depth became larger (water became deeper). These changes do not isolate recharge as a cause.

## 3. Spatial alignment and index sampling

The XGBoost recharge-index raster and five-zone raster were inspected as follows:

- CRS: EPSG:32643.
- Pixel resolution: 30 m.
- Dimensions: 3,643 columns by 3,071 rows.
- Index and zone rasters have exactly matching grids and affine transforms.
- Of 71 monitoring stations, 70 returned valid XGBoost index values and one sampled a masked pixel.
- No station coordinate was outside the XGBoost raster.
- Valid sampled index range: 0.3180 to 0.6691.
- Mean sampled index: approximately 0.5030.

The XGBoost output is a dimensionless normalized prediction of the FAHP-derived recharge index. It is not a calibrated probability or a direct measurement of recharge.

## 4. Exploratory seasonal association

For matched station-year pairs, the relationship between the sampled XGBoost index and the May-to-August groundwater-depth change was:

| Analysis | Sample size | Pearson r | Spearman rho |
|---|---:|---:|---:|
| Station-year analysis | 78 pairs | -0.1133 | -0.1548 |
| Station-averaged analysis | 50 stations | -0.2024 | -0.1663 |

For the station-averaged analysis:

- Pearson p-value: 0.1587.
- Spearman p-value: 0.2483.
- 95% station-bootstrap CI for Pearson r: [-0.4602, 0.1554].
- 95% station-bootstrap CI for Spearman rho: [-0.4428, 0.1196].

Both confidence intervals include zero, and both p-values exceed 0.05. The observed association is weak and statistically inconclusive under these analyses.

### Sensitivity analysis

Eight station-year pairs with absolute May-to-August changes of at least 2 m were temporarily excluded as a sensitivity check, not declared erroneous.

| Analysis | Pairs | Stations | Pearson r | Spearman rho |
|---|---:|---:|---:|---:|
| All matched data | 78 | 50 | -0.2024 | -0.1663 |
| Temporarily screened data | 70 | 46 | -0.2032 | -0.2190 |

The weak negative association persists, but remains inconclusive. The screened analysis is a sensitivity check and does not replace the all-data primary result.

## 5. Five-zone raster audit

The five-zone raster shares the exact grid of the XGBoost index raster. Across valid pixels, each class covers approximately 20% of the area.

| Zone | Median XGBoost index |
|---:|---:|
| 1 | 0.42023 |
| 2 | 0.49365 |
| 3 | 0.53809 |
| 4 | 0.57589 |
| 5 | 0.62288 |

The median index increases monotonically from Zone 1 to Zone 5. This verifies the ordinal direction of the percentile classes relative to the index raster. It does not establish hydrogeologic suitability or validate the zones against measured recharge.

The exploratory May-to-August change summary by zone was not consistently monotonic:

| Zone | Stations | Station-year pairs | Mean depth change (m) |
|---:|---:|---:|---:|
| 1 | 16 | 23 | +0.240 |
| 2 | 13 | 23 | +0.033 |
| 3 | 10 | 14 | -0.314 |
| 4 | 8 | 14 | +0.296 |
| 5 | 3 | 4 | -2.587 |

Zone 5 has only three stations and four pairs. These small and uneven groups do not validate a suitability ranking.

## 6. Interpretation and limitations

The current evidence does not establish predictive accuracy for actual groundwater recharge. Important limitations include:

1. Groundwater level is not direct recharge measurement. Seasonal change is affected by rainfall, pumping, geology, local storage and other factors.
2. The association analysis is exploratory and based on a limited station network and observation period.
3. Repeated station-year records are not independent; station-averaged analysis reduces, but does not remove, dependence and confounding concerns.
4. No rainfall or pumping adjustment, formal calibration assessment, spatial holdout test or independent temporal validation was performed here.
5. A sampled raster pixel may not represent the local conditions at the monitoring well. Coordinate accuracy and spatial representativeness should be assessed.
6. The percentile zones represent relative index rank rather than demonstrated recharge suitability.
7. The terrain-derived D8 pathway diagnostic is not independently validated groundwater flow.

## 7. Recommended next work

1. Seek direct recharge observations or defensible independent recharge estimates, where available.
2. Obtain compatible rainfall, abstraction/pumping and hydrogeologic covariates for interpreting groundwater-level changes.
3. Define a pre-registered validation design, including spatial and temporal holdouts and station-level uncertainty.
4. Assess class behaviour with adequate observations across all five zones before making suitability claims.
5. Keep user-facing terminology explicit: normalized recharge-potential index, percentile classes, terrain-derived pathway diagnostic, and field-check advisory.
6. Do not label the index a probability or offer a scientifically validated borewell recommendation unless separate evidence supports those claims.

## 8. Current decision

**Preliminary observation comparison: completed.**
**Scientific validation of the XGBoost recharge index: not established.**
**Calibration as recharge probability: not performed.**
**Validation of five-zone recharge suitability: not established.**
**Validation of terrain-derived pathways as groundwater flow: not established.**
**Borewell-siting recommendation validated by these observations: no.**

This report records exploratory findings and limitations. It does not change model outputs or promote any diagnostic layer to authoritative groundwater-flow status.
