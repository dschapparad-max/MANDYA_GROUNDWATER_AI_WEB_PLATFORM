# Git LFS Policy

Large scientific binary assets should not be committed blindly into
normal Git history.

Potential large assets include:

GeoTIFF rasters
model binaries
large raster stacks
large spatial datasets

If such assets must be versioned in GitHub, use Git LFS.

Potential patterns include:

*.tif
*.tiff
*.pkl
*.joblib
*.pt
*.pth
*.keras
*.onnx

Before enabling Git LFS, inspect actual file sizes and repository
storage requirements.

Never commit passwords, API keys, tokens or service-account keys.
