import type { Database } from "@/types/database.types";

export type ComplaintRow = Database["public"]["Tables"]["complaints"]["Row"];
export type ComplaintInsert = Database["public"]["Tables"]["complaints"]["Insert"];
export type ComplaintUpdate = Database["public"]["Tables"]["complaints"]["Update"];

export type ComplaintCategory =
  | "harassment"
  | "inappropriate_content"
  | "spam"
  | "fake_profile"
  | "abusive_behavior"
  | "project_misconduct"
  | "application_misconduct"
  | "plagiarism"
  | "impersonation"
  | "other";

export type ComplaintStatus = "pending" | "under_review" | "resolved" | "dismissed";
export type ComplaintPriority = "low" | "normal" | "high" | "critical";

export interface ComplaintSummary {
  id: string;
  category: ComplaintCategory;
  subject: string;
  description: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  reported_user_id: string | null;
  reported_project_id: string | null;
  reported_application_id: string | null;
  reportedUserName?: string | null;
  reportedUserUsername?: string | null;
  reportedProjectTitle?: string | null;
}

export interface ComplaintDetail extends ComplaintSummary {
  reporter_id: string;
  reporterName?: string | null;
  reporterUsername?: string | null;
  reporterEmail?: string | null;
  reportedUserEmail?: string | null;
  admin_notes?: string | null;
  resolved_by?: string | null;
  resolverEmail?: string | null;
}

export interface SubmitComplaintInput {
  category: ComplaintCategory;
  subject: string;
  description: string;
  reportedUsername?: string;
  reportedUserId?: string;
  reportedProjectId?: string;
  reportedApplicationId?: string;
}

export interface AdminComplaintFilter {
  page?: number;
  pageSize?: number;
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  sort?: "newest" | "oldest";
}

export interface PaginatedComplaintsResult {
  complaints: ComplaintDetail[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
