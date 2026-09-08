import type { MatchScore, Project, UserProfile } from "@/types";

export interface MatchingWeights {
  skillsWeight: number; // e.g. 0.5
  interestsWeight: number; // e.g. 0.3
  availabilityWeight: number; // e.g. 0.2
}

export interface MatchRecommendation {
  score: MatchScore;
  project?: Project;
  candidateProfile?: UserProfile;
}

export type { MatchScore };
