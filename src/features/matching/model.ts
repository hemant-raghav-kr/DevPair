import modelArtifactJson from "./model_artifact.json";
import type { ModelArtifact, MatchFeatureName, MatchTier } from "./types";

export const modelArtifact: ModelArtifact = modelArtifactJson as ModelArtifact;

export interface PredictionOutput {
  probability: number;
  score: number;
  logOdds: number;
  tier: MatchTier;
  contributions: Record<MatchFeatureName, number>;
  modelVersion: string;
}

/**
 * Standard mathematical sigmoid function
 */
export function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

/**
 * Executes Logistic Regression inference on a feature vector
 */
export function predictMatch(
  featureValues: number[],
  featuresList: MatchFeatureName[] = modelArtifact.features
): PredictionOutput {
  const weights = modelArtifact.weights;
  const intercept = modelArtifact.intercept;

  let dotProduct = 0;
  const contributions = {} as Record<MatchFeatureName, number>;

  for (let i = 0; i < featureValues.length; i++) {
    const val = featureValues[i];
    const w = weights[i] ?? 0;
    const featName = featuresList[i];
    const contrib = w * val;

    dotProduct += contrib;
    if (featName) {
      contributions[featName] = Number(contrib.toFixed(4));
    }
  }

  const logOdds = dotProduct + intercept;
  const probability = sigmoid(logOdds);
  const score = Math.round(probability * 100);

  let tier: MatchTier;
  if (score >= 85) {
    tier = "Exceptional Fit";
  } else if (score >= 70) {
    tier = "Strong Fit";
  } else if (score >= 50) {
    tier = "Moderate Fit";
  } else {
    tier = "Developing Fit";
  }

  return {
    probability: Number(probability.toFixed(6)),
    score,
    logOdds: Number(logOdds.toFixed(4)),
    tier,
    contributions,
    modelVersion: modelArtifact.version,
  };
}
