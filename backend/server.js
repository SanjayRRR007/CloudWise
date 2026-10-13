
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { STSClient, GetCallerIdentityCommand } =
  require('@aws-sdk/client-sts');

const app = express();
const PORT = process.env.PORT || 5000;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const ML_API_URL = 'http://127.0.0.1:5001';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));

app.use(express.json());

// Backend health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CloudWise API',
    message: 'Backend is running'
  });
});

// AWS connection status
app.get('/api/aws/status', async (req, res) => {
  const client = new STSClient({ region: AWS_REGION });

  try {
    const result = await client.send(
      new GetCallerIdentityCommand({})
    );

    res.json({
      connected: true,
      provider: 'AWS',
      region: AWS_REGION,
      account: result.Account,
      message: 'AWS connection successful'
    });
  } catch (error) {
    console.error('AWS status check failed:', error.name);

    res.status(503).json({
      connected: false,
      provider: 'AWS',
      region: AWS_REGION,
      message: 'AWS credentials are not configured for this backend yet'
    });
  }
});

// Cost and resource analysis
app.post('/api/analyze', (req, res) => {
  try {
    const {
      resources = [],
      budget = 45000,
      users = 1000,
      growth = 2,
      security = 'medium',
      deployment = 'balanced'
    } = req.body || {};

    if (!Array.isArray(resources)) {
      return res.status(400).json({
        error: 'Resources must be an array.'
      });
    }

    const validResources = resources.every(
      (r) =>
        typeof r.name === 'string' &&
        Number.isFinite(r.monthlyCost) &&
        r.monthlyCost >= 0 &&
        Number.isFinite(r.utilization) &&
        r.utilization >= 0 &&
        r.utilization <= 100
    );

    if (!validResources) {
      return res.status(400).json({
        error: 'Resource costs or utilisation values are invalid.'
      });
    }

    const totalCost = resources.reduce(
      (sum, r) => sum + r.monthlyCost, 0
    );

    const underutilized = resources.filter(
      (r) => r.utilization < 30
    );

    const potentialSavings = underutilized.reduce(
      (sum, r) => sum + r.monthlyCost * 0.3, 0
    );

    const recommendations = [];

    if (totalCost > budget) {
      recommendations.push(
        `The estimated monthly cost exceeds your budget by ₹${(totalCost - budget).toLocaleString('en-IN')}. Review resource sizes and workload needs.`
      );
    } else {
      recommendations.push(
        `The estimated monthly cost is within budget, with ₹${(budget - totalCost).toLocaleString('en-IN')} remaining.`
      );
    }

    underutilized.forEach((r) => {
      recommendations.push(
        `${r.name} is using ${r.utilization}% of its capacity. Review whether resizing or consolidation is appropriate.`
      );
    });

    recommendations.push(
      security === 'high'
        ? 'Prioritise least-privilege access, encryption, backups, logging, and compliance requirements.'
        : 'Review access permissions, encryption, backups, and monitoring.'
    );

    recommendations.push(
      users * growth > 5000
        ? 'The projected workload is high. Plan load testing and validate scaling capacity.'
        : 'Validate workload capacity with load testing before increasing production traffic.'
    );

    const deploymentAdvice =
      security === 'high'
        ? 'Private or carefully designed hybrid cloud'
        : deployment === 'budget'
          ? 'Public cloud — cost-conscious starting point'
          : deployment === 'control'
            ? 'Private cloud — greater control and responsibility'
            : 'Hybrid cloud — balance of flexibility and control';

    res.json({
      mode: 'simulated',
      currency: 'INR',
      totalCost,
      budget,
      withinBudget: totalCost <= budget,
      underutilizedCount: underutilized.length,
      potentialSavings,
      projectedCost: totalCost - potentialSavings,
      deploymentAdvice,
      recommendations,
      note: 'Illustrative estimates based on simulated inputs, not live cloud data.'
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Could not analyse this scenario.'
    });
  }
});

// ML CPU prediction
app.post('/api/ml/predict', async (req, res) => {
  try {
    const response = await fetch(`${ML_API_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(result);
    }

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('ML prediction service failed:', error.message);
    res.status(503).json({
      success: false,
      error: 'ML service unavailable. Check whether Python app.py is running.'
    });
  }
});

// NEW: fetch measured model evaluation metrics
app.get('/api/ml/metrics', async (req, res) => {
  try {
    const response = await fetch(`${ML_API_URL}/metrics`);
    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(result);
    }

    res.json({
      success: true,
      ...result,
      evaluationType: 'Existing model evaluation',
      dataSource: 'Alibaba Cluster Trace 2017',
      warning: 'Historical dataset evaluation, not live cloud telemetry.'
    });
  } catch (error) {
    console.error('ML metrics service failed:', error.message);
    res.status(503).json({
      success: false,
      error: 'ML metrics unavailable. Check whether Python app.py is running.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`CloudWise API running at http://localhost:${PORT}`);
});
