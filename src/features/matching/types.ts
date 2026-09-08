import type { ProficiencyLevel } from "@/features/skills/types";

export type MatchFeatureName =
  | "required_skill_match"
  | "required_skill_proficiency"
  | "skill_category_overlap_ratio"
  | "project_category_alignment"
  | "availability_fit"
  | "total_skills_count_norm"
  | "avg_skill_proficiency"
  | "advanced_skills_count_norm";

export interface ModelArtifact {
  modelType: string;
  version: string;
  trainedAt: string;
  randomSeed: number;
  features: MatchFeatureName[];
  weights: number[];
  intercept: number;
  evaluationMetrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    rocAuc: number;
    confusionMatrix: number[][];
    testSetSize: number;
    trainSetSize: number;
  };
  description: string;
}

export interface CandidateSkill {
  skill_id: string;
  name: string;
  category: string;
  proficiency: ProficiencyLevel;
}

export interface CandidateProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url?: string | null;
  college?: string | null;
  availability_hours_per_week: number | null;
  skills: CandidateSkill[];
}

export interface TargetRole {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  required_skill_id: string | null;
  slots: number;
  skill?: {
    id: string;
    name: string;
    category: string;
  } | null;
}

export interface TargetProject {
  id: string;
  owner_id: string;
  title: string;
  tagline?: string | null;
  category: string;
  status: string;
  visibility: string;
  is_hackathon: boolean;
  hackathon_name?: string | null;
  hackathon_deadline?: string | null;
}

export interface FeatureVector {
  values: number[];
  featureMap: Record<MatchFeatureName, number>;
}

export interface MatchFactor {
  type: "positive" | "negative" | "neutral";
  text: string;
  feature: MatchFeatureName;
  contribution: number;
}

export type MatchTier =
  | "Exceptional Fit"
  | "Strong Fit"
  | "Moderate Fit"
  | "Developing Fit";

export interface MatchResult {
  score: number;
  probability: number;
  tier: MatchTier;
  modelVersion: string;
  factors: MatchFactor[];
  featureVector: number[];
}

export interface RoleMatch {
  role: TargetRole;
  match: MatchResult;
}

export interface ProjectRecommendation {
  project: TargetProject;
  bestRole: TargetRole;
  bestMatch: MatchResult;
  allRoleMatches: RoleMatch[];
  openSlots: number;
  owner?: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}
