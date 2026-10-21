# Step 3 — AI Model Validation and Comparison

Date: 2026-10-22

## Frozen spatial partition

The Section 38B audit passed for 5,475,833 samples across 250 spatial blocks.
Train: 3,839,466; validation: 858,106; test: 778,261.
Mixed blocks: 0. Duplicate flat indices: 0. Duplicate row/column pairs: 0.
Flat indices agree with row/column-derived indices. No new partition or
spatial reassignment was performed.

Frozen partition SHA-256:
affc8aec0d31eae5d8a82fde6b17e318d4ce9ca03cf34ac0001601ec708ec6fa

## Independent common-test comparison

Population: 778,261 identical geographic test pixels.

| Metric | CNN-GRU | XGBoost |
|---|---:|---:|
| R2 | 0.875434 | 0.912112 |
| RMSE | 0.028692 | 0.024101 |
| MAE | 0.023946 | 0.018788 |
| Bias | -0.005400 | 0.000146 |

XGBoost has better R2, RMSE, and MAE on this frozen common test population.
The target is the FAHP-derived recharge index, not independently measured
groundwater recharge. These metrics are index-emulation metrics.

## Residual diagnostics and reproduction caveat

The recorded CNN-GRU test residual Moran's I is 0.758589 using four-neighbour
rook adjacency among test pixels. The report records a permutation p-value
of 0.005 with 199 permutations. This indicates spatial clustering of residuals;
it does not by itself demonstrate train/test leakage.

Section 38O records 19 exact-value mismatches between Section 38I and 38N
reproduction outputs, with maximum absolute difference 0.0000613034 and
RMSE 0.0000000969. The outputs are numerically close but not bit-identical.
The mismatch remains disclosed.

## Scope and acceptance

The frozen partition's block separation and index uniqueness checks passed.
The saved common-test comparison and residual diagnostics were reviewed.
This does not establish independent physical recharge validation or prove
that every preprocessing step is leakage-free. No new model training, test
split, fine-tuning, or raster regeneration was performed for this report.

Status: Step 3 validation review complete with limitations retained.
