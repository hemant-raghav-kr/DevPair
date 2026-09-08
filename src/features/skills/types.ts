import type { Database } from "@/types/database.types";

export type Skill = Database["public"]["Tables"]["skills"]["Row"];
export type UserSkill = Database["public"]["Tables"]["user_skills"]["Row"];
export type SkillCategory =
  | "frontend"
  | "backend"
  | "fullstack"
  | "mobile"
  | "ai_ml"
  | "devops_cloud"
  | "data_science"
  | "ui_ux_design"
  | "product_management"
  | "blockchain"
  | "cybersecurity"
  | "other";

export type ProficiencyLevel = "beginner" | "intermediate" | "advanced";

export interface UserSkillWithDetails {
  user_id: string;
  skill_id: string;
  proficiency: ProficiencyLevel;
  created_at: string;
  skill: Skill;
}

export const PROFICIENCY_LABELS: Record<ProficiencyLevel, { label: string; description: string }> = {
  beginner: {
    label: "Beginner",
    description: "Basic syntax, familiar with concepts, building simple exercises.",
  },
  intermediate: {
    label: "Intermediate",
    description: "Can independently build features and solve common problems.",
  },
  advanced: {
    label: "Advanced",
    description: "Deep architectural understanding, optimization, and mentorship.",
  },
};
