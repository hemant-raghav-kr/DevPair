import type { ProjectStatus, SkillCategory } from "@/types";

export interface ProjectSearchParams {
  query?: string;
  skills?: string[];
  status?: ProjectStatus;
  isHackathon?: boolean;
  page?: number;
  pageSize?: number;
}

export interface StudentSearchParams {
  query?: string;
  skills?: string[];
  skillCategory?: SkillCategory;
  college?: string;
  minAvailability?: number;
  page?: number;
  pageSize?: number;
}
