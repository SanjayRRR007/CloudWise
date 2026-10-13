import CarbonAnalytics from "./CarbonAnalytics";
import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./CloudWiseLab.css";
import CostAnalytics from "./CostAnalytics";

const API = "http://localhost:5000";

const INITIAL_RESOURCES = [
  { name: "Web Server", type: "Compute", monthlyCost: 10000, utilization: 25 },
  { name: "Database", type: "Database", monthlyCost: 15000, utilization: 65 },
  { name: "Storage", type: "Storage", monthlyCost: 5000, utilization: 15 },
  { name: "App Server", type: "Compute", monthlyCost: 12000, utilization: 40 },
];

const INITIAL_ML_INPUTS = {
  "util:CPU": 30,
  "util:memory": 40,
  "util:disk": 35,
  load1: 20,
  load5: 22,
  load15: 24,
};

const SECURITY_CONTROLS = [
  { label: "Least-privilege access", priority: "High", points: 15 },
  { label: "Encryption at rest and in transit", priority: "Critical", points: 15 },
  { label: "Multi-factor authentication (MFA)", priority: "Critical", points: 15 },
  { label: "Backups and recovery testing", priority: "High", points: 15 },
  { label: "Logging and monitoring", priority: "High", points: 10 },
  { label: "Network access restrictions", priority: "High", points: 10 },
  { label: "Security patches up to date", priority: "Medium", points: 10 },
  { label: "Secrets and credentials managed securely", priority: "Critical", points: 10 },
];
const RESOURCE_FEATURES = [
  ["util:CPU", "CPU utilisation"],
  ["util:memory", "Memory utilisation"],
  ["util:disk", "Disk utilisation"],
  ["load1", "Load average · 1 minute"],
  ["load5", "Load average · 5 minutes"],
  ["load15", "Load average · 15 minutes"],
];

const inr = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const cardStyle = {
  background: "#fff",
  color: "#172033",
  padding: 24,
  borderRadius: 16,
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 16px rgba(15,23,42,0.045)",
  minWidth: 0,
};

const fieldStyle = {
  display: "block",
  boxSizing: "border-box",
  width: "100%",
  padding: 12,
  marginTop: 7,
  marginBottom: 18,
  border: "1px solid #cbd5e1",
  borderRadius: 9,
  background: "#fff",
  color: "#172033",
  fontSize: 15,
};

export default function CloudWiseLab() {
  const [budget, setBudget] = useState(45000);
  const [users, setUsers] = useState(1000);
  const [security, setSecurity] = useState("medium");
  const [deployment, setDeployment] = useState("balanced");
  const [growth, setGrowth] = useState(2);
  const [resources, setResources] = useState(INITIAL_RESOURCES);
  const [checks, setChecks] = useState(Array(SECURITY_CONTROLS.length).fill(false));

  const [apiAnalysis, setApiAnalysis] = useState(null);
  const [apiStatus, setApiStatus] = useState("Connecting to backend...");

  const [mlInputs, setMlInputs] = useState(INITIAL_ML_INPUTS);
  const [mlPrediction, setMlPrediction] = useState(null);
  const [mlStatus, setMlStatus] = useState(
    "Enter workload values and run the trained model."
  );
  const [mlLoading, setMlLoading] = useState(false);

  const totalCost = useMemo(
    () => resources.reduce((sum, item) => sum + item.monthlyCost, 0),
    [resources]
  );

  const flagged = resources.filter((item) => item.utilization < 30);

  const potentialSavings = flagged.reduce(
    (sum, item) => sum + item.monthlyCost * 0.3,
    0
  );

  const emissionsIndex = totalCost * 0.0012;
  const projectedUsers = users * growth;

  const deploymentAdvice =
    security === "high"
      ? "Private or carefully designed hybrid cloud"
      : deployment === "budget"
      ? "Public cloud - a cost-conscious starting point"
      : deployment === "control"
      ? "Private cloud - greater control and responsibility"
      : "Hybrid cloud - a balance of flexibility and control";

  const localRecommendations = [
    ...flagged.map(
      (item) =>
        `Review ${item.name}: utilisation is ${item.utilization}%. Assess resizing or consolidation before making changes.`
    ),
    totalCost > budget
      ? `Estimated cost exceeds your budget by ${inr(totalCost - budget)}.`
      : `Estimated monthly cost is within budget, with ${inr(budget - totalCost)} remaining.`,
    projectedUsers > 5000
      ? "High-growth scenario: plan load testing, capacity checks, and autoscaling."
      : "Run load tests to validate capacity before increasing production workload.",
    security === "high"
      ? "Prioritise least-privilege access, encryption, backups, logging, and compliance reviews."
      : "Review identity permissions, encryption, backups, and monitoring.",
    "Validate estimated savings against actual workload requirements before applying changes.",
  ];

  // Existing Node.js scenario-analysis API.
  useEffect(() => {
    const controller = new AbortController();

    async function analyseScenario() {
      setApiStatus("Analysing scenario...");

      try {
        const response = await fetch(`${API}/api/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            resources,
            budget,
            users,
            growth,
            security,
            deployment,
          }),
        });

        if (!response.ok) {
          throw new Error(`Analysis API returned ${response.status}`);
        }

        const result = await response.json();
        setApiAnalysis(result);
        setApiStatus("Backend connected Â· scenario uses simulated inputs");
      } catch (error) {
        if (error.name !== "AbortError") {
          setApiStatus("Backend unavailable - using local recommendations");
          console.error("CloudWise analysis error:", error);
        }
      }
    }

    analyseScenario();
    return () => controller.abort();
  }, [resources, budget, users, growth, security, deployment]);

  // Calls Node.js, which forwards the request to the Python ML service.
  async function runMlPrediction(event) {
    event.preventDefault();
    setMlLoading(true);
    setMlPrediction(null);
    setMlStatus("Requesting prediction from the trained model...");

    const numericInputs = {};

    for (const [key] of RESOURCE_FEATURES) {
      const value = Number(mlInputs[key]);

      if (!Number.isFinite(value)) {
        setMlStatus(`Please enter a valid number for ${key}.`);
        setMlLoading(false);
        return;
      }

      numericInputs[key] = value;
    }

    try {
      const response = await fetch(`${API}/api/ml/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(numericInputs),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.error || `ML API returned ${response.status}`);
      }

      if (typeof result.predicted_next_cpu !== "number") {
        throw new Error("The API response did not contain a valid prediction.");
      }

      setMlPrediction(result);
      setMlStatus("Prediction received successfully.");
    } catch (error) {
      setMlStatus(
        "Could not reach the ML service. Check that Python is running on port 5001 and Node.js on port 5000."
      );
      console.error("CloudWise ML error:", error);
    } finally {
      setMlLoading(false);
    }
  }

  function resetMlInputs() {
    setMlInputs({ ...INITIAL_ML_INPUTS });
    setMlPrediction(null);
    setMlStatus("Example inputs restored. Run the model to get a new prediction.");
  }

  function resetScenario() {
    setBudget(45000);
    setUsers(1000);
    setSecurity("medium");
    setDeployment("balanced");
    setGrowth(2);
    setResources(INITIAL_RESOURCES.map((item) => ({ ...item })));
    setChecks(Array(SECURITY_CONTROLS.length).fill(false));
  }

  function downloadTextReport() {
    if (!apiAnalysis) {
      alert("Please wait for the backend analysis to finish.");
      return;
    }

    const report = `CLOUDWISE
Cloud Optimisation Analysis Report
==================================

Generated: ${new Date().toLocaleString("en-IN")}

DATA NOTICE
Resource costs and scenario inputs are simulated. Sustainability is an illustrative
index, not measured carbon emissions. The ML prediction uses a trained model based
on historical Alibaba Cluster Trace 2017 data. It is not live cloud telemetry.

COST SUMMARY
Estimated monthly cost: ${inr(apiAnalysis.totalCost)}
Monthly budget: ${inr(apiAnalysis.budget)}
Budget status: ${apiAnalysis.withinBudget ? "Within budget" : "Over budget"}
Potential monthly savings: ${inr(apiAnalysis.potentialSavings)}
Projected monthly cost: ${inr(apiAnalysis.projectedCost)}

RESOURCE UTILISATION
${resources
  .map(
    (item) =>
      `${item.name} (${item.type})\nCost: ${inr(item.monthlyCost)}\nUtilisation: ${item.utilization}%`
  )
  .join("\n\n")}

DEPLOYMENT ADVICE
${apiAnalysis.deploymentAdvice}

BACKEND RECOMMENDATIONS
${(apiAnalysis.recommendations || []).map((item, index) => `${index + 1}. ${item}`).join("\n")}

ML CPU PREDICTION
${
  mlPrediction
    ? `Predicted next CPU value: ${mlPrediction.predicted_next_cpu}\nUnits: ${mlPrediction.unit}\nModel: ${mlPrediction.model}\nDataset: ${mlPrediction.data_source}`
    : "No ML prediction was generated in this session."
}

SCALABILITY
Current monthly users: ${users}
Growth multiplier: ${growth}x
Projected monthly users: ${projectedUsers}

SECURITY POSTURE CENTRE
Posture score: ${checks.reduce((score, done, index) => score + (done ? SECURITY_CONTROLS[index].points : 0), 0)}/100
${SECURITY_CONTROLS
  .map((control, index) => `${checks[index] ? "[Completed]" : "[Action needed]"} [${control.priority}] ${control.label}`)
  .join("\n")}

LIMITATIONS
${apiAnalysis.note || "Illustrative decision-support analysis."}
Savings are estimates and are not guaranteed. Validate against real workload
requirements before making infrastructure changes.
`;

    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "CloudWise-Analysis-Report.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function downloadPdfReport() {
    if (!apiAnalysis) {
      alert("Please wait for the backend analysis to finish.");
      return;
    }

    const doc = new jsPDF();
    const margin = 16;
    const pageWidth = doc.internal.pageSize.getWidth();
    const reportDate = new Date().toLocaleString("en-IN");

    doc.setFillColor(16, 28, 53);
    doc.rect(0, 0, pageWidth, 48, "F");
    doc.setTextColor(142, 216, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("CLOUDWISE", margin, 16);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(21);
    doc.text("Cloud Optimisation Report", margin, 30);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Simulated scenario + historical-data ML prototype", margin, 40);

    let y = 59;
    doc.setTextColor(45, 55, 70);
    doc.text(`Generated: ${reportDate}`, margin, y);
    y += 10;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Cost metric", "Result"]],
      body: [
        ["Estimated monthly cost", inr(apiAnalysis.totalCost)],
        ["Monthly budget", inr(apiAnalysis.budget)],
        ["Budget status", apiAnalysis.withinBudget ? "Within budget" : "Over budget"],
        ["Potential monthly savings", inr(apiAnalysis.potentialSavings)],
        ["Projected monthly cost", inr(apiAnalysis.projectedCost)],
        ["Resources flagged for review", String(apiAnalysis.underutilizedCount)],
        ["Deployment advice", apiAnalysis.deploymentAdvice],
      ],
      theme: "grid",
      headStyles: { fillColor: [30, 64, 110] },
      styles: { fontSize: 9, cellPadding: 3, overflow: "linebreak" },
    });

    y = doc.lastAutoTable.finalY + 10;

    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Resource utilisation", margin, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Resource", "Type", "Monthly cost", "Utilisation", "Review"]],
      body: resources.map((item) => [
        item.name,
        item.type,
        inr(item.monthlyCost),
        `${item.utilization}%`,
        item.utilization < 30 ? "Review" : "No low-use flag",
      ]),
      theme: "grid",
      headStyles: { fillColor: [30, 64, 110] },
      styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak" },
    });

    y = doc.lastAutoTable.finalY + 12;
    if (y > 245) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Recommendations", margin, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    (apiAnalysis.recommendations || []).forEach((item, index) => {
      const lines = doc.splitTextToSize(
        `${index + 1}. ${item}`,
        pageWidth - margin * 2
      );

      if (y + lines.length * 5 > 270) {
        doc.addPage();
        y = 20;
      }

      doc.text(lines, margin, y);
      y += lines.length * 5 + 3;
    });

    if (y > 245) {
      doc.addPage();
      y = 20;
    }

    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Machine-learning CPU prediction", margin, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    const mlText = mlPrediction
      ? `Predicted next CPU value: ${mlPrediction.predicted_next_cpu} (${mlPrediction.unit}). Model: ${mlPrediction.model}. Dataset: ${mlPrediction.data_source}.`
      : "No ML prediction was generated in this session.";

    const mlLines = doc.splitTextToSize(mlText, pageWidth - margin * 2);
    doc.text(mlLines, margin, y);
    y += mlLines.length * 5 + 8;

    if (y > 255) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(255, 247, 230);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 29, 2, 2, "F");
    doc.setTextColor(130, 80, 15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("IMPORTANT: PROTOTYPE ANALYSIS", margin + 4, y + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const disclaimer = doc.splitTextToSize(
      "Costs and savings use simulated inputs. ML predictions use historical Alibaba cluster data and entered example values, not live cloud telemetry. The sustainability index is not measured carbon emissions.",
      pageWidth - margin * 2 - 8
    );
    doc.text(disclaimer, margin + 4, y + 14);

    const pages = doc.getNumberOfPages();

    for (let page = 1; page <= pages; page += 1) {
      doc.setPage(page);
      const height = doc.internal.pageSize.getHeight();

      doc.setDrawColor(220, 228, 238);
      doc.line(margin, height - 14, pageWidth - margin, height - 14);
      doc.setTextColor(110, 125, 145);
      doc.setFontSize(8);
      doc.text("CloudWise | Decision-support prototype", margin, height - 8);
      doc.text(`Page ${page} of ${pages}`, pageWidth - margin, height - 8, {
        align: "right",
      });
    }

    doc.save("CloudWise-Analysis-Report.pdf");
  }

  return (
    <div className="cloudwise-lab">
      <div className="lab-container">
        <header className="lab-header">
          <div className="lab-brand">
            <span className="lab-brand-icon">☁</span>
            <span>CLOUDWISE</span>
            <span className="lab-brand-divider">/</span>
            <span>OPTIMISATION LAB</span>
          </div>

          <span className="demo-pill">
            <span className="demo-dot" />
AI-POWERED CLOUD INTELLIGENCE
          </span>

          <h1>Cloud Optimisation Lab</h1>
          <p className="lab-subtitle">
            Explore cost, resource efficiency, sustainability, security,
            scalability, and machine-learning predictions.
          </p>
        </header>

        
<div className="cloudwise-overview-banner">
  <div className="cloudwise-overview-icon">✦</div>
  <div className="cloudwise-overview-content">
    <strong>Cloud Resource Intelligence</strong>
    <p>
      Explore cost optimisation, workload forecasting, resource efficiency,
      and intelligent infrastructure planning from one workspace.
    </p>
  </div>
</div>


        <section className="lab-metrics">
          <article className="lab-metric">
            <span className="metric-icon">₹</span>
            <p>Estimated monthly cost</p>
            <h2>{inr(totalCost)}</h2>
            <small>Illustrative resource pricing</small>
          </article>

          <article className="lab-metric">
            <span className="metric-icon">◷</span>
            <p>Resources to review</p>
            <h2>{flagged.length}</h2>
            <small>Below 30% utilisation</small>
          </article>

          <article className="lab-metric">
            <span className="metric-icon">↘</span>
            <p>Potential monthly savings</p>
            <h2>{inr(potentialSavings)}</h2>
            <small>Hypothetical 30% reduction</small>
          </article>

          <article className="lab-metric">
            <span className="metric-icon">♻</span>
            <p>Illustrative emissions index</p>
            <h2>{emissionsIndex.toFixed(1)}</h2>
            <small>Not measured CO₂ emissions</small>
          </article>
        </section>

        <CostAnalytics resources={resources} />

        <div className="lab-section-heading">
          <span>DECISION TOOLS</span>
          <h2>Analyse your cloud scenario</h2>
          <p>Change the inputs to see how the scenario responds.</p>
        </div>

        <div className="lab-grid">
          <section className="lab-card" style={cardStyle}>
            <div className="lab-card-heading">
              <span className="lab-card-number">01</span>
              <div>
                <h3>Deployment advisor</h3>
                <p>Find a suitable deployment approach.</p>
              </div>
            </div>

            <label htmlFor="deployment">Primary objective</label>
            <select
              id="deployment"
              style={fieldStyle}
              value={deployment}
              onChange={(event) => setDeployment(event.target.value)}
            >
              <option value="balanced">Balance cost and flexibility</option>
              <option value="budget">Reduce cost</option>
              <option value="control">Maximum control</option>
            </select>

            <label htmlFor="security">Security requirement</label>
            <select
              id="security"
              style={fieldStyle}
              value={security}
              onChange={(event) => setSecurity(event.target.value)}
            >
              <option value="low">Standard</option>
              <option value="medium">Moderate</option>
              <option value="high">High / sensitive data</option>
            </select>

            <div className="lab-result">
              <span>RECOMMENDED APPROACH</span>
              <strong>{deploymentAdvice}</strong>
              <small>
                Rule-based suggestion. Validate compliance and workload
                requirements before choosing a provider.
              </small>
            </div>
          </section>

          <section className="lab-card" style={cardStyle}>
            <div className="lab-card-heading">
              <span className="lab-card-number">02</span>
              <div>
                <h3>Cost estimator</h3>
                <p>Compare estimated cost against your budget.</p>
              </div>
            </div>

            <label htmlFor="budget">Monthly budget (INR ₹)</label>
            <input
              id="budget"
              style={fieldStyle}
              type="number"
              min="0"
              value={budget}
              onChange={(event) =>
                setBudget(Math.max(0, Number(event.target.value)))
              }
            />

            <div className="cost-comparison">
              <div>
                <span>Estimated cost</span>
                <strong>{inr(totalCost)}</strong>
              </div>
              <div>
                <span>Your budget</span>
                <strong>{inr(budget)}</strong>
              </div>
              <div>
                <span>Difference</span>
                <strong>{inr(Math.abs(budget - totalCost))}</strong>
              </div>
            </div>

            <p
              className={
                totalCost > budget
                  ? "lab-status status-warning"
                  : "lab-status status-good"
              }
            >
              {totalCost > budget ? "● Over budget" : "● Within budget"}
            </p>

            <small>
              Sample prices only. Actual costs depend on provider, region,
              configuration, usage, and taxes.
            </small>
          </section>

          <section
            className="lab-card lab-card-wide"
            style={cardStyle}
          >
            <div className="lab-card-heading">
              <span className="lab-card-number">03</span>
              <div>
                <h3>Resource wastage analyser</h3>
                <p>
                  Adjust resource utilisation to identify potential
                  optimisation opportunities.
                </p>
              </div>
            </div>

            <div className="resource-list">
              {resources.map((resource, index) => (
                <div className="resource-item" key={resource.name}>
                  <div className="resource-item-top">
                    <div>
                      <strong>{resource.name}</strong>
                      <small>{resource.type}</small>
                    </div>
                    <strong>{inr(resource.monthlyCost)}/mo</strong>
                  </div>

                  <div className="utilisation-label">
                    <span>Utilisation</span>
                    <strong>{resource.utilization}%</strong>
                  </div>

                  <input
                    aria-label={`${resource.name} utilisation`}
                    type="range"
                    min="0"
                    max="100"
                    value={resource.utilization}
                    onChange={(event) =>
                      setResources((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                utilization: Number(event.target.value),
                              }
                            : item
                        )
                      )
                    }
                  />

                  <div className="utilisation-track">
                    <span
                      style={{
                        width: `${resource.utilization}%`,
                        background:
                          resource.utilization < 30 ? "#d97706" : "#2563eb",
                      }}
                    />
                  </div>

                  <small
                    className={
                      resource.utilization < 30
                        ? "resource-warning"
                        : "resource-ok"
                    }
                  >
                    {resource.utilization < 30
                      ? "Review for possible underutilisation"
                      : "No low-utilisation flag"}
                  </small>
                </div>
              ))}
            </div>

            <div className="lab-result">
              <span>ILLUSTRATIVE SAVINGS SCENARIO</span>
              <strong>{inr(potentialSavings)} per month</strong>
              <small>
                Assumes a hypothetical 30% saving on flagged resources. This
                is not a guaranteed saving.
              </small>
            </div>
          </section>

          <section className="lab-card lab-card-wide" style={cardStyle}>
  <CarbonAnalytics />
</section>
<section className="lab-card" style={cardStyle}>
            <div className="lab-card-heading">
              <span className="lab-card-number">05</span>
              <div>
                <h3>Scalability simulator</h3>
                <p>Model growth in monthly users.</p>
              </div>
            </div>

            <label htmlFor="users">
              Current monthly users: {users.toLocaleString("en-IN")}
            </label>
            <input
              id="users"
              style={fieldStyle}
              type="range"
              min="100"
              max="10000"
              step="100"
              value={users}
              onChange={(event) => setUsers(Number(event.target.value))}
            />

            <label htmlFor="growth">Workload growth multiplier</label>
            <select
              id="growth"
              style={fieldStyle}
              value={growth}
              onChange={(event) => setGrowth(Number(event.target.value))}
            >
              <option value={1}>1× - No growth</option>
              <option value={2}>2× - Double</option>
              <option value={5}>5× - Five times</option>
              <option value={10}>1×— - Ten times</option>
            </select>

            <div className="sustainability-score">
              <span>Projected monthly users</span>
              <strong>{projectedUsers.toLocaleString("en-IN")}</strong>
            </div>

            <p>
              {projectedUsers > 5000
                ? "High-growth scenario: plan load tests, capacity changes, and scaling policies."
                : "Validate capacity using load testing before production deployment."}
            </p>
          </section>

          <section className="lab-card" style={cardStyle}>
            <div className="lab-card-heading">
              <span className="lab-card-number">06</span>
              <div>
                <h3>Security Posture Centre</h3>
                <p>Review eight essential cloud security controls and track remediation progress.</p>
              </div>
            </div>

            <div className="security-summary">
              <div>
                <span className="security-summary-label">Posture score</span>
                <strong>{checks.reduce((score, done, index) => score + (done ? SECURITY_CONTROLS[index].points : 0), 0)}/100</strong>
              </div>
              <div>
                <span className="security-summary-label">Controls reviewed</span>
                <strong>{checks.filter(Boolean).length}/8</strong>
              </div>
              <div>
                <span className="security-summary-label">Critical gaps</span>
                <strong>{SECURITY_CONTROLS.filter((control, index) => control.priority === "Critical" && !checks[index]).length}</strong>
              </div>
            </div>

            <div className="security-progress">
              <span
                style={{
                  width: `${checks.reduce((score, done, index) => score + (done ? SECURITY_CONTROLS[index].points : 0), 0)}%`,
                }}
              />
            </div>

            <div className="security-controls">
              {SECURITY_CONTROLS.map((control, index) => (
                <label className="security-check" key={control.label}>
                  <input
                    type="checkbox"
                    checked={checks[index]}
                    onChange={(event) =>
                      setChecks((current) =>
                        current.map((done, itemIndex) =>
                          itemIndex === index ? event.target.checked : done
                        )
                      )
                    }
                  />
                  <span className="security-control-copy">
                    <span>{control.label}</span>
                    <small className={`security-priority security-priority-${control.priority.toLowerCase()}`}>
                      {control.priority} priority
                    </small>
                  </span>
                </label>
              ))}
            </div>

            <div className="security-remediation">
              <h4>Priority remediation actions</h4>
              {SECURITY_CONTROLS.filter((control, index) => !checks[index])
                .sort((a, b) => {
                  const order = { Critical: 0, High: 1, Medium: 2 };
                  return order[a.priority] - order[b.priority];
                })
                .slice(0, 3)
                .map((control) => (
                  <div className="security-remediation-item" key={control.label}>
                    <span>{control.label}</span>
                    <strong>{control.priority}</strong>
                  </div>
                ))}
              {checks.every(Boolean) && (
                <p className="security-complete">All checklist controls are marked complete.</p>
              )}
            </div></section>
        </div>

        {/* NEW: REAL TRAINED MODEL CONNECTED THROUGH THE NODE API */}
        <section
          className="lab-card"
          style={{ ...cardStyle, marginTop: 24 }}
        >
          <div className="lab-card-heading">
            <span className="lab-card-number">07</span>
            <div>
              <h3>Machine-learning CPU predictor</h3>
              <p>
                Predict the next recorded CPU-utilisation value using your
                trained model.
              </p>
            </div>
          </div>

          
<div className="ml-intro-banner">
  <div className="ml-intro-icon">✦</div>
  <div>
    <h3>AI-powered workload forecasting</h3>
    <p>
      Explore predictive workload intelligence to anticipate CPU demand,
      understand resource pressure, and support smarter capacity-planning
      decisions.
    </p>
  </div>
</div>


          <form onSubmit={runMlPrediction}>
            <div className="lab-grid" style={{ marginTop: 20 }}>
              {RESOURCE_FEATURES.map(([key, label]) => (
                <div key={key}>
                  <label htmlFor={`ml-${key}`}>{label}</label>
                  <input
                    id={`ml-${key}`}
                    style={fieldStyle}
                    type="number"
                    step="any"
                    required
                    value={mlInputs[key]}
                    onChange={(event) => {
                      setMlInputs((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }));
                      setMlPrediction(null);
                    }}
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="lab-reset-button"
              disabled={mlLoading}
              style={{
                marginRight: 12,
                marginBottom: 12,
                opacity: mlLoading ? 0.6 : 1,
              }}
            >
              {mlLoading ? "Predicting..." : "Run ML prediction"}
            </button>

            <button
              type="button"
              className="lab-reset-button"
              onClick={resetMlInputs}
              style={{ marginBottom: 12 }}
            >
              Reset ML inputs
            </button>
          </form>

          <p role="status" style={{ color: "#64748b", marginTop: 8 }}>
            {mlStatus}
          </p>

          {mlPrediction && (
            <div className="lab-result" style={{ marginTop: 16 }}>
<span>AI WORKLOAD FORECAST</span>              <strong style={{ fontSize: 30 }}>
                {mlPrediction.predicted_next_cpu}
              </strong>
              <p>
                {mlPrediction.unit || "Dataset CPU-utilization units"}
              </p>
              <small>
  Predictive model Â· CPU workload analysis
</small>
              <p style={{ marginTop: 8 }}>
                {"Forecast generated from the entered workload indicators."}
                </p>
            </div>
          )}
        </section>

        <section
          className="lab-card recommendation-card"
          style={{ ...cardStyle, marginTop: 24 }}
        >
          <div className="lab-card-heading">
            <span className="lab-card-number">08</span>
            <div>
              <h3>CloudWise recommendation engine</h3>
              <p>
                Recommendations based on the current illustrative scenario.
              </p>
            </div>
          </div>

          <p style={{ color: "#64748b", marginBottom: 16 }}>{apiStatus}</p>

          {apiAnalysis && (
            <div className="lab-result" style={{ marginBottom: 20 }}>
              <span>BACKEND ANALYSIS Â· SIMULATED DATA</span>
              <strong>
                {apiAnalysis.withinBudget ? "Within budget" : "Over budget"}
              </strong>
              <p>Estimated monthly cost: {inr(apiAnalysis.totalCost)}</p>
              <p>
                Potential monthly savings: {inr(apiAnalysis.potentialSavings)}
              </p>
              <p>
                Projected monthly cost: {inr(apiAnalysis.projectedCost)}
              </p>
              <p>Deployment advice: {apiAnalysis.deploymentAdvice}</p>
            </div>
          )}

          <ol className="recommendation-list">
            {(apiAnalysis?.recommendations || localRecommendations).map(
              (recommendation, index) => (
                <li key={index}>
                  <span className="recommendation-check">◷</span>
                  <span>{recommendation}</span>
                </li>
              )
            )}
          </ol>

          {apiAnalysis?.note && <small>{apiAnalysis.note}</small>}

          <div style={{ marginTop: 20 }}>
            <button
              type="button"
              className="lab-reset-button"
              onClick={downloadTextReport}
              disabled={!apiAnalysis}
              style={{ marginRight: 12, marginBottom: 12 }}
            >
              Download Analysis Report
            </button>

            <button
              type="button"
              className="lab-reset-button"
              onClick={downloadPdfReport}
              disabled={!apiAnalysis}
              style={{
                marginRight: 12,
                marginBottom: 12,
                background: "#163b70",
                color: "#fff",
              }}
            >
              Download PDF Report
            </button>

            <button
              type="button"
              className="lab-reset-button"
              onClick={resetScenario}
              style={{ marginBottom: 12 }}
            >
              Reset demo scenario
            </button>
          </div>
        </section>

        <footer className="lab-footer">
          <strong>CloudWise</strong>
          <span>Cloud optimisation decision-support prototype</span>
          <span>
Cloud intelligence Â· Cost analysis Â· Predictive planning
          </span>
        </footer>
      </div>
    </div>
  );
}

