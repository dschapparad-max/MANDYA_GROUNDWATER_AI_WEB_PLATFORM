import VillageSearch from "./VillageSearch";
import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// -----------------------------------------------------------------------------
// Frozen scientific raster tile configuration
// -----------------------------------------------------------------------------

const FAHP_METADATA_URL = "/map-tiles/fahp/metadata.json";
const FAHP_TILE_URL = "/map-tiles/fahp/{z}/{x}/{y}.png";

const XGBOOST_METADATA_URL = "/map-tiles/xgboost/metadata.json";
const XGBOOST_TILE_URL = "/map-tiles/xgboost/{z}/{x}/{y}.png";

const XGBOOST_ZONES_METADATA_URL =
  "/map-tiles/xgboost-zones/metadata.json";
const XGBOOST_ZONES_TILE_URL =
  "/map-tiles/xgboost-zones/{z}/{x}/{y}.png";

const CNN_GRU_METADATA_URL = "/map-tiles/cnn-gru/metadata.json";
const CNN_GRU_TILE_URL = "/map-tiles/cnn-gru/{z}/{x}/{y}.png";

const EXPECTED_FAHP_LAYER_ID = "FAHP_RECHARGE_INDEX";
const EXPECTED_XGBOOST_LAYER_ID = "XGBOOST_RECHARGE_PREDICTION";
const EXPECTED_XGBOOST_ZONES_LAYER_ID = "XGBOOST_FIVE_RECHARGE_ZONES";
const EXPECTED_CNN_GRU_LAYER_ID = "CNN_GRU_RECHARGE_PREDICTION";

const DEFAULT_CENTER = [12.636, 76.834];
const DEFAULT_ZOOM = 9;
const MIN_ZOOM = 8;
const MAX_ZOOM = 14;

// -----------------------------------------------------------------------------
// Metadata validation
// -----------------------------------------------------------------------------

async function loadLayerMetadata(url, expectedLayerId) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Unable to load raster metadata: ${url} (${response.status})`
    );
  }

  const metadata = await response.json();

  if (metadata.layer_id !== expectedLayerId) {
    throw new Error(
      `Raster metadata layer mismatch. Expected ${expectedLayerId}, received ${metadata.layer_id}`
    );
  }

  const bounds = metadata.bounds;

  if (
    !bounds ||
    !Number.isFinite(Number(bounds.west)) ||
    !Number.isFinite(Number(bounds.south)) ||
    !Number.isFinite(Number(bounds.east)) ||
    !Number.isFinite(Number(bounds.north))
  ) {
    throw new Error(
      `Invalid geographic bounds in metadata for ${expectedLayerId}`
    );
  }

  return metadata;
}

// -----------------------------------------------------------------------------
// Map extent
// -----------------------------------------------------------------------------

function MapExtentController({ bounds, selectedLocation }) {
  const map = useMap();

  useEffect(() => {
    // A user-selected location takes priority over the initial study-area extent.
    if (selectedLocation) {
      map.flyTo(
        [selectedLocation.lat, selectedLocation.lon],
        MAX_ZOOM,
        { animate: true, duration: 1.2 }
      );
      return;
    }

    if (bounds) {
      map.fitBounds(
        L.latLngBounds(
          [bounds.south, bounds.west],
          [bounds.north, bounds.east]
        ),
        { padding: [20, 20] }
      );
    }
  }, [map, bounds, selectedLocation]);

  return null;
}

// ----------------------------------------------------------------------------
// Location selection: map clicks are queried against the existing frozen rasters
// ----------------------------------------------------------------------------

function LocationClickController({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

// -----------------------------------------------------------------------------
// Scientific raster layers
// -----------------------------------------------------------------------------

function ScientificRasterLayers({
  showFahp,
  showXgboost,
  showXgboostZones,
  showCnnGru,
  fahpMetadata,
  xgboostMetadata,
  xgboostZonesMetadata,
  cnnGruMetadata,
}) {
  const map = useMap();
  const paneName = "scientificRasterPane";

  useEffect(() => {
    let pane = map.getPane(paneName);

    if (!pane) pane = map.createPane(paneName);

    pane.style.zIndex = "450";
    pane.style.pointerEvents = "none";
  }, [map]);

  const layers = [
    {
      id: "fahp",
      visible: showFahp,
      metadata: fahpMetadata,
      url: FAHP_TILE_URL,
      opacity: 0.72,
      label: "FAHP",
    },
    {
      id: "xgboost",
      visible: showXgboost,
      metadata: xgboostMetadata,
      url: XGBOOST_TILE_URL,
      opacity: 0.72,
      label: "XGBoost",
    },
    {
      id: "xgboost-zones",
      visible: showXgboostZones,
      metadata: xgboostZonesMetadata,
      url: XGBOOST_ZONES_TILE_URL,
      opacity: 0.7,
      label: "XGBoost zones",
    },
    {
      id: "cnn-gru",
      visible: showCnnGru,
      metadata: cnnGruMetadata,
      url: CNN_GRU_TILE_URL,
      opacity: 0.72,
      label: "CNN-GRU",
    },
  ];

  
return (
  <>
    {layers.map(
      ({ id, visible, metadata, url, opacity }) =>
        visible &&
        metadata && (
          <TileLayer
            key={`${id}-scientific-raster`}
            url={url}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            bounds={[
              [metadata.bounds.south, metadata.bounds.west],
              [metadata.bounds.north, metadata.bounds.east],
            ]}
            pane={paneName}
            opacity={opacity}
            tileSize={256}
            updateWhenZooming={false}
            updateWhenIdle
          />
        )
    )}

    <VillageSearch />
  </>
);

}

// -----------------------------------------------------------------------------
// Shared panel styles
// -----------------------------------------------------------------------------

const panelStyle = {
  position: "absolute",
  zIndex: 1000,
  boxSizing: "border-box",
  background: "rgba(255,255,255,0.97)",
  border: "1px solid rgba(0,0,0,0.1)",
  borderRadius: "8px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.16)",
  color: "#172033",
  fontSize: "12px",
  lineHeight: 1.45,
};

// -----------------------------------------------------------------------------
// Layer controls
// Enabling one layer automatically disables the other three.
// -----------------------------------------------------------------------------

function ScientificLayerControl({
  showFahp,
  setShowFahp,
  showXgboost,
  setShowXgboost,
  showXgboostZones,
  setShowXgboostZones,
  showCnnGru,
  setShowCnnGru,
}) {
  const controls = [
    ["FAHP Recharge Index", showFahp, setShowFahp],
    ["XGBoost Prediction", showXgboost, setShowXgboost],
    ["XGBoost Recharge Zones", showXgboostZones, setShowXgboostZones],
    ["CNN-GRU Recharge Prediction", showCnnGru, setShowCnnGru],
  ];

  return (
    <div
      className="gw-layer-control"
      style={{
        ...panelStyle,
        top: 12,
        right: 12,
        width: "min(360px, calc(100% - 24px))",
        padding: "12px 14px",
      }}
    >
      <div style={{ fontWeight: 750, fontSize: 13, marginBottom: 9 }}>
        Scientific Layers
      </div>

      {controls.map(([label, checked, setChecked]) => (
        <label
          key={label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 7,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => {
              const enabled = event.target.checked;

              if (enabled) {
                setShowFahp(label === "FAHP Recharge Index");
                setShowXgboost(label === "XGBoost Prediction");
                setShowXgboostZones(label === "XGBoost Recharge Zones");
                setShowCnnGru(label === "CNN-GRU Recharge Prediction");
              } else {
                setChecked(false);
              }
            }}
          />
          <span>{label}</span>
        </label>
      ))}

      <div
        style={{
          marginTop: 8,
          paddingTop: 8,
          borderTop: "1px solid rgba(0,0,0,0.12)",
          fontSize: 11,
          color: "#555",
        }}
      >
        Frozen scientific products. No frontend reclassification or model
        inference is performed.
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Legend cards
// -----------------------------------------------------------------------------

function ContinuousLegend({ title, metadata }) {
  if (!metadata) return null;

  return (
    <div className="gw-legend-card">
      <div style={{ fontWeight: 750, marginBottom: 5 }}>{title}</div>

      <div
        style={{
          width: "100%",
          height: 12,
          background: "linear-gradient(to right, red, yellow, green)",
          border: "1px solid rgba(0,0,0,0.2)",
          boxSizing: "border-box",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 3,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <span>{Number(metadata.min).toFixed(4)}</span>
        <span>{Number(metadata.max).toFixed(4)}</span>
      </div>
    </div>
  );
}

function XgboostZonesLegend({ metadata }) {
  if (!metadata) return null;

  const zones = [
    ["1", "Very Low", "rgb(215,48,39)"],
    ["2", "Low", "rgb(252,141,89)"],
    ["3", "Moderate", "rgb(254,224,139)"],
    ["4", "High", "rgb(145,207,96)"],
    ["5", "Very High", "rgb(26,152,80)"],
  ];

  return (
    <div className="gw-legend-card">
      <div style={{ fontWeight: 750, marginBottom: 7 }}>
        XGBoost Recharge Potential Zones
      </div>

      {zones.map(([zone, label, color]) => (
        <div
          key={zone}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginBottom: 4,
          }}
        >
          <span
            style={{
              width: 18,
              height: 13,
              flex: "0 0 18px",
              background: color,
              border: "1px solid rgba(0,0,0,0.22)",
              boxSizing: "border-box",
            }}
          />
          <span>
            Zone {zone} — {label}
          </span>
        </div>
      ))}

      <div style={{ marginTop: 5, fontSize: 10, color: "#666" }}>
        Frozen five percentile-based spatial zones from the final XGBoost
        prediction.
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Separate legend region: no longer shares the interpretation panel's space
// -----------------------------------------------------------------------------

function ScientificLegend({
  showFahp,
  showXgboost,
  showXgboostZones,
  showCnnGru,
  fahpMetadata,
  xgboostMetadata,
  xgboostZonesMetadata,
  cnnGruMetadata,
}) {
  const visibleCount = [
    showFahp,
    showXgboost,
    showXgboostZones,
    showCnnGru,
  ].filter(Boolean).length;

  if (visibleCount === 0) return null;

  return (
    <div
      className="gw-legend-container"
      aria-label="Map legend"
      style={{
        ...panelStyle,
        left: 12,
        bottom: 12,
        width: "min(280px, calc(100% - 24px))",
        maxHeight: "32%",
        overflowY: "auto",
        overflowX: "hidden",
        padding: 8,
        display: "flex",
        flexDirection: "column",
        gap: 7,
        overscrollBehavior: "contain",
      }}
    >
      {showFahp && (
        <ContinuousLegend
          title="FAHP Recharge Index"
          metadata={fahpMetadata}
        />
      )}

      {showXgboost && (
        <ContinuousLegend
          title="XGBoost Recharge-Index Prediction"
          metadata={xgboostMetadata}
        />
      )}

      {showXgboostZones && (
        <XgboostZonesLegend metadata={xgboostZonesMetadata} />
      )}

      {showCnnGru && (
        <ContinuousLegend
          title="CNN-GRU Recharge-Index Prediction"
          metadata={cnnGruMetadata}
        />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Compact interpretation region
// -----------------------------------------------------------------------------

function MapInterpretation({
  showFahp,
  showXgboost,
  showXgboostZones,
  showCnnGru,
}) {
  const descriptions = [
    showFahp && {
      id: "fahp",
      title: "FAHP",
      text: "GIS/FAHP-derived groundwater recharge potential index.",
    },
    showXgboost && {
      id: "xgboost",
      title: "XGBoost",
      text: "AI-based spatial prediction of the FAHP-derived groundwater recharge index.",
    },
    showXgboostZones && {
      id: "zones",
      title: "XGBoost zones",
      text: "Frozen five percentile-based spatial zones derived from the final XGBoost prediction.",
    },
    showCnnGru && {
      id: "cnn-gru",
      title: "CNN-GRU",
      text: "AI-based spatial prediction of the FAHP-derived groundwater recharge index using the frozen CNN-GRU model.",
    },
  ].filter(Boolean);

  return (
    <div
      className="gw-interpretation-panel"
      style={{
        ...panelStyle,
        top: 12,
        left: 12,
        width: "min(300px, calc(100% - 24px))",
        maxHeight: "25%",
        overflowY: "auto",
        padding: "10px 12px",
        overscrollBehavior: "contain",
      }}
    >
      <div style={{ fontWeight: 750, marginBottom: 6 }}>
        Groundwater Recharge Decision Support
      </div>

      {descriptions.length === 0 ? (
        <div style={{ color: "#555" }}>
          Enable a scientific layer to view its interpretation.
        </div>
      ) : (
        descriptions.map((item) => (
          <div key={item.id} style={{ marginBottom: 5 }}>
            <strong>{item.title}:</strong> {item.text}
          </div>
        ))
      )}

      <div
        style={{
          marginTop: 6,
          paddingTop: 6,
          borderTop: "1px solid rgba(0,0,0,0.12)",
          color: "#555",
          fontSize: 10.5,
        }}
      >
        AI outputs represent spatial prediction of the FAHP-derived groundwater
        recharge index. They are not direct measurements of groundwater
        recharge.
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main map
// -----------------------------------------------------------------------------

export default function GroundwaterMap() {
  const [fahpMetadata, setFahpMetadata] = useState(null);
  const [xgboostMetadata, setXgboostMetadata] = useState(null);
  const [xgboostZonesMetadata, setXgboostZonesMetadata] = useState(null);
  const [cnnGruMetadata, setCnnGruMetadata] = useState(null);
  const [metadataError, setMetadataError] = useState(null);

  const [showFahp, setShowFahp] = useState(true);
  const [showXgboost, setShowXgboost] = useState(false);
  const [showXgboostZones, setShowXgboostZones] = useState(false);
  const [showCnnGru, setShowCnnGru] = useState(false);

  // Location query state. This samples the existing authoritative rasters only;
  // it does not run inference, modify outputs, or calculate a new suitability score.
  const [latitudeInput, setLatitudeInput] = useState("");
  const [longitudeInput, setLongitudeInput] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState(null);

  async function queryLocation(latitude, longitude) {
    if (String(latitude).trim() === "" || String(longitude).trim() === "") {
      setQueryError("Enter both latitude and longitude.");
      return;
    }

    const lat = Number(latitude);
    const lon = Number(longitude);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      setQueryError("Enter valid WGS84 latitude and longitude values.");
      return;
    }

    setLatitudeInput(lat.toFixed(6));
    setLongitudeInput(lon.toFixed(6));
    setSelectedLocation({ lat, lon });
    setQueryResult(null);
    setQueryError(null);
    setQueryLoading(true);

    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
      });
      const response = await fetch(`/api/raster-query?${params.toString()}`);
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const detail = payload?.detail;
        throw new Error(
          typeof detail === "string"
            ? detail
            : `Location query failed (${response.status}).`
        );
      }

      if (!payload || typeof payload.results !== "object") {
        throw new Error("The location API returned an unexpected response.");
      }

      setQueryResult(payload);
    } catch (error) {
      setQueryError(error.message || "Unable to query this location.");
    } finally {
      setQueryLoading(false);
    }
  }

  // Layout fixes, including small-screen sizing.
  useEffect(() => {
    const styleId = "groundwater-map-layout-fixes";
    let style = document.getElementById(styleId);

    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .gw-legend-card {
          box-sizing: border-box;
          flex: 0 0 auto;
          padding: 8px 10px;
          background: rgba(255,255,255,0.98);
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 6px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          font-size: 11px;
          overflow-wrap: anywhere;
        }

        @media (max-width: 640px) {
          .gw-layer-control {
            top: 8px !important;
            right: 8px !important;
            width: min(250px, calc(100% - 16px)) !important;
            padding: 8px 10px !important;
            font-size: 10px !important;
          }

          .gw-interpretation-panel {
            top: 8px !important;
            left: 8px !important;
            width: min(200px, calc(100% - 16px)) !important;
            max-height: 20% !important;
            padding: 7px 8px !important;
            font-size: 9px !important;
          }

          .gw-legend-container {
            left: 8px !important;
            bottom: 8px !important;
            width: min(220px, calc(100% - 16px)) !important;
            max-height: 28% !important;
          }

          .gw-query-panel {
            right: 8px !important;
            top: 42% !important;
            width: min(220px, calc(100% - 16px)) !important;
            max-height: 30% !important;
            padding: 8px !important;
            font-size: 10px !important;
          }

          .gw-query-panel input {
            font-size: 12px !important;
            min-height: 28px;
          }

          .gw-query-panel button {
            font-size: 11px !important;
            min-height: 32px;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Load and validate metadata for all four frozen layers.
  useEffect(() => {
    let cancelled = false;

    async function loadMetadata() {
      try {
        const [fahp, xgboost, xgboostZones, cnnGru] = await Promise.all([
          loadLayerMetadata(FAHP_METADATA_URL, EXPECTED_FAHP_LAYER_ID),
          loadLayerMetadata(
            XGBOOST_METADATA_URL,
            EXPECTED_XGBOOST_LAYER_ID
          ),
          loadLayerMetadata(
            XGBOOST_ZONES_METADATA_URL,
            EXPECTED_XGBOOST_ZONES_LAYER_ID
          ),
          loadLayerMetadata(
            CNN_GRU_METADATA_URL,
            EXPECTED_CNN_GRU_LAYER_ID
          ),
        ]);

        if (cancelled) return;

        setFahpMetadata(fahp);
        setXgboostMetadata(xgboost);
        setXgboostZonesMetadata(xgboostZones);
        setCnnGruMetadata(cnnGru);
        setMetadataError(null);
      } catch (error) {
        if (cancelled) return;

        console.error("Scientific layer metadata loading failed:", error);
        setMetadataError(
          error.message || "Unable to load scientific layer metadata."
        );
      }
    }

    loadMetadata();

    return () => {
      cancelled = true;
    };
  }, []);

  const mapBounds = useMemo(() => {
    const metadata =
      fahpMetadata ||
      xgboostMetadata ||
      xgboostZonesMetadata ||
      cnnGruMetadata;

    return metadata?.bounds ?? null;
  }, [
    fahpMetadata,
    xgboostMetadata,
    xgboostZonesMetadata,
    cnnGruMetadata,
  ]);

  if (metadataError) {
    return (
      <div
        style={{
          padding: 18,
          borderRadius: 8,
          background: "#fff4f4",
          border: "1px solid #e0a0a0",
          color: "#7a2020",
          fontSize: 13,
        }}
      >
        <strong>Scientific map configuration error</strong>
        <div style={{ marginTop: 6 }}>{metadataError}</div>
      </div>
    );
  }

  return (
    <div
      className="groundwater-map-root"
      style={{
        position: "relative",
        isolation: "isolate",
        width: "100%",
        height: "100%",
        minHeight: 520,
        overflow: "hidden",
        borderRadius: 6,
      }}
    >
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        style={{ width: "100%", height: "100%", minHeight: 520 }}
        scrollWheelZoom
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <LocationClickController
          onSelect={(lat, lon) => {
            void queryLocation(lat, lon);
          }}
        />
     
        {selectedLocation && (
          <CircleMarker
            center={[selectedLocation.lat, selectedLocation.lon]}
            radius={7}
            pathOptions={{
              color: "#ffffff",
              weight: 2,
              fillColor: "#d73027",
              fillOpacity: 1,
            }}
          >
            <Popup>
              <strong>Selected location</strong>
              <br />
              Latitude: {selectedLocation.lat.toFixed(6)}
              <br />
              Longitude: {selectedLocation.lon.toFixed(6)}
            </Popup>
          </CircleMarker>
        )}

        <ScientificRasterLayers
          showFahp={showFahp}
          showXgboost={showXgboost}
          showXgboostZones={showXgboostZones}
          showCnnGru={showCnnGru}
          fahpMetadata={fahpMetadata}
          xgboostMetadata={xgboostMetadata}
          xgboostZonesMetadata={xgboostZonesMetadata}
          cnnGruMetadata={cnnGruMetadata}
        />

        <MapExtentController
          bounds={mapBounds}
          selectedLocation={selectedLocation}
        />
      </MapContainer>

      <div
        className="gw-query-panel"
        role="region"
        aria-label="Location-based recharge query"
        style={{
          ...panelStyle,
          zIndex: 1100,
          right: 12,
          top: "42%",
          width: "min(300px, calc(100% - 24px))",
          maxHeight: "38%",
          overflowY: "auto",
          padding: 12,
        }}
      >
        <strong>Location query</strong>
        <p style={{ margin: "6px 0" }}>
          Click the map or enter latitude and longitude (WGS84).
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void queryLocation(latitudeInput, longitudeInput);
          }}
        >
          <label style={{ display: "block", marginBottom: 6 }}>
            Latitude
            <input
              type="number"
              step="any"
              min="-90"
              max="90"
              required
              value={latitudeInput}
              onChange={(event) => setLatitudeInput(event.target.value)}
              aria-label="Latitude in decimal degrees"
              style={{
                display: "block",
                width: "100%",
                minHeight: 30,
                boxSizing: "border-box",
              }}
            />
          </label>

          <label style={{ display: "block", marginBottom: 6 }}>
            Longitude
            <input
              type="number"
              step="any"
              min="-180"
              max="180"
              required
              value={longitudeInput}
              onChange={(event) => setLongitudeInput(event.target.value)}
              aria-label="Longitude in decimal degrees"
              style={{
                display: "block",
                width: "100%",
                minHeight: 30,
                boxSizing: "border-box",
              }}
            />
          </label>

          <button
            type="submit"
            disabled={queryLoading}
            style={{
              marginTop: 3,
              padding: "7px 10px",
              cursor: queryLoading ? "wait" : "pointer",
            }}
          >
            {queryLoading ? "Querying rasters..." : "Check location"}
          </button>
        </form>

        {queryError && (
          <p role="alert" style={{ color: "#a61b1b", marginBottom: 0 }}>
            {queryError}
          </p>
        )}

        {queryResult && (
          <div style={{ marginTop: 10 }} aria-live="polite">
            <strong>Results for selected location</strong>
            {Object.entries(queryResult.results).map(([label, item]) => (
              <div
                key={label}
                style={{
                  borderTop: "1px solid #ddd",
                  padding: "6px 0",
                  overflowWrap: "anywhere",
                }}
              >
                <strong>{label}</strong>
                <br />
                {item.status === "ok"
                  ? item.value
                  : item.status === "nodata"
                    ? "NoData at this location"
                    : item.status === "outside_coverage"
                      ? "Outside raster coverage"
                      : "Value unavailable"}
              </div>
            ))}

            {queryResult.interpretation && (
              <p style={{ fontSize: 10, color: "#555" }}>
                {queryResult.interpretation}
              </p>
            )}
            {queryResult.disclaimer && (
              <p style={{ fontSize: 10, color: "#555" }}>
                {queryResult.disclaimer}
              </p>
            )}
          </div>
        )}
      </div>

      <ScientificLayerControl
        showFahp={showFahp}
        setShowFahp={setShowFahp}
        showXgboost={showXgboost}
        setShowXgboost={setShowXgboost}
        showXgboostZones={showXgboostZones}
        setShowXgboostZones={setShowXgboostZones}
        showCnnGru={showCnnGru}
        setShowCnnGru={setShowCnnGru}
      />

      <MapInterpretation
        showFahp={showFahp}
        showXgboost={showXgboost}
        showXgboostZones={showXgboostZones}
        showCnnGru={showCnnGru}
      />

      <ScientificLegend
        showFahp={showFahp}
        showXgboost={showXgboost}
        showXgboostZones={showXgboostZones}
        showCnnGru={showCnnGru}
        fahpMetadata={fahpMetadata}
        xgboostMetadata={xgboostMetadata}
        xgboostZonesMetadata={xgboostZonesMetadata}
        cnnGruMetadata={cnnGruMetadata}
      />
    </div>
  );
}
