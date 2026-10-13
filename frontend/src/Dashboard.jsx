
import { useEffect, useState } from 'react';
import './Dashboard.css';

const API_URL = 'https://cloudwise-chs3.onrender.com';
const resources = [
  { name: 'Storage', description: 'Example storage resources', count: 48, letter: 'S', type: 'storage' },
  { name: 'Compute', description: 'Example compute resources', count: 32, letter: 'C', type: 'compute' },
  { name: 'Networking', description: 'Example compute and network infrastructure', count: 48, letter: 'N', type: 'network' },
];

const weeklyUsage = [
  { day: 'Mon', value: 42 },
  { day: 'Tue', value: 58 },
  { day: 'Wed', value: 48 },
  { day: 'Thu', value: 72 },
  { day: 'Fri', value: 61 },
  { day: 'Sat', value: 85 },
  { day: 'Sun', value: 67 },
];

const inr = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

const metricNumber = (value) =>
  Number.isFinite(Number(value)) ? Number(value).toFixed(2) : '—';

const recordNumber = (value) =>
  Number.isFinite(Number(value))
    ? Number(value).toLocaleString('en-IN')
    : '—';

function Dashboard() {
  const [health, setHealth] = useState('checking');
  const [aws, setAws] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [mlMetrics, setMlMetrics] = useState(null);
  const [mlStatus, setMlStatus] = useState('loading');
  const [mlError, setMlError] = useState('');

  async function checkConnections() {
    setHealth('checking');
    setAws(null);

    try {
      const response = await fetch(`${API_URL}/api/health`);
      if (!response.ok) throw new Error('Backend health check failed');

      const data = await response.json();
      setHealth(data.status === 'ok' ? 'connected' : 'error');
    } catch {
      setHealth('error');
    }

    try {
      const response = await fetch(`${API_URL}/api/aws/status`);
      if (!response.ok) throw new Error('AWS status request failed');

      setAws(await response.json());
    } catch {
      setAws({
        connected: false,
        message: 'Backend is unreachable',
      });
    }

    setLastChecked(new Date().toLocaleTimeString('en-IN'));
  }

  async function loadMlMetrics() {
    setMlStatus('loading');
    setMlError('');

    try {
      const response = await fetch(`${API_URL}/api/ml/metrics`);
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.error || 'Could not load model performance.');
      }

      setMlMetrics(data);
      setMlStatus('loaded');
    } catch (error) {
      setMlMetrics(null);
      setMlError(error.message || 'Could not connect to the AI service.');
      setMlStatus('error');
    }
  }

  useEffect(() => {
    checkConnections();
    loadMlMetrics();
  }, []);

  const backendOnline = health === 'connected';

  const maeImprovement =
    mlMetrics &&
    Number(mlMetrics.baseline_mae) > 0 &&
    Number.isFinite(Number(mlMetrics.model_mae))
      ? (
          (1 -
            Number(mlMetrics.model_mae) /
              Number(mlMetrics.baseline_mae)) *
          100
        )
      : null;

  const rmseImprovement =
    mlMetrics &&
    Number(mlMetrics.baseline_rmse) > 0 &&
    Number.isFinite(Number(mlMetrics.model_rmse))
      ? (
          (1 -
            Number(mlMetrics.model_rmse) /
              Number(mlMetrics.baseline_rmse)) *
          100
        )
      : null;

  return (
    <div className="dashboard-page">
      <header className="dashboard-topbar">
        <a className="dashboard-brand" href="/">
          <span className="dashboard-cloud-icon">☁</span>
          <span>CloudWise</span>
        </a>

        <div className="dashboard-topbar-right">
          <span className="dashboard-label">Decision Intelligence</span>
          <span className="dashboard-demo-indicator">
            <span /> Prototype
          </span>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-intro">
          <div>
            <p className="dashboard-kicker">YOUR WORKSPACE / OVERVIEW</p>
            <h1>Cloud Intelligence Dashboard</h1>
            <p className="dashboard-subtitle">
              Monitor illustrative cloud costs, assess resource efficiency,
              and explore AI-driven workload forecasting.
            </p>
          </div>
          <span className="dashboard-demo-badge">DEMO ENVIRONMENT</span>
        </section>

        <section className="dashboard-metrics">
          <article className="dashboard-metric-card">
            <div className="dashboard-metric-icon blue">☁</div>
            <p>Total cloud resources</p>
            <strong>128</strong>
            <small>Illustrative inventory</small>
          </article>

          <article className="dashboard-metric-card">
            <div className="dashboard-metric-icon green">₹</div>
            <p>Estimated monthly cost</p>
            <strong>{inr(42000)}</strong>
            <small>Indicative cost scenario</small>
          </article>

          <article className="dashboard-metric-card">
            <div className="dashboard-metric-icon purple">↗</div>
            <p>Average utilisation</p>
            <strong>72%</strong>
            <small>Illustrative workload metric</small>
          </article>

          <article className="dashboard-metric-card">
            <div className="dashboard-metric-icon orange">⌁</div>
            <p>Resources to review</p>
            <strong>2</strong>
            <small>Example optimisation candidates</small>
          </article>
        </section>

        {/* Predictive intelligence */}
        <section
          className="dashboard-panel"
          style={{ marginBottom: 24 }}
        >
          <div className="dashboard-panel-heading">
            <div>
              <p className="dashboard-kicker">AI / PREDICTIVE ANALYTICS</p>
              <h2>Predictive Intelligence</h2>
              <p>
                Evaluate workload forecasting performance and compare
                intelligent predictions against a reference model.
              </p>
            </div>

            <button
              type="button"
              className="dashboard-refresh-button"
              onClick={loadMlMetrics}
              disabled={mlStatus === 'loading'}
            >
              {mlStatus === 'loading' ? 'Loading…' : '↻ Refresh'}
            </button>
          </div>

          {mlStatus === 'loading' && (
            <p role="status" style={{ padding: 16 }}>
              Retrieving AI performance indicators…
            </p>
          )}

          {mlStatus === 'error' && (
            <div
              role="alert"
              style={{
                margin: 16,
                padding: 16,
                borderRadius: 10,
                background: '#fff1f0',
                color: '#8a2525',
              }}
            >
              <strong>Predictive service unavailable</strong>
              <p>{mlError}</p>
              <p>
                Check that the Python model service and Node.js backend
                are running, then refresh.
              </p>
            </div>
          )}

          {mlStatus === 'loaded' && mlMetrics && (
            <div style={{ padding: '12px 16px 20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                  marginBottom: 18,
                }}
              >
                <span className="dashboard-chart-badge">
                  MODEL EVALUATED
                </span>
                <span className="connection-status-pill online">
                  <span />
                  AI service available
                </span>
              </div>

              <h3 style={{ marginBottom: 6 }}>
                CPU Workload Forecasting
              </h3>
              <p style={{ marginTop: 0, marginBottom: 22 }}>
                Predicts the next recorded CPU utilisation value using
                historical workload characteristics.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                  gap: 14,
                  marginBottom: 24,
                }}
              >
                <article className="dashboard-metric-card">
                  <p>MAE Improvement</p>
                  <strong>
                    {maeImprovement !== null
                      ? `${maeImprovement.toFixed(1)}%`
                      : '—'}
                  </strong>
                  <small>Compared with reference baseline</small>
                </article>

                <article className="dashboard-metric-card">
                  <p>Forecast Error (MAE)</p>
                  <strong>{metricNumber(mlMetrics.model_mae)}</strong>
                  <small>Lower is better</small>
                </article>

                <article className="dashboard-metric-card">
                  <p>Forecast Error (RMSE)</p>
                  <strong>{metricNumber(mlMetrics.model_rmse)}</strong>
                  <small>Penalises larger errors more heavily</small>
                </article>

                <article className="dashboard-metric-card">
                  <p>Evaluation Coverage</p>
                  <strong>
                    {recordNumber(
                      Number(mlMetrics.train_rows) +
                        Number(mlMetrics.test_rows)
                    )}
                  </strong>
                  <small>Records in the reported evaluation split</small>
                </article>
              </div>

              <div className="dashboard-content-grid">
                <article className="dashboard-panel" style={{ padding: 18 }}>
                  <h3>Reference Model vs AI Model</h3>
                  <p>Mean absolute error (MAE)</p>

                  {[
                    {
                      label: 'Reference',
                      value: Number(mlMetrics.baseline_mae),
                    },
                    {
                      label: 'AI model',
                      value: Number(mlMetrics.model_mae),
                    },
                  ].map((item) => {
                    const maximum = Math.max(
                      Number(mlMetrics.baseline_mae),
                      Number(mlMetrics.model_mae),
                      0.01
                    );

                    return (
                      <div key={item.label} style={{ marginBottom: 16 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 12,
                            marginBottom: 6,
                          }}
                        >
                          <span>{item.label}</span>
                          <strong>{metricNumber(item.value)}</strong>
                        </div>
                        <div
                          style={{
                            height: 10,
                            background: '#e8edf3',
                            borderRadius: 99,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.max(0, Math.min(100, item.value / maximum * 100))}%`,
                              background:
                                item.label === 'AI model'
                                  ? '#16a085'
                                  : '#7b8da5',
                              borderRadius: 99,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </article>

                <article className="dashboard-panel" style={{ padding: 18 }}>
                  <h3>Model Configuration</h3>
                  <p>
                    <strong>Algorithm</strong>
                    <br />
                    {mlMetrics.model || 'HistGradientBoostingRegressor'}
                  </p>
                  <p>
                    <strong>Training records</strong>
                    <br />
                    {recordNumber(mlMetrics.train_rows)}
                  </p>
                  <p>
                    <strong>Evaluation records</strong>
                    <br />
                    {recordNumber(mlMetrics.test_rows)}
                  </p>
                  <p>
                    <strong>Input signals</strong>
                    <br />
                    {Array.isArray(mlMetrics.features)
                      ? `${mlMetrics.features.length} workload indicators`
                      : 'Workload indicators'}
                  </p>
                </article>
              </div>

              {rmseImprovement !== null && (
                <p style={{ marginTop: 18 }}>
                  The model's RMSE is{' '}
                  <strong>{rmseImprovement.toFixed(1)}% lower</strong>{' '}
                  than the reference baseline on the reported evaluation
                  split.
                </p>
              )}

              <details style={{ marginTop: 18 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                  Methodology and validation details
                </summary>
                <div
                  style={{
                    marginTop: 12,
                    padding: 14,
                    background: '#f4f6f8',
                    borderRadius: 8,
                    fontSize: 13,
                    lineHeight: 1.7,
                  }}
                >
                  <p>
                    Performance values are calculated from a historical
                    workload benchmark. They measure prediction error and
                    do not represent percentage prediction accuracy.
                  </p>
                  <p>
                    The current train/test evaluation is preliminary.
                    Strict chronological validation and testing against
                    live infrastructure data have not yet been completed.
                  </p>
                </div>
              </details>
            </div>
          )}
        </section>

        <section className="dashboard-panel connection-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>System connections</h2>
              <p>Connectivity checks for the local application</p>
            </div>

            <button
              type="button"
              className="dashboard-refresh-button"
              onClick={checkConnections}
              disabled={health === 'checking'}
            >
              {health === 'checking' ? 'Checking…' : '↻ Refresh status'}
            </button>
          </div>

          <div className="connection-grid">
            <article className="connection-status-card">
              <div className="connection-card-title">
                <span className="connection-status-icon">API</span>
                <div>
                  <strong>CloudWise backend</strong>
                  <small>Node.js / Express</small>
                </div>
              </div>

              <span
                className={`connection-status-pill ${
                  backendOnline
                    ? 'online'
                    : health === 'checking'
                      ? 'checking'
                      : 'offline'
                }`}
              >
                <span />
                {health === 'checking'
                  ? 'Checking'
                  : backendOnline
                    ? 'Online'
                    : 'Offline'}
              </span>

              <p>
                {backendOnline
                  ? 'Health endpoint is responding.'
                  : health === 'checking'
                    ? 'Contacting local backend…'
                    : 'Could not reach localhost:5000.'}
              </p>
            </article>

            <article className="connection-status-card">
              <div className="connection-card-title">
                <span className="connection-status-icon aws-icon">☁</span>
                <div>
                  <strong>AWS integration</strong>
                  <small>Optional cloud provider connection</small>
                </div>
              </div>

              <span
                className={`connection-status-pill ${
                  aws?.connected
                    ? 'online'
                    : aws === null
                      ? 'checking'
                      : 'offline'
                }`}
              >
                <span />
                {aws === null
                  ? 'Checking'
                  : aws.connected
                    ? 'Connected'
                    : 'Not connected'}
              </span>

              <p>{aws?.message || 'Checking provider credentials…'}</p>

              {aws?.connected && (
                <p className="connection-account">
                  Account: {aws.account} · Region: {aws.region}
                </p>
              )}
            </article>
          </div>

          {lastChecked && (
            <p className="dashboard-last-checked">
              Last checked: {lastChecked}
            </p>
          )}
        </section>

        <div className="dashboard-content-grid">
          <section className="dashboard-panel dashboard-chart-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>Resource utilisation</h2>
                <p>Example weekly workload pattern</p>
              </div>
              <span className="dashboard-chart-badge">SAMPLE</span>
            </div>

            <div className="dashboard-chart-summary">
              <strong>62%</strong>
              <span>Illustrative weekly average</span>
            </div>

            <div className="dashboard-usage-chart">
              {weeklyUsage.map(({ day, value }) => (
                <div className="dashboard-usage-column" key={day}>
                  <span className="dashboard-bar-value">{value}%</span>
                  <div className="dashboard-bar-track">
                    <div
                      className="dashboard-usage-bar"
                      style={{ height: `${value}%` }}
                      title={`${day}: ${value}% utilisation`}
                    />
                  </div>
                  <span className="dashboard-day-label">{day}</span>
                </div>
              ))}
            </div>

            <div className="dashboard-chart-legend">
              <span />
              Sample utilisation
            </div>
          </section>

          <section className="dashboard-panel dashboard-resource-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>Resource inventory</h2>
                <p>Illustrative resource breakdown</p>
              </div>
            </div>

            <div className="dashboard-inventory-total">
              <strong>128</strong>
              <span>total example resources</span>
            </div>

            {resources.map((resource) => (
              <div className="dashboard-resource-row" key={resource.name}>
                <span className={`dashboard-resource-symbol ${resource.type}`}>
                  {resource.letter}
                </span>

                <div className="dashboard-resource-info">
                  <strong>{resource.name}</strong>
                  <small>{resource.description}</small>
                </div>

                <span className="dashboard-resource-count">
                  {resource.count}
                </span>
              </div>
            ))}

            <p className="dashboard-inventory-note">
              Inventory values are illustrative and are not connected to a live cloud account.
            </p>
          </section>
        </div>

        <section className="dashboard-cta">
          <div>
            <span className="dashboard-cta-kicker">NEXT STEP</span>
            <h2>Ready to optimise your cloud?</h2>
            <p>
              Explore deployment choices, estimated costs, resource wastage,
              sustainability, and security considerations.
            </p>
          </div>

          <button
            type="button"
            className="dashboard-cta-button"
            onClick={() => {
              window.dispatchEvent(new Event('cloudwise:open-lab'));
            }}
          >
            Open Optimisation Lab →
          </button>
        </section>

        <footer className="dashboard-footer">
          <strong>CloudWise</strong>
          <span>AI-assisted cloud optimisation decision-support prototype</span>
          <span>INR · Predictive analytics · Decision support</span>
        </footer>
      </main>
    </div>
  );
}

export default Dashboard;
