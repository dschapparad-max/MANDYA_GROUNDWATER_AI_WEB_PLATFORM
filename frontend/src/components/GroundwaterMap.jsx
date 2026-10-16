import VillageSearch from "./VillageSearch";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const D8_METADATA_URL = "/map-tiles/d8-candidate-v2/metadata.json";
const D8_TILE_URL = "/map-tiles/d8-candidate-v2/{z}/{x}/{y}.png";
const FLOW_DIRECTION_METADATA_URL = "/map-tiles/flow-direction/metadata.json";
const FLOW_DIRECTION_TILE_URL = "/map-tiles/flow-direction/{z}/{x}/{y}.png";
const FLOW_ACCUMULATION_METADATA_URL = "/map-tiles/flow-accumulation/metadata.json";
const FLOW_ACCUMULATION_TILE_URL = "/map-tiles/flow-accumulation/{z}/{x}/{y}.png";

const EXPECTED_FAHP_LAYER_ID = "FAHP_RECHARGE_INDEX";
const EXPECTED_XGBOOST_LAYER_ID = "XGBOOST_RECHARGE_PREDICTION";
const EXPECTED_XGBOOST_ZONES_LAYER_ID = "XGBOOST_FIVE_RECHARGE_ZONES";
const EXPECTED_CNN_GRU_LAYER_ID = "CNN_GRU_RECHARGE_PREDICTION";
const EXPECTED_D8_LAYER_ID = "D8_CANDIDATE_PATHWAY_DIAGNOSTIC";
const EXPECTED_FLOW_DIRECTION_LAYER_ID = "FLOW_DIRECTION_D8";
const EXPECTED_FLOW_ACCUMULATION_LAYER_ID = "FLOW_ACCUMULATION_D8";

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
  showD8Candidate,
  showFlowDirection,
  showFlowAccumulation,
  fahpMetadata,
  xgboostMetadata,
  xgboostZonesMetadata,
  cnnGruMetadata,
  d8Metadata,
  flowDirectionMetadata,
  flowAccumulationMetadata,
  onVillageSelect,
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
    {
      id: "d8-candidate-v2",
      visible: showD8Candidate,
      metadata: d8Metadata,
      url: D8_TILE_URL,
      opacity: 1.0,
      label: "Candidate D8 pathways",
    },
    {
      id: "flow-direction",
      visible: showFlowDirection,
      metadata: flowDirectionMetadata,
      url: FLOW_DIRECTION_TILE_URL,
      opacity: 0.62,
      label: "D8 flow direction codes",
    },
    {
      id: "flow-accumulation",
      visible: showFlowAccumulation,
      metadata: flowAccumulationMetadata,
      url: FLOW_ACCUMULATION_TILE_URL,
      opacity: 0.62,
      label: "D8 flow accumulation",
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

    <VillageSearch onVillageSelect={onVillageSelect} />
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
  showD8Candidate,
  setShowD8Candidate,
  showFlowDirection,
  setShowFlowDirection,
  showFlowAccumulation,
  setShowFlowAccumulation,
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
                setShowD8Candidate(false);
                setShowFlowDirection(false);
                setShowFlowAccumulation(false);
              } else {
                setChecked(false);
              }
            }}
          />
          <span>{label}</span>
        </label>
      ))}

      <label
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
          checked={showD8Candidate}
          onChange={(event) => {
            const enabled = event.target.checked;
            setShowD8Candidate(enabled);
            if (enabled) {
              setShowFahp(false);
              setShowXgboost(false);
              setShowXgboostZones(false);
              setShowCnnGru(false);
              setShowFlowDirection(false);
              setShowFlowAccumulation(false);
            }
          }}
        />
        <span>Candidate D8 pathways (diagnostic)</span>
      </label>

      <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 7, cursor: "pointer" }}>
        <input type="checkbox" checked={showFlowDirection}
          onChange={(event) => {
            const enabled = event.target.checked;
            setShowFlowDirection(enabled);
            if (enabled) {
              setShowFahp(false);
              setShowXgboost(false);
              setShowXgboostZones(false);
              setShowCnnGru(false);
              setShowD8Candidate(false);
              setShowFlowAccumulation(false);
            }
          }} />
        <span>D8 flow direction codes (terrain-derived)</span>
      </label>

      <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 7, cursor: "pointer" }}>
        <input type="checkbox" checked={showFlowAccumulation}
          onChange={(event) => {
            const enabled = event.target.checked;
            setShowFlowAccumulation(enabled);
            if (enabled) {
              setShowFahp(false);
              setShowXgboost(false);
              setShowXgboostZones(false);
              setShowCnnGru(false);
              setShowD8Candidate(false);
              setShowFlowDirection(false);
            }
          }} />
        <span>D8 flow accumulation (terrain-derived)</span>
      </label>

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
    ["1", "Class 1", "rgb(215,48,39)"],
    ["2", "Class 2", "rgb(252,141,89)"],
    ["3", "Class 3", "rgb(254,224,139)"],
    ["4", "Class 4", "rgb(145,207,96)"],
    ["5", "Class 5", "rgb(26,152,80)"],
  ];

  return (
    <div className="gw-legend-card">
      <div style={{ fontWeight: 750, marginBottom: 7 }}>
        XGBoost Recharge-Index Classes
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
        Five percentile-based classes from the XGBoost recharge-index prediction. Class boundaries and class direction are not independently verified for hydrogeologic suitability. Class numbers and display colors are not borewell-suitability rankings.
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
  showD8Candidate,
  showFlowDirection,
  showFlowAccumulation,
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
    showD8Candidate,
    showFlowDirection,
    showFlowAccumulation,
  ].filter(Boolean).length;

  if (visibleCount === 0) return null;

  return (
    <div
      className="gw-legend-container"
      aria-label="Map legend"
      style={{
        ...panelStyle,
        right: 12,
        left: "auto",
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

      {showD8Candidate && (
        <div className="gw-legend-card">
          <div style={{ fontWeight: 750, marginBottom: 5 }}>
            Candidate D8 pathways
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{
              display: "inline-block",
              width: 18,
              height: 12,
              background: "rgb(255,128,0)",
              border: "1px solid rgba(0,0,0,0.2)",
              flex: "0 0 18px",
            }} />
            <span>Topographic diagnostic only; not validated groundwater flow.</span>
          </div>
        </div>
      )}

      {showFlowDirection && (
        <div className="gw-legend-card">
          <div style={{ fontWeight: 750, marginBottom: 5 }}>D8 Flow Direction Codes</div>
          {[
            [0, "rgb(125,125,125)"], [1, "rgb(215,48,39)"],
            [2, "rgb(252,141,89)"], [4, "rgb(254,224,139)"],
            [8, "rgb(145,207,96)"], [16, "rgb(26,152,80)"],
            [32, "rgb(44,123,182)"], [64, "rgb(117,107,177)"],
            [128, "rgb(231,41,138)"],
          ].map(([code, color]) => (
            <div key={code} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
              <span style={{ width: 16, height: 12, background: color, border: "1px solid rgba(0,0,0,0.2)", flex: "0 0 16px" }} />
              <span>Code {code}</span>
            </div>
          ))}
          <div style={{ marginTop: 5, fontSize: 10, color: "#666" }}>
            Terrain-derived codes only. Numeric codes are shown without asserting a compass convention or validated groundwater-flow direction.
          </div>
        </div>
      )}

      {showFlowAccumulation && (
        <div className="gw-legend-card">
          <div style={{ fontWeight: 750, marginBottom: 5 }}>D8 Flow Accumulation</div>
          <div style={{ height: 12, border: "1px solid rgba(0,0,0,0.2)", background: "linear-gradient(to right, rgb(20,45,90), rgb(32,140,160), rgb(95,190,130), rgb(255,215,90), rgb(195,45,35))" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginTop: 4 }}>
            <span>1 cell</span><span>3,124 cells</span>
          </div>
          <div style={{ marginTop: 5, fontSize: 10, color: "#666" }}>
            Upstream contributing-cell count, shown on a logarithmic color scale. Terrain-derived hydrology, not measured groundwater discharge or recharge.
          </div>
        </div>
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
  showD8Candidate,
  showFlowDirection,
  showFlowAccumulation,
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
    showD8Candidate && {
      id: "d8-candidate-v2",
      title: "D8 pathway diagnostic",
      text: "Versioned regenerated terrain-derived pathway mask. It is not independently validated groundwater flow.",
    },
    showFlowDirection && {
      id: "flow-direction",
      title: "D8 flow direction",
      text: "DEM-derived direction codes for terrain drainage. These are not direct or independently validated groundwater-flow observations.",
    },
    showFlowAccumulation && {
      id: "flow-accumulation",
      title: "D8 flow accumulation",
      text: "DEM-derived upstream contributing-cell counts. These are not measured groundwater discharge or recharge.",
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
  const [d8Metadata, setD8Metadata] = useState(null);
  const [flowDirectionMetadata, setFlowDirectionMetadata] = useState(null);
  const [flowAccumulationMetadata, setFlowAccumulationMetadata] = useState(null);
  const [metadataError, setMetadataError] = useState(null);

  const [showFahp, setShowFahp] = useState(true);
  const [showXgboost, setShowXgboost] = useState(false);
  const [showXgboostZones, setShowXgboostZones] = useState(false);
  const [showCnnGru, setShowCnnGru] = useState(false);
  const [showD8Candidate, setShowD8Candidate] = useState(false);
  const [showFlowDirection, setShowFlowDirection] = useState(false);
  const [showFlowAccumulation, setShowFlowAccumulation] = useState(false);

  // Location query state. This samples the existing authoritative rasters only;
  // it does not run inference, modify outputs, or calculate a new suitability score.
  const [latitudeInput, setLatitudeInput] = useState("");
  const [longitudeInput, setLongitudeInput] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState(null);
  const [selectedVillage, setSelectedVillage] = useState(null);
  const farmerPanelRef = useRef(null);

  useEffect(() => {
    if (farmerPanelRef.current) {
      farmerPanelRef.current.scrollTop = 0;
    }
  }, [selectedVillage, queryResult, queryError, queryLoading]);

  const handleVillageSelect = useCallback((village) => {
    setSelectedVillage(village);
    setSelectedLocation(null);
    setQueryResult(null);
    setQueryError(null);
    setLatitudeInput("");
    setLongitudeInput("");
  }, []);

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

        @media (max-width: 768px) {
          /* Separate the two top controls instead of allowing them to overlap. */
          .gw-interpretation-panel {
            top: 8px !important;
            left: 8px !important;
            right: auto !important;
            width: calc(50% - 12px) !important;
            max-width: 180px !important;
            max-height: 19% !important;
            overflow-y: auto !important;
            padding: 7px 8px !important;
            font-size: 9px !important;
            overflow-wrap: anywhere;
          }

          .gw-layer-control {
            top: 8px !important;
            right: 8px !important;
            left: auto !important;
            width: calc(50% - 12px) !important;
            max-width: 180px !important;
            max-height: 24% !important;
            overflow-y: auto !important;
            box-sizing: border-box !important;
            padding: 7px 8px !important;
            font-size: 9px !important;
          }

          /* The coordinate form gets its own middle band. */
          .gw-query-panel {
            top: 27% !important;
            left: 8px !important;
            right: 8px !important;
            width: auto !important;
            max-height: 39% !important;
            overflow-x: hidden !important;
            overflow-y: auto !important;
            box-sizing: border-box !important;
            padding: 8px !important;
            font-size: 10px !important;
          }

          .gw-query-panel p {
            margin: 3px 0 !important;
          }

          .gw-query-panel label {
            margin-bottom: 3px !important;
          }

          .gw-query-panel input {
            width: 100% !important;
            min-height: 30px !important;
            box-sizing: border-box !important;
            font-size: 14px !important;
          }

          .gw-query-panel button {
            min-height: 32px !important;
            font-size: 12px !important;
          }

          /* Legend occupies the bottom-right column beside village search. */
          .gw-legend-container {
            left: auto !important;
            right: 8px !important;
            bottom: 8px !important;
            width: calc(37% - 8px) !important;
            max-width: 160px !important;
            max-height: 34% !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
            overflow-y: auto !important;
            padding: 6px !important;
            font-size: 9px !important;
          }
        }

        @media (max-width: 420px) {
          .gw-interpretation-panel {
            max-height: 18% !important;
            padding: 6px !important;
            font-size: 8px !important;
          }

          .gw-layer-control {
            max-height: 23% !important;
            padding: 6px !important;
            font-size: 9px !important;
          }

          .gw-query-panel {
            top: 27% !important;
            max-height: 39% !important;
          }

          .gw-legend-container {
            width: calc(42% - 8px) !important;
            max-width: calc(42% - 8px) !important;
            max-height: 33% !important;
          }

          .gw-legend-container span {
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            font-size: 10px !important;
          }
        }      `;
      document.head.appendChild(style);
    }
  }, []);

  // Load and validate metadata for all four frozen layers.
  useEffect(() => {
    let cancelled = false;

    async function loadMetadata() {
      try {
        const [fahp, xgboost, xgboostZones, cnnGru, d8Candidate, flowDirection, flowAccumulation] = await Promise.all([
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
          loadLayerMetadata(
            D8_METADATA_URL,
            EXPECTED_D8_LAYER_ID
          ).catch((error) => {
            console.warn("Optional D8 diagnostic layer unavailable:", error);
            return null;
          }),
          loadLayerMetadata(
            FLOW_DIRECTION_METADATA_URL,
            EXPECTED_FLOW_DIRECTION_LAYER_ID
          ).catch((error) => {
            console.warn("Optional flow-direction layer unavailable:", error);
            return null;
          }),
          loadLayerMetadata(
            FLOW_ACCUMULATION_METADATA_URL,
            EXPECTED_FLOW_ACCUMULATION_LAYER_ID
          ).catch((error) => {
            console.warn("Optional flow-accumulation layer unavailable:", error);
            return null;
          }),
        ]);

        if (cancelled) return;

        setFahpMetadata(fahp);
        setXgboostMetadata(xgboost);
        setXgboostZonesMetadata(xgboostZones);
        setCnnGruMetadata(cnnGru);
        setD8Metadata(d8Candidate);
        setFlowDirectionMetadata(flowDirection);
        setFlowAccumulationMetadata(flowAccumulation);
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
      cnnGruMetadata ||
      d8Metadata ||
      flowDirectionMetadata ||
      flowAccumulationMetadata;

    return metadata?.bounds ?? null;
  }, [
    fahpMetadata,
    xgboostMetadata,
    xgboostZonesMetadata,
    cnnGruMetadata,
    d8Metadata,
    flowDirectionMetadata,
    flowAccumulationMetadata,
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
          showD8Candidate={showD8Candidate}
          showFlowDirection={showFlowDirection}
          showFlowAccumulation={showFlowAccumulation}
          fahpMetadata={fahpMetadata}
          xgboostMetadata={xgboostMetadata}
          xgboostZonesMetadata={xgboostZonesMetadata}
          cnnGruMetadata={cnnGruMetadata}
          d8Metadata={d8Metadata}
          flowDirectionMetadata={flowDirectionMetadata}
          flowAccumulationMetadata={flowAccumulationMetadata}
          onVillageSelect={handleVillageSelect}
        />

        <MapExtentController
          bounds={mapBounds}
          selectedLocation={selectedLocation}
        />
      </MapContainer>

      <div
        ref={farmerPanelRef}
        className="gw-query-panel"
        role="region"
        aria-label="Location-based recharge query"
        style={{
          ...panelStyle,
          zIndex: 1100,
          right: "auto",
          left: "35%",
          top: "31%",
          width: "min(340px, calc(100% - 24px))",
          maxHeight: "52%",
          overflowY: "auto",
          padding: 12,
        }}
      >
        <strong>Farmer decision support</strong>
        <p style={{ margin: "6px 0" }}>
          Select a village for reference, then click the exact farm or proposed
          well location on the map, or enter its WGS84 coordinates.
        </p>

        {selectedVillage && (
          <div style={{
            margin: "8px 0",
            padding: "8px",
            borderRadius: 6,
            border: "1px solid #dbe2ea",
            background: "#f8fafc",
          }}>
            <strong>Village reference: {selectedVillage.name}</strong>
            <div>LGD code: {selectedVillage.id || "Unavailable"}</div>
            <small>
              Boundary reference only. Values below apply to the sampled
              coordinate, not to the entire village.
            </small>
          </div>
        )}

        {selectedVillage && !selectedLocation && (
          <p role="status" style={{ margin: "6px 0", color: "#475569" }}>
            No site values have been sampled yet. Click the proposed farm
            location on the map or enter its coordinates.
          </p>
        )}

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

        <details style={{
          marginTop: 10,
          padding: "8px",
          border: "1px solid #dbe2ea",
          borderRadius: 7,
          background: "#f8fafc",
          fontSize: 12,
        }}>
          <summary style={{ cursor: "pointer", fontWeight: 700 }}>
            Before drilling: field-check checklist
          </summary>
          <ol style={{ paddingLeft: 20, marginBottom: 4 }}>
            <li>
              Arrange a site-specific hydrogeological assessment and, where
              appropriate, a qualified geophysical survey.
            </li>
            <li>
              Verify seasonal groundwater levels, nearby well performance,
              local geology and groundwater use with qualified local personnel.
            </li>
            <li>
              Check water-quality requirements and applicable borewell and
              groundwater-extraction permissions with competent authorities.
            </li>
          </ol>
          <p style={{ marginBottom: 0 }}>
            Do not decide to drill from map colour or a modelled index alone.
          </p>
        </details>

        {queryError && (
          <p role="alert" style={{ color: "#a61b1b", marginBottom: 0 }}>
            {queryError}
          </p>
        )}

        {queryResult && (() => {
          const entries = Object.entries(queryResult.results ?? {});
          const availableCount = entries.filter(
            ([, item]) =>
              item?.status === "ok" &&
              item.value !== null &&
              item.value !== undefined
          ).length;

          return (
            <div style={{ marginTop: 10 }} aria-live="polite">
              <div style={{
                padding: "9px",
                border: "1px solid #cbd5e1",
                borderRadius: 7,
                background: "#f8fafc",
              }}>
                <strong>Location sample summary</strong>
                <p style={{ margin: "5px 0" }}>
                  Latitude: {Number(queryResult.coordinates?.latitude).toFixed(6)}
                  <br />
                  Longitude: {Number(queryResult.coordinates?.longitude).toFixed(6)}
                </p>
                <p style={{ margin: "5px 0" }}>
                  Raster values available: <strong>{availableCount} of {entries.length}</strong>
                </p>
                <p style={{ margin: "5px 0 0", fontSize: 11 }}>
                  These are modelled recharge-index values and spatial classes,
                  not measured groundwater levels, guaranteed well yield,
                  water quality or calibrated recharge probabilities.
                </p>
              </div>

              <details style={{ marginTop: 8, padding: "7px 0" }}>
                <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                  View sampled raster values
                </summary>
                {entries.map(([label, item]) => (
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
                      ? (typeof item.value === "number"
                          ? item.value.toLocaleString("en-IN", {
                              maximumFractionDigits: 6,
                            })
                          : String(item.value))
                      : item.status === "nodata"
                        ? "No data at this location"
                        : item.status === "outside_coverage"
                          ? "Outside raster coverage"
                          : "Value unavailable"}
                  </div>
                ))}

                {queryResult.interpretation && (
                  <p style={{ fontSize: 11, color: "#475569" }}>
                    {queryResult.interpretation}
                  </p>
                )}
                {queryResult.disclaimer && (
                  <p style={{ fontSize: 11, color: "#475569" }}>
                    {queryResult.disclaimer}
                  </p>
                )}
              </details>

              <p style={{
                margin: "7px 0 0",
                fontSize: 11,
                color: "#7c2d12",
              }}>
                This panel does not generate a borewell-suitability ranking or
                drilling recommendation. Confirm site conditions in the field.
              </p>
            </div>
          );
        })()}
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
        showD8Candidate={showD8Candidate}
          showFlowDirection={showFlowDirection}
          showFlowAccumulation={showFlowAccumulation}
        setShowD8Candidate={setShowD8Candidate}
        setShowFlowDirection={setShowFlowDirection}
        setShowFlowAccumulation={setShowFlowAccumulation}
      />

      <MapInterpretation
        showFahp={showFahp}
        showXgboost={showXgboost}
        showXgboostZones={showXgboostZones}
        showCnnGru={showCnnGru}
        showD8Candidate={showD8Candidate}
          showFlowDirection={showFlowDirection}
          showFlowAccumulation={showFlowAccumulation}
      />

      <ScientificLegend
        showFahp={showFahp}
        showXgboost={showXgboost}
        showXgboostZones={showXgboostZones}
        showCnnGru={showCnnGru}
        showD8Candidate={showD8Candidate}
          showFlowDirection={showFlowDirection}
          showFlowAccumulation={showFlowAccumulation}
        fahpMetadata={fahpMetadata}
        xgboostMetadata={xgboostMetadata}
        xgboostZonesMetadata={xgboostZonesMetadata}
        cnnGruMetadata={cnnGruMetadata}
      />
    </div>
  );
}
