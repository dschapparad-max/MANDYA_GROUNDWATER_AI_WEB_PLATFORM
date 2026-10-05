import { useEffect, useState } from "react";

import {
  getClaims,
  getLayers,
  getMetadata,
  getProvenance,
  getZones
} from "./services/api";

function App() {
  const [metadata, setMetadata] = useState(null);
  const [layers, setLayers] = useState([]);
  const [provenance, setProvenance] = useState(null);
  const [claims, setClaims] = useState(null);
  const [zones, setZones] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadPlatform() {
      try {
        const [
          metadataResponse,
          layersResponse,
          provenanceResponse,
          claimsResponse,
          zonesResponse
        ] = await Promise.all([
          getMetadata(),
          getLayers(),
          getProvenance(),
          getClaims(),
          getZones()
        ]);

        setMetadata(metadataResponse);
        setLayers(layersResponse.layers ?? []);
        setProvenance(provenanceResponse);
        setClaims(claimsResponse);
        setZones(zonesResponse);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadPlatform();
  }, []);

  if (loading) {
    return (
      <main className="page">
        <section className="panel">
          <h1>Mandya Groundwater AI</h1>
          <p>Loading verified project metadata...</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page">
        <section className="panel">
          <h1>Mandya Groundwater AI</h1>
          <p className="error">{error}</p>
          <p>
            Start the FastAPI backend and confirm that the API is available
            at <code>/api</code>.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">GIS + AI DECISION SUPPORT</p>
        <h1>Mandya Groundwater AI</h1>
        <p>
          Groundwater recharge assessment and AI-based spatial prediction
          platform for Mandya District.
        </p>
      </header>

      <section className="scientific-banner">
        <strong>Scientific scope</strong>
        <span>
          Mandya District · EPSG:32643 · 30 m · read-only scientific mode
        </span>
      </section>

      <section className="grid">
        <article className="panel">
          <h2>Project Metadata</h2>

          <dl>
            <dt>Project</dt>
            <dd>{metadata?.project ?? "Mandya Groundwater AI"}</dd>

            <dt>Geographic scope</dt>
            <dd>{metadata?.geographic_scope ?? "Mandya District"}</dd>

            <dt>CRS</dt>
            <dd>{metadata?.default_crs ?? "EPSG:32643"}</dd>

            <dt>Resolution</dt>
            <dd>{metadata?.default_resolution_m ?? 30} m</dd>
          </dl>
        </article>

        <article className="panel">
          <h2>Scientific Layers</h2>

          <div className="layer-list">
            {layers.map((layer) => (
              <div className="layer-card" key={layer.layer_id}>
                <strong>{layer.display_name ?? layer.layer_id}</strong>

                <span>
                  {layer.status ?? "STATUS NOT PROVIDED"}
                </span>

                <small>
                  {layer.web_role ?? "ROLE NOT PROVIDED"}
                </small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <h2>Map View</h2>

        <div className="map-placeholder">
          <div>
            <strong>Map renderer foundation</strong>
            <p>
              The scientific layer registry is connected. Actual raster
              serving URLs have not been invented or assumed.
            </p>
            <p>
              Raster hosting will be enabled only after an explicit,
              verified deployment source is configured.
            </p>
          </div>
        </div>
      </section>

      <section className="grid">
        <article className="panel">
          <h2>Recharge Zones</h2>

          <p>
            Five-zone decision-support classification:
          </p>

          <ol>
            <li>Zone 1</li>
            <li>Zone 2</li>
            <li>Zone 3</li>
            <li>Zone 4</li>
            <li>Zone 5</li>
          </ol>

          {zones?.description && (
            <p>{zones.description}</p>
          )}
        </article>

        <article className="panel">
          <h2>Provenance</h2>

          <pre>
            {JSON.stringify(provenance, null, 2)}
          </pre>
        </article>
      </section>

      <section className="panel">
        <h2>Scientific Claims</h2>

        <pre>
          {JSON.stringify(claims, null, 2)}
        </pre>
      </section>

      <section className="warning">
        <h2>Scientific Disclaimer</h2>

        <p>
          This platform presents the project's verified scientific outputs
          and provenance metadata. It does not independently validate
          groundwater flow, does not perform new model training or inference,
          and does not create new management rankings.
        </p>

        <p>
          The Candidate D8 pathway product remains a
          <strong> non-authoritative diagnostic layer</strong> and must not
          be presented as direct groundwater-flow validation.
        </p>

        <p>
          No instantaneous or real-time groundwater prediction claim is made.
        </p>
      </section>

      <footer>
        Mandya Groundwater AI · Scientific implementation foundation
      </footer>
    </main>
  );
}

export default App;
