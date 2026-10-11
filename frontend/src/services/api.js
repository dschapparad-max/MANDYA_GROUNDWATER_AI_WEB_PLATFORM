async function apiGet(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

export function getMetadata() {
  return apiGet("/api/metadata");
}

export function getLayers() {
  return apiGet("/api/layers");
}

export function getLayer(layerId) {
  return apiGet(`/api/layers/${encodeURIComponent(layerId)}`);
}

export function getProvenance() {
  return apiGet("/api/provenance");
}

export function getClaims() {
  return apiGet("/api/claims");
}

export function getZones() {
  return apiGet("/api/zones");
}
export async function fetchRasterMetadata(layerId) {
  const response = await fetch(
    `/api/rasters/${encodeURIComponent(layerId)}/metadata`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load raster metadata: ${response.status}`
    );
  }

  return response.json();
}
