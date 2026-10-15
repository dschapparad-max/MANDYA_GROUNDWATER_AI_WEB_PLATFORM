
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "./VillageSearch.css";

const DATA_URL = "/data/mandya_villages.geojson";
const EXPECTED_FEATURE_COUNT = 1484;
const MAX_RESULTS = 8;

export default function VillageSearch() {
  const map = useMap();

  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  const selectVillage = useCallback(
    (feature) => {
      if (!feature?.geometry) return;

      const properties = feature.properties || {};
      const id = String(properties.village_id ?? "");
      const name = String(
        properties.village_name || "Unnamed village"
      );

      setSelected({ id, name });
      setSearch("");
      setError("");

      const bounds = L.geoJSON(feature).getBounds();

      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          paddingTopLeft: [25, 25],
          paddingBottomRight: [25, 25],
          maxZoom: 14,
          animate: true,
        });
      }
    },
    [map]
  );

  // Load village boundaries.
  useEffect(() => {
    const controller = new AbortController();

    async function loadVillages() {
      try {
        const response = await fetch(DATA_URL, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Village data HTTP ${response.status}`);
        }

        const geojson = await response.json();

        if (
          geojson.type !== "FeatureCollection" ||
          !Array.isArray(geojson.features) ||
          geojson.features.length !== EXPECTED_FEATURE_COUNT
        ) {
          throw new Error(
            `Village data validation failed: expected ${EXPECTED_FEATURE_COUNT} features.`
          );
        }

        setData(geojson);
        setError("");
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Village boundaries could not be loaded.");
        }
      }
    }

    loadVillages();

    return () => controller.abort();
  }, []);

  // Add boundaries to the map and handle individual village clicks.
  useEffect(() => {
    if (!data) return undefined;

    const villageLayer = L.geoJSON(data, {
      style: () => ({
        color: "#334155",
        weight: 1,
        opacity: 0.8,
        fillColor: "#f8fafc",
        fillOpacity: 0.025,
      }),

      onEachFeature: (feature, layer) => {
        layer.on("click", () => selectVillage(feature));

        layer.bindTooltip(
          String(feature.properties?.village_name || "Unnamed village"),
          {
            sticky: true,
            direction: "top",
          }
        );
      },
    });

    villageLayer.addTo(map);

    return () => {
      villageLayer.remove();
    };
  }, [data, map, selectVillage]);

  const matches = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("en-IN");

    if (!query || !data) return [];

    return data.features
      .filter((feature) => {
        const name = String(
          feature.properties?.village_name || ""
        ).toLocaleLowerCase("en-IN");

        const id = String(feature.properties?.village_id ?? "");

        return name.includes(query) || id.includes(query);
      })
      .slice(0, MAX_RESULTS);
  }, [data, search]);

  return (
    <section
      className="village-search-panel"
      aria-label="Mandya village search"
      style={{
        color: "#172033",
        background: "rgba(255,255,255,0.98)",
        border: "1px solid #dbe2ea",
        borderRadius: "12px",
        boxShadow: "0 5px 20px rgba(15,23,42,0.15)",
        fontFamily: "inherit",
        fontSize: "13px",
      }}
    >
      <div className="village-search-heading">
        <div>
          <h3>Search Mandya villages</h3>
          <p>Find a village by name or LGD code</p>
        </div>

        <span className="village-count">
          {data ? data.features.length.toLocaleString("en-IN") : "—"}
        </span>
      </div>

      <label
        className="village-search-label"
        htmlFor="village-search-input"
      >
        Village name or LGD code
      </label>

      <input
        id="village-search-input"
        className="village-search-input"
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="e.g. Manahalli or 613999"
        autoComplete="off"
      />

      {error && (
        <p className="village-search-error" role="alert">
          {error}
        </p>
      )}

      {!data && !error && (
        <p className="village-search-status" role="status">
          Loading village boundaries…
        </p>
      )}

      {data && search.trim() && (
        <div
          className="village-search-results"
          role="listbox"
          aria-label="Village search results"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            maxHeight: "100px",
            overflowY: "auto",
          }}
        >
          {matches.map((feature) => {
            const id = String(feature.properties?.village_id ?? "");
            const name = String(
              feature.properties?.village_name || "Unnamed village"
            );
            const isSelected = selected?.id === id;

            return (
              <button
                key={id}
                type="button"
                className={`village-result ${
                  isSelected ? "village-result-selected" : ""
                }`}
                onClick={() => selectVillage(feature)}
                role="option"
                aria-selected={isSelected}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  width: "100%",
                  minHeight: "36px",
                  boxSizing: "border-box",
                  padding: "8px 10px",
                  color: "#1e293b",
                  background: isSelected ? "#eff6ff" : "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "7px",
                  textAlign: "left",
                  font: "inherit",
                  cursor: "pointer",
                }}
              >
                <span className="village-result-name">{name}</span>
                <span className="village-result-code">LGD {id}</span>
              </button>
            );
          })}

          {matches.length === 0 && (
            <p className="village-search-status">
              No matching village found.
            </p>
          )}

          {matches.length === MAX_RESULTS && (
            <p className="village-search-hint">
              Showing the first {MAX_RESULTS} matches. Refine your search.
            </p>
          )}
        </div>
      )}

      {selected && (
        <div
          className="village-selected-details"
          aria-live="polite"
          style={{
            flexShrink: 0,
            padding: "8px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "7px",
          }}
        >
          <div className="village-selected-title">
            <span className="village-selected-indicator" />
            <strong>{selected.name}</strong>
          </div>

          <div className="village-selected-code">
            LGD village code:{" "}
            <strong>{selected.id || "Unavailable"}</strong>
          </div>

          <p>
            Boundary lookup only. Use the coordinate-query tool separately
            to inspect available groundwater raster values.
          </p>
        </div>
      )}

      <div className="village-search-footer">
        Village boundaries are reference data, not recharge classifications.
      </div>
    </section>
  );
}
