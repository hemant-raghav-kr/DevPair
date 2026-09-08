import type { Database } from "@/types/database.types";
import type { Profile } from "@/features/profiles/types";
import type { Skill } from "@/features/skills/types";

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

export type ProjectRole = Database["public"]["Tables"]["project_roles"]["Row"];
export type ProjectRoleInsert = Database["public"]["Tables"]["project_roles"]["Insert"];
export type ProjectRoleUpdate = Database["public"]["Tables"]["project_roles"]["Update"];

export type ProjectCategory =
  | "web_development"
  | "mobile_app"
  | "ai_machine_learning"
  | "open_source"
  | "game_development"
  | "blockchain"
  | "cybersecurity"
  | "hardware_iot"
  | "other";

export type ProjectStatus =
  | "draft"
  | "recruiting"
  | "in_progress"
  | "completed"
  | "archived";

export type ProjectVisibility = "public" | "unlisted" | "private";

export interface ProjectRoleWithSkill extends ProjectRole {
  skill: Skill | null;
}

export interface ProjectWithDetails extends Project {
  owner: Profile;
  roles: ProjectRoleWithSkill[];
}

export interface ProjectFormData {
  title: string;
  tagline: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  is_hackathon: boolean;
  hackathon_name: string;
  hackathon_deadline: string;
  max_team_size: number | string;
  repo_url: string;
  demo_url: string;
}

export interface ProjectValidationErrors {
  title?: string;
  tagline?: string;
  description?: string;
  category?: string;
  status?: string;
  visibility?: string;
  hackathon_name?: string;
  hackathon_deadline?: string;
  max_team_size?: string;
  repo_url?: string;
  demo_url?: string;
  form?: string;
}

export interface ProjectRoleFormData {
  title: string;
  description: string;
  required_skill_id: string | null;
  slots: number | string;
}

export interface ProjectRoleValidationErrors {
  title?: string;
  description?: string;
  required_skill_id?: string;
  slots?: string;
  form?: string;
}

export const PROJECT_CATEGORIES: { value: ProjectCategory; label: string }[] = [
  { value: "web_development", label: "Web Development" },
  { value: "mobile_app", label: "Mobile App" },
  { value: "ai_machine_learning", label: "AI / Machine Learning" },
  { value: "open_source", label: "Open Source" },
  { value: "game_development", label: "Game Development" },
  { value: "blockchain", label: "Blockchain & Web3" },
  { value: "cybersecurity", label: "Cybersecurity" },
  { value: "hardware_iot", label: "Hardware & IoT" },
  { value: "other", label: "Other" },
];

export const PROJECT_STATUSES: {
  value: ProjectStatus;
  label: string;
  description: string;
}[] = [
  {
    value: "recruiting",
    label: "Recruiting",
    description: "Actively looking for teammates",
  },
  {
    value: "in_progress",
    label: "In Progress",
    description: "Team assembled, actively building",
  },
  {
    value: "completed",
    label: "Completed",
    description: "Project finished or hackathon submitted",
  },
  {
    value: "draft",
    label: "Draft",
    description: "Work in progress, not ready for applications",
  },
  {
    value: "archived",
    label: "Archived",
    description: "Inactive or paused project",
  },
];

export const PROJECT_VISIBILITIES: {
  value: ProjectVisibility;
  label: string;
  description: string;
}[] = [
  {
    value: "public",
    label: "Public",
    description: "Visible to anyone on DevPair",
  },
  {
    value: "unlisted",
    label: "Unlisted",
    description: "Accessible only via direct link",
  },
  {
    value: "private",
    label: "Private",
    description: "Visible only to project owner",
  },
];
