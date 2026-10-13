
import "./CostAnalytics.css";

const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function CostAnalytics({ resources = [] }) {
  const total = resources.reduce((sum, item) => sum + item.monthlyCost, 0);

  const flagged = resources.filter((item) => item.utilization < 30);

  const savings = flagged.reduce(
    (sum, item) => sum + item.monthlyCost * 0.3,
    0
  );

  const optimised = total - savings;
  const maxCost = Math.max(total, 1);

  return (
    <section className="cost-analytics">
      <div className="ca-heading">
        <div>
          <span className="ca-kicker">COST INTELLIGENCE</span>
          <h2>Monthly cost analysis</h2>
          <p>Compare your current scenario with a potential optimisation.</p>
        </div>
        <span className="ca-demo-badge">SIMULATED ESTIMATES</span>
      </div>

      <div className="ca-summary-grid">
        <article className="ca-summary-card">
          <span>Current estimated cost</span>
          <strong>{formatINR(total)}</strong>
          <small>Per month</small>
        </article>

        <article className="ca-summary-card">
          <span>Potential savings</span>
          <strong className="ca-green">{formatINR(savings)}</strong>
          <small>Illustrative 30% reduction on flagged resources</small>
        </article>

        <article className="ca-summary-card">
          <span>Potential cost after optimisation</span>
          <strong>{formatINR(optimised)}</strong>
          <small>Scenario estimate, not guaranteed savings</small>
        </article>
      </div>

      <div className="ca-chart-card">
        <h3>Before vs. after optimisation</h3>

        <div className="ca-chart">
          <div className="ca-chart-row">
            <span className="ca-bar-label">Current cost</span>
            <div className="ca-track">
              <div
                className="ca-bar ca-current"
                style={{ width: `${(total / maxCost) * 100}%` }}
              />
            </div>
            <strong>{formatINR(total)}</strong>
          </div>

          <div className="ca-chart-row">
            <span className="ca-bar-label">After optimisation</span>
            <div className="ca-track">
              <div
                className="ca-bar ca-optimised"
                style={{ width: `${(optimised / maxCost) * 100}%` }}
              />
            </div>
            <strong>{formatINR(optimised)}</strong>
          </div>
        </div>

        <div className="ca-chart-note">
          <span className="ca-note-dot" />
          Lower-cost scenario assumes flagged resources can be reduced
          by 30%, without accounting for migration or operational costs.
        </div>
      </div>

      <div className="ca-chart-card">
        <h3>Resource cost breakdown</h3>
        <p className="ca-muted">Share of the total simulated monthly cost</p>

        {resources.map((resource) => {
          const share =
            total > 0 ? (resource.monthlyCost / total) * 100 : 0;

          return (
            <div className="ca-resource-row" key={resource.name}>
              <div className="ca-resource-label">
                <strong>{resource.name}</strong>
                <span>{formatINR(resource.monthlyCost)}</span>
              </div>

              <div
                className="ca-track ca-share-track"
                aria-label={`${resource.name}: ${share.toFixed(1)}% of cost`}
              >
                <div
                  className="ca-bar ca-share"
                  style={{ width: `${share}%` }}
                />
              </div>

              <small>{share.toFixed(1)}% of total</small>
            </div>
          );
        })}

        {resources.length === 0 && (
          <p>No resources are available to analyse.</p>
        )}
      </div>
    </section>
  );
}
