
import { useMemo, useState } from "react";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("The CSV needs a header and at least one data row.");

  // This first version supports ordinary CSV files without quoted commas.
  const headers = lines[0].split(",").map((v) => v.trim().toLowerCase());
  const find = (...names) => headers.findIndex((h) => names.includes(h));

  const yearIndex = find("year");
  const emissionsIndex = find(
    "emissions_kg_co2e", "co2e_kg", "carbon_kg", "emissions_kg"
  );
  const energyIndex = find("energy_kwh", "energy", "kwh");
  const categoryIndex = find("category", "service", "resource");

  if (yearIndex < 0 || (emissionsIndex < 0 && energyIndex < 0)) {
    throw new Error(
      "Required columns: year and emissions_kg_co2e or energy_kwh. See the sample CSV below."
    );
  }

  const rows = lines.slice(1).map((line, index) => {
    const cells = line.split(",").map((v) => v.trim());
    const year = Number(cells[yearIndex]);
    const emissions = emissionsIndex >= 0 ? Number(cells[emissionsIndex]) : null;
    const energy = energyIndex >= 0 ? Number(cells[energyIndex]) : null;

    if (
      !Number.isInteger(year) ||
      (emissionsIndex >= 0 && (!Number.isFinite(emissions) || emissions < 0)) ||
      (energyIndex >= 0 && (!Number.isFinite(energy) || energy < 0))
    ) {
      throw new Error(`Invalid year, emissions, or energy value on data row ${index + 2}.`);
    }

    return {
      year,
      emissions,
      energy,
      category: categoryIndex >= 0 ? cells[categoryIndex] || "Other" : "All resources",
    };
  });

  return rows;
}

export default function CarbonAnalytics() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  const summary = useMemo(() => {
    const years = new Map();

    rows.forEach((row) => {
      const item = years.get(row.year) || {
        year: row.year,
        emissions: 0,
        energy: 0,
        emissionsRows: 0,
        energyRows: 0,
      };

      if (row.emissions !== null) {
        item.emissions += row.emissions;
        item.emissionsRows += 1;
      }
      if (row.energy !== null) {
        item.energy += row.energy;
        item.energyRows += 1;
      }

      years.set(row.year, item);
    });

    return [...years.values()]
      .sort((a, b) => a.year - b.year)
      .map((item) => ({
        ...item,
        hasEmissions: item.emissionsRows > 0,
        hasEnergy: item.energyRows > 0,
      }));
  }, [rows]);

  const hasEmissions = rows.some((row) => row.emissions !== null);
  const hasEnergy = rows.some((row) => row.energy !== null);
  const categories = useMemo(() => {
    const result = new Map();

    rows.forEach((row) => {
      const item = result.get(row.category) || { name: row.category, emissions: 0, energy: 0 };
      if (row.emissions !== null) item.emissions += row.emissions;
      if (row.energy !== null) item.energy += row.energy;
      result.set(row.category, item);
    });

    return [...result.values()].sort(
      (a, b) => (hasEmissions ? b.emissions - a.emissions : b.energy - a.energy)
    );
  }, [rows, hasEmissions]);

  const totalEmissions = summary.reduce((sum, item) => sum + item.emissions, 0);
  const totalEnergy = summary.reduce((sum, item) => sum + item.energy, 0);
  const peak = Math.max(
    1,
    ...summary.map((item) => hasEmissions ? item.emissions : item.energy)
  );
  const categoryPeak = Math.max(
    1,
    ...categories.map((item) => hasEmissions ? item.emissions : item.energy)
  );

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");

    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      setRows(parsed);
      setFileName(file.name);
    } catch (err) {
      setRows([]);
      setFileName("");
      setError(err.message || "Could not read this CSV file.");
    }

    event.target.value = "";
  }

  function downloadSample() {
    const sample = [
      "year,category,energy_kwh,emissions_kg_co2e",
      "2022,Compute,12000,4800",
      "2022,Storage,4000,1600",
      "2023,Compute,13500,5400",
      "2023,Storage,4200,1680",
      "2024,Compute,14200,5680",
      "2024,Storage,4500,1800",
      "2025,Compute,13800,5520",
      "2025,Storage,4300,1720",
    ].join("\n");

    const url = URL.createObjectURL(new Blob([sample], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "cloudwise-sustainability-sample.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="carbon-panel">
      <div className="carbon-heading">
        <div>
          <span className="carbon-eyebrow">SUSTAINABILITY INTELLIGENCE</span>
          <h3>Carbon & energy analytics</h3>
          <p>Explore annual environmental indicators and identify the largest contributors.</p>
        </div>
        <label className="carbon-upload">
          <input type="file" accept=".csv,text/csv" onChange={handleFile} />
          Upload CSV
        </label>
      </div>

      <div className="carbon-upload-info">
        <span className="carbon-status-dot" />
        {fileName ? `Loaded: ${fileName}` : "No data loaded · Start with a sample or upload your own"}
        <button type="button" onClick={downloadSample}>Get sample CSV</button>
      </div>

      {error && <p className="carbon-error" role="alert">{error}</p>}

      {!rows.length ? (
        <div className="carbon-empty">
          <div className="carbon-empty-icon">↗</div>
          <h4>Your sustainability workspace</h4>
          <p>
            Upload annual energy or emissions data to build charts. The sample file
            demonstrates the format; its numbers are illustrative, not measured results.
          </p>
          <div className="carbon-column-guide">
            <span><b>year</b> — reporting year</span>
            <span><b>energy_kwh</b> — energy consumed</span>
            <span><b>emissions_kg_co2e</b> — carbon-equivalent emissions</span>
            <span><b>category</b> — optional resource group</span>
          </div>
        </div>
      ) : (
        <>
          <div className="carbon-kpis">
            {hasEmissions && (
              <article>
                <span>Total reported emissions</span>
                <strong>{(totalEmissions / 1000).toLocaleString("en-IN", { maximumFractionDigits: 2 })} t</strong>
                <small>CO₂-equivalent · converted from kg</small>
              </article>
            )}
            {hasEnergy && (
              <article>
                <span>Total reported energy</span>
                <strong>{totalEnergy.toLocaleString("en-IN", { maximumFractionDigits: 1 })}</strong>
                <small>kWh across uploaded rows</small>
              </article>
            )}
            <article>
              <span>Reporting coverage</span>
              <strong>{summary.length} years</strong>
              <small>{rows.length} data rows · uploaded CSV</small>
            </article>
          </div>

          <div className="carbon-charts">
            <article className="carbon-chart-card">
              <div className="carbon-chart-title">
                <div>
                  <h4>Annual trend</h4>
                  <p>{hasEmissions ? "Reported emissions · kg CO₂e" : "Reported energy · kWh"}</p>
                </div>
                <span>BY YEAR</span>
              </div>

              <div className="carbon-bars" role="img" aria-label="Annual sustainability values shown as bars">
                {summary.map((item) => {
                  const value = hasEmissions ? item.emissions : item.energy;
                  return (
                    <div className="carbon-bar-column" key={item.year} title={`${item.year}: ${value.toLocaleString("en-IN")}`}>
                      <strong>{value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong>
                      <div className="carbon-bar-track">
                        <span style={{ height: `${(value / peak) * 100}%` }} />
                      </div>
                      <span className="carbon-bar-year">{item.year}</span>
                    </div>
                  );
                })}
              </div>
              <small className="carbon-chart-note">Bars compare years in the uploaded file. They are not a forecast.</small>
            </article>

            <article className="carbon-chart-card">
              <div className="carbon-chart-title">
                <div>
                  <h4>Impact by category</h4>
                  <p>{hasEmissions ? "Emissions contribution" : "Energy contribution"}</p>
                </div>
                <span>BREAKDOWN</span>
              </div>

              <div className="carbon-category-list">
                {categories.map((item) => {
                  const value = hasEmissions ? item.emissions : item.energy;
                  return (
                    <div className="carbon-category" key={item.name}>
                      <div className="carbon-category-label">
                        <span>{item.name}</span>
                        <strong>{value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong>
                      </div>
                      <div className="carbon-category-track">
                        <span style={{ width: `${(value / categoryPeak) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <small className="carbon-chart-note">
                {hasEmissions ? "Values are grouped by category from your uploaded rows." : "Upload emissions data to compare carbon impact."}
              </small>
            </article>
          </div>

          <div className="carbon-data-note">
            <strong>Data interpretation</strong>
            <p>
              Charts reflect the uploaded CSV only. Emissions are not inferred from cost,
              and no missing years or values are invented. Verify the units and reporting
              methodology of your source before using these figures in a formal report.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
