import type { ProjectApplication, ApplicationStatus } from "@/types";

export interface SubmitApplicationInput {
  projectId: string;
  roleApplied: string;
  message: string;
}

export interface ReviewApplicationInput {
  applicationId: string;
  status: "accepted" | "declined";
  reviewerNote?: string;
}

export type { ProjectApplication, ApplicationStatus };
