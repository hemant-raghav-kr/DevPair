import type { ApplicationStatus } from "@/features/applications/types";
import type { MatchResult } from "@/features/matching/types";
import type { Skill } from "@/features/skills/types";

export interface DiscoveryFilters {
  q?: string;
  category?: string;
  hackathon?: "all" | "hackathon" | "non_hackathon" | string;
  skill?: string;
  status?: string;
  availability?: "all" | "open_roles" | string;
  sort?: "match" | "newest" | "roles" | string;
  page?: number;
}

export interface DiscoveryRole {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  slots: number;
  openSlots: number;
  required_skill_id: string | null;
  skill: Skill | null;
  userApplicationStatus?: ApplicationStatus | null;
}

export interface DiscoveryProject {
  id: string;
  owner_id: string;
  title: string;
  tagline: string | null;
  description: string;
  category: string;
  status: string;
  visibility: string;
  is_hackathon: boolean;
  hackathon_name: string | null;
  hackathon_deadline: string | null;
  max_team_size: number | null;
  repo_url: string | null;
  demo_url: string | null;
  created_at: string;
  updated_at: string;
  owner: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  roles: DiscoveryRole[];
  openSlots: number;
  match?: MatchResult | null;
  bestRole?: DiscoveryRole | null;
  isOwner: boolean;
}

export interface DiscoveryResult {
  projects: DiscoveryProject[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
