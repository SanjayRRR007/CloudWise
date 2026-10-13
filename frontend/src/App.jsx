
import { useEffect, useState } from 'react'
import './App.css'
import Dashboard from './Dashboard'
import CloudWiseLab from './CloudWiseLab'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
useEffect(() => {
  const openLab = () => setCurrentPage('lab')
  window.addEventListener('cloudwise:open-lab', openLab)

  return () => {
    window.removeEventListener('cloudwise:open-lab', openLab)
  }
}, [])
  if (currentPage === 'lab') {
    return (
      <>
        <button
          className="back-home-button"
          onClick={() => setCurrentPage('dashboard')}
        >
          ← Back to Dashboard
        </button>
        <CloudWiseLab />
      </>
    )
  }

  if (currentPage === 'dashboard') {
    return (
      <>
        <Dashboard />
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', padding: 20, flexWrap: 'wrap' }}>
          <button
            className="nav-button"
            onClick={() => setCurrentPage('lab')}
          >
            Open Cloud Optimisation Lab →
          </button>
          <button
            className="back-home-button"
            onClick={() => setCurrentPage('home')}
          >
            ← Back to Home
          </button>
        </div>
      </>
    )
  }

  return (
    <div className="app">
      <nav className="navbar">
        <a className="logo" href="#">
          <span className="logo-icon">☁</span>
          CloudWise
        </a>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </div>

        <button className="nav-button" onClick={() => setCurrentPage('dashboard')}>
          Get Started →
        </button>
      </nav>

      <main>
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow">✦ SMARTER CLOUD MANAGEMENT</span>

            <h1>
              Your cloud.
              <br />
              <span>Under control.</span>
            </h1>

            <p>
              Simplify cloud management, understand your
              resources, and make smarter decisions with
              CloudWise.
            </p>

            <div className="hero-actions">
              <button
                className="primary-button"
                onClick={() => setCurrentPage('dashboard')}
              >
                Explore CloudWise →
              </button>
              <a className="secondary-button" href="#about">
                Learn More
              </a>
            </div>

            <div className="hero-note">
              <span className="status-dot"></span>
              One clear view of your cloud
            </div>
          </div>

          <div className="hero-visual">
            <div className="glow"></div>
            <div className="dashboard-card">
              <div className="dashboard-header">
                <div>
                  <span className="small-label">OVERVIEW</span>
                  <h3>Cloud Dashboard</h3>
                </div>
                <span className="live-badge">● Demo UI</span>
              </div>

              <div className="metric-grid">
                <div className="metric">
                  <span>Cloud resources</span>
                  <strong>128</strong>
                  <small>Sample resources</small>
                </div>
                <div className="metric">
                  <span>Monthly spend</span>
                  <strong>₹22,480</strong>
                  <small>Example estimate</small>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-heading">
                  <span>Resource utilization</span>
                  <span>Sample data</span>
                </div>
                <div className="chart-bars">
                  {[38, 56, 43, 72, 49, 84, 62, 95, 67, 78, 52, 88].map(
                    (height, index) => (
                      <div
                        className="chart-bar"
                        key={index}
                        style={{ height: `${height}%` }}
                      />
                    )
                  )}
                </div>
                <div className="chart-labels">
                  <span>Mon</span><span>Tue</span><span>Wed</span>
                  <span>Thu</span><span>Fri</span><span>Sat</span>
                </div>
              </div>

              <div className="resource-row">
                <span className="resource-icon">☁</span>
                <div className="resource-info">
                  <strong>Cloud infrastructure</strong>
                  <small>Illustrative dashboard preview</small>
                </div>
                <span className="resource-status">Preview</span>
              </div>
            </div>
          </div>
        </section>

        <section className="features" id="features">
          <div className="section-heading">
            <span className="eyebrow">BUILT FOR CLARITY</span>
            <h2>Make your cloud work smarter.</h2>
            <p>
              A simple starting point for understanding
              and managing your cloud environment.
            </p>
          </div>

<div className="feature-grid">
  <article className="feature-card">
    <div className="feature-icon">◈</div>
    <h3>Resource Visibility</h3>
    <p>Bring cloud resources and important resource information into one clear interface.</p>
  </article>

  <article className="feature-card">
    <div className="feature-icon">↗</div>
    <h3>Cost Analytics</h3>
    <p>Explore cloud spending, understand cost patterns, and identify optimization opportunities.</p>
  </article>

  <article className="feature-card">
    <div className="feature-icon">⌁</div>
    <h3>Usage Analytics</h3>
    <p>Explore resource utilization through charts, metrics, and visual summaries.</p>
  </article>

  <article className="feature-card">
    <div className="feature-icon">✦</div>
    <h3>AI / ML Predictions</h3>
    <p>Predict resource usage using a trained machine-learning model and historical data.</p>
  </article>

  <article className="feature-card">
    <div className="feature-icon">⛨</div>
    <h3>Security Posture Centre</h3>
    <p>Review security controls, identify gaps, and prioritize remediation actions.</p>
  </article>

  <article className="feature-card">
    <div className="feature-icon">♧</div>
    <h3>Carbon Analytics</h3>
    <p>Upload supported CSV data and explore environmental impact through visualizations.</p>
  </article>

  <article className="feature-card">
    <div className="feature-icon">✧</div>
    <h3>Optimization Recommendations</h3>
    <p>Discover actionable suggestions to improve cloud efficiency and manage costs.</p>
  </article>

  <article className="feature-card">
    <div className="feature-icon">▤</div>
    <h3>Reports &amp; Insights</h3>
    <p>Present analysis, security findings, and recommendations in readable reports.</p>
  </article>
</div>

        </section>

        <section className="about" id="about">
          <span className="eyebrow">THE CLOUDWISE VISION</span>
          <h2>Less complexity. More clarity.</h2>
          <p>
            CloudWise helps users explore cloud deployment,
            cost, resource efficiency, sustainability, and
            optimisation through a decision-support prototype.
          </p>
        </section>

        
<footer id="contact">
  <a className="logo" href="#">
    <span className="logo-icon">☁</span>
    CloudWise
  </a>
  <span>Building a clearer cloud experience.</span>

  <div className="contact-details">
    <p><strong>Name:</strong> Sanjay Ram R R</p>
    <p><strong>Role:</strong> Project Developer</p>
    <p>
      <strong>Email:</strong>{" "}
      <a href="mailto:sanjay.ramrr2024@vitstudent.ac.in">
        sanjay.ramrr2024@vitstudent.ac.in
      </a>
    </p>
  </div>
</footer>

      </main>
    </div>
  )
}

export default App
