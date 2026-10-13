
from pathlib import Path

import joblib
import json
import numpy as np
from flask import Flask, jsonify, request

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "cpu_prediction_model.joblib"
METRICS_PATH = BASE_DIR / "models" / "evaluation.json"

app = Flask(__name__)

FEATURES = [
    "util:CPU",
    "util:memory",
    "util:disk",
    "load1",
    "load5",
    "load15",
]

model = joblib.load(MODEL_PATH)

with open(METRICS_PATH, "r", encoding="utf-8") as file:
    metrics = json.load(file)


@app.get("/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "CloudWise ML API",
        "model_loaded": True,
    })


@app.get("/metrics")
def get_metrics():
    return jsonify(metrics)


@app.post("/predict")
def predict():
    body = request.get_json(silent=True)

    if not isinstance(body, dict):
        return jsonify({"error": "Send a JSON object"}), 400

    missing = [name for name in FEATURES if name not in body]
    if missing:
        return jsonify({
            "error": "Missing required features",
            "missing": missing,
        }), 400

    try:
        values = [float(body[name]) for name in FEATURES]
    except (TypeError, ValueError):
        return jsonify({
            "error": "All features must be numeric"
        }), 400

    if not np.isfinite(values).all():
        return jsonify({
            "error": "All features must be finite numbers"
        }), 400

    prediction = float(
        model.predict([values])[0]
    )

    return jsonify({
        "predicted_next_cpu": round(prediction, 3),
        "unit": "dataset CPU-utilization units",
        "model": "HistGradientBoostingRegressor",
        "data_source": "Alibaba Cluster Trace 2017",
        "warning": (
            "Historical dataset prediction; not live cloud telemetry."
        ),
    })


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=False)
