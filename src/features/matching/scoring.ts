import { extractFeatureVector } from "./features";
import { predictMatch } from "./model";
import { generateMatchFactors } from "./explanation";
import type {
  CandidateProfile,
  TargetRole,
  TargetProject,
  MatchResult,
} from "./types";

/**
 * Computes full explainable match result for a candidate student and project role
 */
export function calculateMatch(
  candidate: CandidateProfile,
  role: TargetRole,
  project: TargetProject
): MatchResult {
  const featureVector = extractFeatureVector(candidate, role, project);
  const prediction = predictMatch(featureVector.values);
  const factors = generateMatchFactors(
    candidate,
    role,
    project,
    featureVector,
    prediction
  );

  return {
    score: prediction.score,
    probability: prediction.probability,
    tier: prediction.tier,
    modelVersion: prediction.modelVersion,
    factors,
    featureVector: featureVector.values,
  };
}
