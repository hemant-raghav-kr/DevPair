import type { Database } from "@/types/database.types";
import type { Profile } from "@/features/profiles/types";
import type { Skill, UserSkillWithDetails } from "@/features/skills/types";

export type Application = Database["public"]["Tables"]["applications"]["Row"];
export type ApplicationInsert = Database["public"]["Tables"]["applications"]["Insert"];
export type ApplicationUpdate = Database["public"]["Tables"]["applications"]["Update"];

export type ApplicationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "withdrawn"
  | "removed";

export interface ApplicationWithDetails extends Application {
  project: {
    id: string;
    title: string;
    tagline: string | null;
    category: string;
    status: string;
    visibility: string;
    owner_id: string;
  } | null;
  role: {
    id: string;
    title: string;
    description: string | null;
    slots: number;
    skill: Skill | null;
  } | null;
}

export interface ApplicationWithOwnerView extends Application {
  applicant: Profile;
  applicantSkills?: UserSkillWithDetails[];
  role: {
    id: string;
    title: string;
    description: string | null;
    slots: number;
    skill: Skill | null;
  } | null;
}

export interface ApplicationFormData {
  message: string;
}

export interface ApplicationValidationErrors {
  message?: string;
  form?: string;
}

export const APPLICATION_STATUS_LABELS: Record<
  ApplicationStatus,
  { label: string; description: string }
> = {
  pending: {
    label: "Pending Review",
    description: "Your application is waiting for review by the project owner.",
  },
  accepted: {
    label: "Accepted",
    description: "The project owner accepted your application to join the team!",
  },
  rejected: {
    label: "Not Selected",
    description: "The project owner decided not to move forward with this request.",
  },
  withdrawn: {
    label: "Withdrawn",
    description: "You withdrew this application request.",
  },
  removed: {
    label: "Removed",
    description: "You were removed from this project team by the project owner.",
  },
};
