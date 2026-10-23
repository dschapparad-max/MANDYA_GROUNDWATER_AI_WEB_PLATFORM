import { apiUrl } from "../services/api";
import VillageSearch from "./VillageSearch";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Marker,
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
const D8_STREAMS_GEOJSON_URL = "/data/d8_terrain_streams.geojson";
const D8_STREAM_THRESHOLD_CELLS = 5000;
const FLOW_ACCUMULATION_METADATA_URL = "/map-tiles/flow-accumulation/metadata.json";
const FLOW_ACCUMULATION_TILE_URL = "/map-tiles/flow-accumulation/{z}/{x}/{y}.png";

const EXPECTED_FAHP_LAYER_ID = "FAHP_RECHARGE_INDEX";
const EXPECTED_XGBOOST_LAYER_ID = "XGBOOST_RECHARGE_PREDICTION";
const EXPECTED_XGBOOST_ZONES_LAYER_ID = "XGBOOST_FIVE_RECHARGE_ZONES";
const EXPECTED_CNN_GRU_LAYER_ID = "CNN_GRU_RECHARGE_PREDICTION";
const EXPECTED_D8_LAYER_ID = "D8_CANDIDATE_PATHWAY_DIAGNOSTIC";
const EXPECTED_FLOW_ACCUMULATION_LAYER_ID = "FLOW_ACCUMULATION_D8";

const DEFAULT_CENTER = [12.636, 76.834];
const DEFAULT_ZOOM = 9;
const MIN_ZOOM = 8;
const RASTER_MAX_ZOOM = 14;
const MAP_MAX_ZOOM = 19;
const LOCATION_ZOOM = 18;

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
        LOCATION_ZOOM,
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
// Connected D8 stream-like linework
// -----------------------------------------------------------------------------

function d8StreamWeight(feature) {
  const cells = Number(feature?.properties?.max_contributing_cells ?? D8_STREAM_THRESHOLD_CELLS);
  if (cells >= 100000) return 4.0;
  if (cells >= 30000) return 3.1;
  if (cells >= 10000) return 2.4;
  return 1.6;
}

function TerrainD8StreamLayer({ visible }) {
  const [streamData, setStreamData] = useState(null);
  const [streamError, setStreamError] = useState(null);

  useEffect(() => {
    if (!visible || streamData) return undefined;
    let cancelled = false;

    async function loadStreamNetwork() {
      try {
        const response = await fetch(D8_STREAMS_GEOJSON_URL, { cache: "force-cache" });
        if (!response.ok) {
          throw new Error(
            `D8 stream data could not be loaded (${response.status}). Ensure frontend/public/data/d8_terrain_streams.geojson is installed.`
          );
        }
        const payload = await response.json();
        if (
          payload?.type !== "FeatureCollection" ||
          !Array.isArray(payload.features)
        ) {
          throw new Error("The D8 stream asset is not a valid GeoJSON FeatureCollection.");
        }
        if (!cancelled) {
          setStreamData(payload);
          setStreamError(null);
        }
      } catch (error) {
        if (!cancelled) setStreamError(error.message || "Unable to load D8 stream paths.");
      }
    }

    loadStreamNetwork();
    return () => {
      cancelled = true;
    };
  }, [visible, streamData]);

  useEffect(() => {
    if (visible && streamError) {
      console.error("Terrain-derived D8 stream layer:", streamError);
    }
  }, [visible, streamError]);

  const flowArrows = useMemo(() => {
    const features = streamData?.features ?? [];
    return features.flatMap((feature, index) => {
      const coordinates = feature?.geometry?.coordinates;
      const accumulation = Number(feature?.properties?.max_contributing_cells ?? 0);
      // Arrowheads are reserved for larger paths to communicate direction without
      // filling the smaller tributaries with markers.
      if (
        feature?.geometry?.type !== "LineString" ||
        !Array.isArray(coordinates) ||
        coordinates.length < 3 ||
        accumulation < 100000
      ) return [];

      const pointIndex = Math.max(
        0,
        Math.min(coordinates.length - 2, Math.floor((coordinates.length - 1) * 0.65))
      );
      const start = coordinates[pointIndex];
      const end = coordinates[pointIndex + 1];
      const dx = Number(end[0]) - Number(start[0]);
      const dy = Number(end[1]) - Number(start[1]);
      if ((!dx && !dy) || !Number.isFinite(dx) || !Number.isFinite(dy)) return [];
      // GeoJSON lines run upstream-to-downstream; flip latitude's sign for screen Y.
      const angle = Math.atan2(-dy, dx) * (180 / Math.PI);
      const html = `<svg width="18" height="18" viewBox="0 0 20 20" style="transform:rotate(${angle}deg);overflow:visible" aria-hidden="true"><path d="M2 10 L16 10 M10 4 L16 10 L10 16" fill="none" stroke="#f5fbff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 10 L16 10 M10 4 L16 10 L10 16" fill="none" stroke="#0b5f95" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      return [{
        key: `d8-flow-arrow-${index}`,
        position: [Number(start[1]), Number(start[0])],
        icon: L.divIcon({ className: "gw-d8-flow-arrow-icon", html, iconSize: [18, 18], iconAnchor: [9, 9] }),
      }];
    });
  }, [streamData]);

  if (!visible || !streamData) return null;

  // A pale casing plus a blue inner stroke keeps the river-like pathways legible
  // over the OpenStreetMap basemap. This styling does not alter D8 values.
  const outlineStyle = (feature) => ({
    pane: "terrainDiagnosticPane",
    color: "#f5fbff",
    weight: d8StreamWeight(feature) + 2.3,
    opacity: 0.98,
    lineCap: "round",
    lineJoin: "round",
    fill: false,
  });
  const streamStyle = (feature) => ({
    pane: "terrainDiagnosticPane",
    color: "#1269a8",
    weight: d8StreamWeight(feature),
    opacity: 0.97,
    lineCap: "round",
    lineJoin: "round",
    fill: false,
  });

  return (
    <>
      <GeoJSON
        key="d8-stream-network-outline"
        data={streamData}
        pane="terrainDiagnosticPane"
        style={outlineStyle}
      />
      <GeoJSON
        key="d8-stream-network-lines"
        data={streamData}
        pane="terrainDiagnosticPane"
        style={streamStyle}
      />
      {flowArrows.map((arrow) => (
        <Marker
          key={arrow.key}
          position={arrow.position}
          icon={arrow.icon}
          pane="terrainDiagnosticPane"
          interactive={false}
          keyboard={false}
        />
      ))}
    </>
  );
}

// -----------------------------------------------------------------------------
// Scientific raster layers
// -----------------------------------------------------------------------------

function ScientificRasterLayers({
  showRechargeRaster,
  showD8Streams,
  fahpMetadata,
  xgboostMetadata,
  xgboostZonesMetadata,
  cnnGruMetadata,
  onVillageSelect,
}) {
  const map = useMap();
  const basePaneName = "scientificBaseRasterPane";
  const diagnosticPaneName = "terrainDiagnosticPane";

  useEffect(() => {
    let basePane = map.getPane(basePaneName);
    if (!basePane) basePane = map.createPane(basePaneName);
    basePane.style.zIndex = "410";
    basePane.style.pointerEvents = "none";

    let diagnosticPane = map.getPane(diagnosticPaneName);
    if (!diagnosticPane) diagnosticPane = map.createPane(diagnosticPaneName);
    diagnosticPane.style.zIndex = "460";
    diagnosticPane.style.pointerEvents = "none";
  }, [map]);

  // One UI checkbox controls the complete recharge-product group. All four
  // frozen products are drawn together; transparency preserves visibility of
  // the underlying FAHP colors. This is a visual comparison overlay, not a new
  // mathematically fused recharge score. D8 streamlines use their own checkbox.
  const layers = [
    {
      id: "fahp",
      metadata: fahpMetadata,
      url: FAHP_TILE_URL,
      opacity: 0.48,
      label: "FAHP recharge index",
    },
    {
      id: "cnn-gru",
      metadata: cnnGruMetadata,
      url: CNN_GRU_TILE_URL,
      opacity: 0.34,
      label: "CNN-GRU recharge-index prediction",
    },
    {
      id: "xgboost",
      metadata: xgboostMetadata,
      url: XGBOOST_TILE_URL,
      opacity: 0.34,
      label: "XGBoost recharge-index prediction",
    },
    {
      id: "xgboost-zones",
      metadata: xgboostZonesMetadata,
      url: XGBOOST_ZONES_TILE_URL,
      opacity: 0.82,
      label: "XGBoost recharge zones",
    },
  ];

  return (
    <>
      {showRechargeRaster && layers.map(({ id, metadata, url, opacity }) => {
        if (!metadata) return null;

        return (
          <TileLayer
            key={`${id}-scientific-raster`}
            url={url}
            className={`gw-recharge-raster-tile gw-recharge-raster-${id}`}
            minZoom={MIN_ZOOM}
            maxNativeZoom={RASTER_MAX_ZOOM}
            maxZoom={MAP_MAX_ZOOM}
            bounds={[
              [metadata.bounds.south, metadata.bounds.west],
              [metadata.bounds.north, metadata.bounds.east],
            ]}
            pane={basePaneName}
            opacity={opacity}
            tileSize={256}
            updateWhenZooming={false}
            updateWhenIdle
            keepBuffer={4}
          />
        );
      })}

      {showD8Streams && <TerrainD8StreamLayer visible={showD8Streams} />}
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
// Exactly two choices: all recharge prediction products as one grouped layer,
// and the D8 terrain-flow streamlines as an independent layer.
// -----------------------------------------------------------------------------

function ScientificLayerControl({
  showRechargeRaster,
  setShowRechargeRaster,
  showD8Streams,
  setShowD8Streams,
}) {
  return (
    <div
      className="gw-layer-control"
      style={{
        ...panelStyle,
        top: 12,
        right: 12,
        width: "min(330px, calc(100% - 24px))",
        maxHeight: "38%",
        overflowY: "auto",
        padding: "12px 14px",
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 5 }}>
        Map Layers
      </div>
      <div style={{ fontSize: 11, color: "#475569", marginBottom: 9 }}>
        Turn all recharge prediction maps on or off together. D8 terrain flow streams are controlled separately and can be overlaid on the recharge maps.
      </div>

      <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={showRechargeRaster}
          onChange={(event) => setShowRechargeRaster(event.target.checked)}
        />
        <span>
          <strong>Recharge index raster</strong>
          <span style={{ display: "block", color: "#64748b", fontSize: 10.5 }}>
            FAHP + CNN-GRU + XGBoost prediction + five-class XGBoost zones shown together; multi-colour display
          </span>
        </span>
      </label>

      <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 7, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={showD8Streams}
          onChange={(event) => setShowD8Streams(event.target.checked)}
        />
        <span>
          <strong>D8 flow direction</strong>
          <span style={{ display: "block", color: "#64748b", fontSize: 10.5 }}>
            Connected blue streamlines and downstream arrows
          </span>
        </span>
      </label>

      <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(0,0,0,0.12)", fontSize: 10.5, color: "#555" }}>
        All four recharge products are shown together to retain a multi-colour map appearance. Overlapping colors are a visual overlay, not a newly calculated combined model score. D8 lines represent terrain-derived surface drainage, not verified underground groundwater flow.
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
          background: "linear-gradient(to right, #b2182b, #ef8a62, #fddbc7, #d1e5f0, #67a9cf, #2166ac)",
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
        <span>Low: {Number(metadata.min).toFixed(4)}</span>
        <span>High: {Number(metadata.max).toFixed(4)}</span>
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
        Five equal-frequency percentile classes of the XGBoost recharge-index prediction. The raster audit confirms that Zone 1 has the lowest index and Zone 5 the highest. These index classes are not independently validated as hydrogeologic recharge-suitability or borewell-siting classes.
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
  showD8Streams,
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
    showD8Streams,
    showFlowAccumulation,
  ].filter(Boolean).length;

  if (visibleCount === 0) return null;

  return (
    <div
      className="gw-legend-container"
      aria-label="Map legend"
      style={{
        ...panelStyle,
        top: 12,
        left: 12,
        right: "auto",
        bottom: "auto",
        width: "min(270px, calc(100% - 24px))",
        maxHeight: "28%",
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

      {showD8Streams && (
        <div className="gw-legend-card">
          <div style={{ fontWeight: 750, marginBottom: 6 }}>Terrain-derived D8 stream paths</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <svg width="64" height="16" viewBox="0 0 64 16" aria-hidden="true" style={{ flex: "0 0 64px" }}>
              <path d="M2 9 C13 1, 20 14, 31 7 S48 3, 62 8" fill="none" stroke="#f5fbff" strokeWidth="7" strokeLinecap="round" />
              <path d="M2 9 C13 1, 20 14, 31 7 S48 3, 62 8" fill="none" stroke="#1269a8" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
            <span><strong>Blue line + arrow</strong> = traced D8 surface path and downstream direction</span>
          </div>
          <div style={{ fontSize: 10, color: "#475569" }}>
            Paths are traced from the supplied D8 direction grid after deriving upstream contributing-cell counts. Display threshold: {D8_STREAM_THRESHOLD_CELLS.toLocaleString("en-IN")} cells (about 4.5 km² at nominal 30 m cells). Wider lines and arrowheads are used on the larger paths; arrows indicate the coded downstream direction.
          </div>
          <div style={{ marginTop: 5, fontSize: 10, color: "#7c2d12" }}>
            Terrain-derived surface drainage diagnostic only. It is not a mapped river inventory or validated underground groundwater flow.
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
  showD8Streams,
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
    showD8Streams && {
      id: "d8-streams",
      title: "Terrain-derived D8 stream paths",
      text: "Connected stream-like paths traced from D8 terrain direction codes with a 5,000-cell upstream accumulation threshold. These indicate modeled surface drainage, not validated subsurface groundwater flow.",
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
  const [flowAccumulationMetadata, setFlowAccumulationMetadata] = useState(null);
  const [metadataError, setMetadataError] = useState(null);

  // Exactly two top-level controls: all recharge products together, and D8 streams.
  const [showRechargeRaster, setShowRechargeRaster] = useState(true);
  const [showD8Streams, setShowD8Streams] = useState(false);

  // All four frozen prediction products are part of the same displayed group.
  const showFahp = showRechargeRaster;
  const showCnnGru = showRechargeRaster;
  const showXgboost = showRechargeRaster;
  const showXgboostZones = showRechargeRaster;
  const showD8Candidate = false;
  const showFlowAccumulation = false;

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
      const response = await fetch(apiUrl(`/api/raster-query?${params.toString()}`));
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
        /* Preserve source tile colors; opacity is configured per member of the grouped recharge overlay. */
        .gw-recharge-raster-tile {
          image-rendering: auto;
        }

        .gw-d8-flow-arrow-icon {
          background: transparent !important;
          border: 0 !important;
          box-shadow: none !important;
        }

        /* Keep the farmer advisory pinned to the map's bottom-right corner. */
        .groundwater-map-root .gw-query-panel {
          position: absolute !important;
          top: auto !important;
          left: auto !important;
          right: 12px !important;
          bottom: 12px !important;
          width: min(360px, calc(100% - 24px)) !important;
          max-height: 54% !important;
          z-index: 1100 !important;
          box-sizing: border-box !important;
        }

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
          .groundwater-map-root .gw-query-panel,
          .gw-query-panel {
            top: auto !important;
            bottom: 8px !important;
            right: 8px !important;
            left: auto !important;
            width: calc(52% - 8px) !important;
            max-width: 300px !important;
            max-height: 43% !important;
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

          .gw-legend-container {
            left: 8px !important;
            right: auto !important;
            top: 8px !important;
            bottom: auto !important;
            width: calc(48% - 8px) !important;
            max-width: 200px !important;
            max-height: 25% !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
            overflow-y: auto !important;
            padding: 6px !important;
            font-size: 9px !important;
          }

          .gw-layer-control {
            z-index: 1200 !important;
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

          .groundwater-map-root .gw-query-panel,
          .gw-query-panel {
            top: auto !important;
            left: auto !important;
            right: 8px !important;
            bottom: 8px !important;
            width: calc(54% - 8px) !important;
            max-width: 240px !important;
            max-height: 43% !important;
          }

          .gw-legend-container {
            width: calc(46% - 8px) !important;
            max-width: calc(46% - 8px) !important;
            max-height: 23% !important;
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
        const [fahp, xgboost, xgboostZones, cnnGru, d8Candidate, flowAccumulation] = await Promise.all([
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
      flowAccumulationMetadata;

    return metadata?.bounds ?? null;
  }, [
    fahpMetadata,
    xgboostMetadata,
    xgboostZonesMetadata,
    cnnGruMetadata,
    d8Metadata,
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
        maxZoom={MAP_MAX_ZOOM}
        style={{ width: "100%", height: "100%", minHeight: 520 }}
        scrollWheelZoom
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {/* Detailed basemap zoom is independent of the frozen scientific raster pyramid. */}


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
          showRechargeRaster={showRechargeRaster}
          showD8Streams={showD8Streams}
          fahpMetadata={fahpMetadata}
          xgboostMetadata={xgboostMetadata}
          xgboostZonesMetadata={xgboostZonesMetadata}
          cnnGruMetadata={cnnGruMetadata}
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
        aria-label="Farmer recharge advisory and location query"
        style={{
          ...panelStyle,
          zIndex: 1100,
          right: 12,
          bottom: 12,
          left: "auto",
          top: "auto",
          width: "min(360px, calc(100% - 24px))",
          maxHeight: "58%",
          overflowY: "auto",
          padding: 12,
        }}
      >
        <strong>Farmer Recharge Advisory</strong>
        <p style={{ margin: "6px 0" }}>
          Search for your village, then tap your farm location on the map or enter its coordinates to view the local recharge-index sample and terrain information.
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
              id="groundwater-query-latitude"
              name="latitude"
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
              id="groundwater-query-longitude"
              name="longitude"
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
                <strong>Your location summary</strong>
                <p style={{ margin: "5px 0" }}>
                  Latitude: {Number(queryResult.coordinates?.latitude).toFixed(6)}
                  <br />
                  Longitude: {Number(queryResult.coordinates?.longitude).toFixed(6)}
                </p>
                <p style={{ margin: "5px 0" }}>
                  Raster values available: <strong>{availableCount} of {entries.length}</strong>
                </p>
                <p style={{ margin: "5px 0 0", fontSize: 11 }}>
                  The recharge index is a modelled map indicator, not a measured groundwater level or guaranteed water availability. Blue stream-like paths show terrain-derived surface routing, not verified underground water flow.
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
                Advisory: use this map to shortlist places for further checking only. Before drilling, confirm local geology, seasonal water levels, nearby well performance and required permissions with a qualified local groundwater professional. This map does not provide a validated borewell-suitability ranking.
              </p>
            </div>
          );
        })()}
      </div>

      <ScientificLayerControl
        showRechargeRaster={showRechargeRaster}
        setShowRechargeRaster={setShowRechargeRaster}
        showD8Streams={showD8Streams}
        setShowD8Streams={setShowD8Streams}
      />

      <ScientificLegend
        showFahp={showFahp}
        showXgboost={showXgboost}
        showXgboostZones={showXgboostZones}
        showCnnGru={showCnnGru}
        showD8Candidate={showD8Candidate}
        showD8Streams={showD8Streams}
        showFlowAccumulation={showFlowAccumulation}
        fahpMetadata={fahpMetadata}
        xgboostMetadata={xgboostMetadata}
        xgboostZonesMetadata={xgboostZonesMetadata}
        cnnGruMetadata={cnnGruMetadata}
      />
    </div>
  );
}
