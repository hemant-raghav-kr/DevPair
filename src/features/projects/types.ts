import type { Project, ProjectRoleNeeded, ProjectStatus } from "@/types";

export interface CreateProjectInput {
  title: string;
  tagline: string;
  description: string;
  isHackathonProject: boolean;
  hackathonName?: string;
  hackathonDeadline?: string;
  teamSizeLimit: number;
  rolesNeeded: Omit<ProjectRoleNeeded, "id" | "spotsFilled">[];
  tags: string[];
  repoUrl?: string;
  demoUrl?: string;
}

export type { Project, ProjectRoleNeeded, ProjectStatus };
