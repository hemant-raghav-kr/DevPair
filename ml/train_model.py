"""
DevPair AI Matching Engine - Model Training Pipeline
Trains an interpretable Logistic Regression model on the synthetic bootstrap dataset.
Exports model parameters to JSON for zero-Python Next.js/Vercel TypeScript inference.
Generates golden test cases for automated numerical parity verification.
"""

import datetime
import json
import os
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

SEED = 42
DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "synthetic_matching_data.json")
ARTIFACT_PATH_ML = os.path.join(os.path.dirname(__file__), "model_artifact.json")
ARTIFACT_PATH_SRC = os.path.join(
    os.path.dirname(__file__), "..", "src", "features", "matching", "model_artifact.json"
)
GOLDEN_PATH_ML = os.path.join(os.path.dirname(__file__), "golden_test_cases.json")
GOLDEN_PATH_SCRATCH = os.path.join(
    os.path.dirname(__file__), "..", "scratch", "golden_test_cases.json"
)

FEATURE_NAMES = [
    "required_skill_match",
    "required_skill_proficiency",
    "skill_category_overlap_ratio",
    "project_category_alignment",
    "availability_fit",
    "total_skills_count_norm",
    "avg_skill_proficiency",
    "advanced_skills_count_norm",
]


def load_dataset(path: str):
    with open(path, "r") as f:
        raw = json.load(f)
    X = np.array([item["features"] for item in raw], dtype=np.float64)
    y = np.array([item["label"] for item in raw], dtype=np.int32)
    return X, y, raw


def train_and_evaluate():
    print(f"Loading synthetic dataset from {DATA_PATH}...")
    X, y, raw_data = load_dataset(DATA_PATH)

    # 80/20 Stratified Train/Test split
    X_train, X_test, y_train, y_test, idx_train, idx_test = train_test_split(
        X, y, np.arange(len(X)), test_size=0.20, random_state=SEED, stratify=y
    )

    print(f"Train samples: {len(X_train)} | Test samples: {len(X_test)}")

    # Train interpretable Logistic Regression
    clf = LogisticRegression(
        C=1.0,
        solver="lbfgs",
        max_iter=1000,
        random_state=SEED,
    )
    clf.fit(X_train, y_train)

    # Evaluation on held-out test split
    y_pred = clf.predict(X_test)
    y_prob = clf.predict_proba(X_test)[:, 1]

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred))
    rec = float(recall_score(y_test, y_pred))
    f1 = float(f1_score(y_test, y_pred))
    auc = float(roc_auc_score(y_test, y_prob))
    cm = confusion_matrix(y_test, y_pred).tolist()

    print("\n==================================================")
    print("HELD-OUT TEST SET EVALUATION")
    print("==================================================")
    print(f"Accuracy:  {acc * 100:.2f}%")
    print(f"Precision: {prec * 100:.2f}%")
    print(f"Recall:    {rec * 100:.2f}%")
    print(f"F1 Score:  {f1 * 100:.2f}%")
    print(f"ROC-AUC:   {auc:.4f}")
    print(f"Confusion Matrix:\n  TN: {cm[0][0]}, FP: {cm[0][1]}\n  FN: {cm[1][0]}, TP: {cm[1][1]}")

    weights = clf.coef_[0].tolist()
    intercept = float(clf.intercept_[0])

    print("\n==================================================")
    print("FEATURE COEFFICIENTS & INTERCEPT")
    print("==================================================")
    for name, w in zip(FEATURE_NAMES, weights):
        print(f"  {name:30s}: {w:+.4f}")
    print(f"  {'intercept':30s}: {intercept:+.4f}")

    # Build model artifact
    artifact = {
        "modelType": "LogisticRegression",
        "version": "1.0.0",
        "trainedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "randomSeed": SEED,
        "features": FEATURE_NAMES,
        "weights": [round(w, 6) for w in weights],
        "intercept": round(intercept, 6),
        "evaluationMetrics": {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1Score": round(f1, 4),
            "rocAuc": round(auc, 4),
            "confusionMatrix": cm,
            "testSetSize": len(X_test),
            "trainSetSize": len(X_train),
        },
        "description": "DevPair student-role compatibility classifier trained on synthetic bootstrap data.",
    }

    # Save artifact to ml/
    with open(ARTIFACT_PATH_ML, "w") as f:
        json.dump(artifact, f, indent=2)
    print(f"\nSaved model artifact to: {ARTIFACT_PATH_ML}")

    # Ensure src directory exists and save to src/features/matching/
    os.makedirs(os.path.dirname(ARTIFACT_PATH_SRC), exist_ok=True)
    with open(ARTIFACT_PATH_SRC, "w") as f:
        json.dump(artifact, f, indent=2)
    print(f"Saved model artifact to: {ARTIFACT_PATH_SRC}")

    # Generate Golden Test Cases for TypeScript parity verification
    golden_cases = []
    # Pick 12 representative examples from test set
    sample_indices = [0, 5, 10, 25, 50, 75, 100, 150, 200, 300, 400, 490]
    for si in sample_indices:
        feat = X_test[si].tolist()
        pred_prob = float(clf.predict_proba([X_test[si]])[0][1])
        pred_label = int(clf.predict([X_test[si]])[0])
        raw_info = raw_data[idx_test[si]]
        golden_cases.append({
            "id": f"test_case_{si}",
            "scenario": raw_info.get("scenario", "test"),
            "features": [round(v, 4) for v in feat],
            "expectedProbability": round(pred_prob, 6),
            "expectedScore": int(round(pred_prob * 100)),
            "expectedLabel": pred_label,
        })

    with open(GOLDEN_PATH_ML, "w") as f:
        json.dump(golden_cases, f, indent=2)
    print(f"Saved {len(golden_cases)} golden test cases to: {GOLDEN_PATH_ML}")

    os.makedirs(os.path.dirname(GOLDEN_PATH_SCRATCH), exist_ok=True)
    with open(GOLDEN_PATH_SCRATCH, "w") as f:
        json.dump(golden_cases, f, indent=2)
    print(f"Saved golden test cases to: {GOLDEN_PATH_SCRATCH}")


if __name__ == "__main__":
    train_and_evaluate()
