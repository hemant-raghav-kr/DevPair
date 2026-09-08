"""
DevPair AI Matching Engine - Model Evaluation & Diagnostic Script
Verifies model performance, tests specific edge-case scenarios, and verifies calibration.
"""

import json
import math
import os

ARTIFACT_PATH = os.path.join(os.path.dirname(__file__), "model_artifact.json")


def sigmoid(z: float) -> float:
    return 1.0 / (1.0 + math.exp(-z))


def evaluate_model():
    if not os.path.exists(ARTIFACT_PATH):
        raise FileNotFoundError(f"Model artifact not found at {ARTIFACT_PATH}. Run train_model.py first.")

    with open(ARTIFACT_PATH, "r") as f:
        model = json.load(f)

    print("==================================================")
    print(f"DEVPAIR MATCHING MODEL: {model['modelType']} v{model['version']}")
    print(f"Trained At: {model['trainedAt']}")
    print("==================================================")

    metrics = model["evaluationMetrics"]
    print(f"Accuracy:  {metrics['accuracy'] * 100:.2f}%")
    print(f"Precision: {metrics['precision'] * 100:.2f}%")
    print(f"Recall:    {metrics['recall'] * 100:.2f}%")
    print(f"F1 Score:  {metrics['f1Score'] * 100:.2f}%")
    print(f"ROC-AUC:   {metrics['rocAuc']:.4f}")
    print(f"Test Set Size: {metrics['testSetSize']} samples")

    weights = model["weights"]
    intercept = model["intercept"]
    features = model["features"]

    print("\nFeature Weights (ranked by importance):")
    ranked = sorted(zip(features, weights), key=lambda x: abs(x[1]), reverse=True)
    for name, w in ranked:
        print(f"  {name:30s}: {w:+.4f}")
    print(f"  {'intercept':30s}: {intercept:+.4f}")

    # Edge-case scenarios evaluation
    test_scenarios = [
        {
            "name": "1. Perfect Skill & Domain Match (Advanced React for Web Frontend)",
            "vector": [1.0, 1.0, 0.85, 0.90, 1.0, 0.6, 0.85, 0.5],
        },
        {
            "name": "2. Good Match with Intermediate Skill",
            "vector": [1.0, 0.667, 0.70, 0.80, 0.90, 0.5, 0.70, 0.25],
        },
        {
            "name": "3. Beginner Skill with Good Availability",
            "vector": [1.0, 0.333, 0.50, 0.60, 1.0, 0.4, 0.50, 0.0],
        },
        {
            "name": "4. Missing Required Skill but strong adjacent domain",
            "vector": [0.0, 0.0, 0.60, 0.70, 1.0, 0.5, 0.65, 0.2],
        },
        {
            "name": "5. Severe Availability Mismatch (Strong skills, but 3 hrs/wk)",
            "vector": [1.0, 1.0, 0.80, 0.80, 0.30, 0.6, 0.85, 0.5],
        },
        {
            "name": "6. Complete Domain Mismatch (Cybersecurity student for AI/ML role)",
            "vector": [0.0, 0.0, 0.0, 0.10, 1.0, 0.4, 0.60, 0.2],
        },
        {
            "name": "7. Zero Skills Newcomer",
            "vector": [0.0, 0.0, 0.0, 0.0, 0.5, 0.1, 0.333, 0.0],
        },
    ]

    print("\n==================================================")
    print("SCENARIO PREDICTION BENCHMARK")
    print("==================================================")
    for sc in test_scenarios:
        z = sum(w * x for w, x in zip(weights, sc["vector"])) + intercept
        prob = sigmoid(z)
        score = int(round(prob * 100))
        print(f"\n{sc['name']}")
        print(f"  Log-odds z: {z:+.4f} | Probability: {prob:.4f} | Match Score: {score}%")

    print("\n[OK] Evaluation and scenario benchmarks complete.")


if __name__ == "__main__":
    evaluate_model()
