
from pathlib import Path
import json

import joblib
import numpy as np
import pandas as pd
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.pipeline import make_pipeline

BASE = Path(__file__).resolve().parent
DATA = BASE / "data" / "alibaba-trace-2017" / "server_usage.csv"
MODEL_DIR = BASE / "models"
MODEL_DIR.mkdir(exist_ok=True)

COLS = [
    "timestamp", "machineID", "util:CPU", "util:memory",
    "util:disk", "load1", "load5", "load15"
]

FEATURES = [
    "util:CPU", "util:memory", "util:disk",
    "load1", "load5", "load15"
]

TARGET = "target_next_cpu"
NEXT_TIMESTAMP = "target_timestamp"


def main():
    print("CLOUDWISE: CHRONOLOGICAL CPU MODEL EVALUATION")

    if not DATA.exists():
        raise FileNotFoundError(f"Dataset not found: {DATA}")

    df = pd.read_csv(DATA, header=None, names=COLS)
    df = df.drop_duplicates().dropna(subset=COLS)
    df = df.replace([np.inf, -np.inf], np.nan)
    df = df.dropna(subset=FEATURES)
    df = df.sort_values(["machineID", "timestamp"]).copy()

    # Create the next CPU reading and its timestamp for each machine.
    grouped = df.groupby("machineID", sort=False)
    df[TARGET] = grouped["util:CPU"].shift(-1)
    df[NEXT_TIMESTAMP] = grouped["timestamp"].shift(-1)

    df = df.dropna(subset=[TARGET, NEXT_TIMESTAMP])
    df = df.sort_values("timestamp").reset_index(drop=True)

    # Split globally by time, keeping identical timestamps together.
    unique_times = np.sort(df["timestamp"].unique())
    if len(unique_times) < 2:
        raise ValueError("Not enough distinct timestamps for a time-based split.")

    cutoff_index = int(len(unique_times) * 0.8)
    cutoff_index = min(max(cutoff_index, 1), len(unique_times) - 1)
    cutoff = unique_times[cutoff_index]

    # Exclude boundary-crossing targets from training.
    train = df[
        (df["timestamp"] < cutoff)
        & (df[NEXT_TIMESTAMP] < cutoff)
    ].copy()

    # Evaluate only future records whose target is also in the test period.
    test = df[
        (df["timestamp"] >= cutoff)
        & (df[NEXT_TIMESTAMP] >= cutoff)
    ].copy()

    if train.empty or test.empty:
        raise ValueError(
            "The chronological split produced an empty train or test set."
        )

    X_train, y_train = train[FEATURES], train[TARGET]
    X_test, y_test = test[FEATURES], test[TARGET]

    baseline = DummyRegressor(strategy="mean")
    baseline.fit(X_train, y_train)
    base_pred = baseline.predict(X_test)

    model = make_pipeline(
        SimpleImputer(strategy="median"),
        HistGradientBoostingRegressor(
            max_iter=100,
            max_leaf_nodes=15,
            learning_rate=0.08,
            l2_regularization=1.0,
            random_state=42
        )
    )

    print(f"Training rows: {len(train):,}")
    print(f"Testing rows: {len(test):,}")
    print(f"Timestamp cutoff: {cutoff}")
    print("Training model...")

    model.fit(X_train, y_train)
    pred = model.predict(X_test)

    results = {
        "dataset": "Alibaba Cluster Trace 2017 server_usage.csv",
        "target": "next recorded CPU utilization",
        "features": FEATURES,
        "train_rows": len(train),
        "test_rows": len(test),
        "split_type": "chronological_by_timestamp",
        "timestamp_cutoff": float(cutoff),
        "baseline_mae": round(
            float(mean_absolute_error(y_test, base_pred)), 4
        ),
        "model_mae": round(
            float(mean_absolute_error(y_test, pred)), 4
        ),
        "baseline_rmse": round(
            float(np.sqrt(mean_squared_error(y_test, base_pred))), 4
        ),
        "model_rmse": round(
            float(np.sqrt(mean_squared_error(y_test, pred))), 4
        ),
    }

    joblib.dump(model, MODEL_DIR / "cpu_prediction_model.joblib")

    (MODEL_DIR / "evaluation.json").write_text(
        json.dumps(results, indent=2),
        encoding="utf-8"
    )

    print("\nEVALUATION RESULTS")
    print(json.dumps(results, indent=2))
    print(f"\nSaved model: {MODEL_DIR / 'cpu_prediction_model.joblib'}")
    print(f"Saved metrics: {MODEL_DIR / 'evaluation.json'}")
    print("\nDone! Evaluation used a chronological held-out test period.")


if __name__ == "__main__":
    main()
