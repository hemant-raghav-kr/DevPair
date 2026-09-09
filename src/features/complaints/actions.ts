"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, checkIsBanned } from "@/lib/auth/admin";
import type {
  SubmitComplaintInput,
  ComplaintCategory,
  ComplaintStatus,
  ComplaintPriority,
  ComplaintUpdate,
} from "./types";

const VALID_CATEGORIES: ComplaintCategory[] = [
  "harassment",
  "inappropriate_content",
  "spam",
  "fake_profile",
  "abusive_behavior",
  "project_misconduct",
  "application_misconduct",
  "plagiarism",
  "impersonation",
  "other",
];

const VALID_STATUSES: ComplaintStatus[] = ["pending", "under_review", "resolved", "dismissed"];
const VALID_PRIORITIES: ComplaintPriority[] = ["low", "normal", "high", "critical"];

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Submits a new moderation complaint with server-side validation and target resolution.
 */
export async function submitComplaintAction(
  input: SubmitComplaintInput
): Promise<ActionResult<{ complaintId: string; reference: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "You must be signed in to submit a complaint." };
    }

    // Check if reporter is banned
    const banStatus = await checkIsBanned(user.id);
    if (banStatus.banned) {
      return {
        success: false,
        error: "Your account is currently suspended. You cannot submit reports.",
      };
    }

    // Field validation
    const subject = (input.subject || "").trim();
    const description = (input.description || "").trim();

    if (subject.length < 3 || subject.length > 150) {
      return {
        success: false,
        error: "Subject must be between 3 and 150 characters.",
      };
    }

    if (description.length < 10 || description.length > 2500) {
      return {
        success: false,
        error: "Description must be between 10 and 2500 characters.",
      };
    }

    if (!VALID_CATEGORIES.includes(input.category)) {
      return {
        success: false,
        error: "Please select a valid complaint category.",
      };
    }

    let resolvedUserId: string | null = input.reportedUserId || null;
    const resolvedProjectId: string | null = input.reportedProjectId || null;
    const resolvedAppId: string | null = input.reportedApplicationId || null;

    // Resolve username to user ID securely from database
    if (input.reportedUsername && !resolvedUserId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", input.reportedUsername.trim())
        .maybeSingle();

      if (!profile) {
        return { success: false, error: "The reported student could not be found." };
      }
      resolvedUserId = profile.id;
    }

    // Prevent self-reporting
    if (resolvedUserId && resolvedUserId === user.id) {
      return { success: false, error: "You cannot report yourself." };
    }

    // Validate project existence if provided
    if (resolvedProjectId) {
      const { data: project } = await supabase
        .from("projects")
        .select("id")
        .eq("id", resolvedProjectId)
        .maybeSingle();

      if (!project) {
        return { success: false, error: "The reported project could not be found." };
      }
    }

    // Validate application involvement if provided
    if (resolvedAppId) {
      const { data: appRecord } = await supabase
        .from("applications")
        .select("id, applicant_id, project_id, project:projects(owner_id)")
        .eq("id", resolvedAppId)
        .maybeSingle();

      if (!appRecord) {
        return { success: false, error: "The specified application could not be found." };
      }

      const projectData = (appRecord as { project?: { owner_id: string } | { owner_id: string }[] | null }).project;
      const projectOwnerId = Array.isArray(projectData) ? projectData[0]?.owner_id : projectData?.owner_id;
      const isInvolved = appRecord.applicant_id === user.id || projectOwnerId === user.id;

      if (!isInvolved) {
        return {
          success: false,
          error: "You can only report applications you are directly involved with.",
        };
      }
    }

    // Target integrity check
    const hasTarget = resolvedUserId || resolvedProjectId || resolvedAppId;
    if (!hasTarget && !["other", "spam", "inappropriate_content"].includes(input.category)) {
      return {
        success: false,
        error: "This category requires a specific student, project, or application target.",
      };
    }

    // Check for existing pending or under_review complaints from this user for this target
    let duplicateCheck = supabase
      .from("complaints")
      .select("id")
      .eq("reporter_id", user.id)
      .in("status", ["pending", "under_review"]);

    if (resolvedUserId) {
      duplicateCheck = duplicateCheck.eq("reported_user_id", resolvedUserId);
    } else if (resolvedProjectId) {
      duplicateCheck = duplicateCheck.eq("reported_project_id", resolvedProjectId);
    } else if (resolvedAppId) {
      duplicateCheck = duplicateCheck.eq("reported_application_id", resolvedAppId);
    } else {
      duplicateCheck = duplicateCheck
        .eq("category", input.category)
        .is("reported_user_id", null)
        .is("reported_project_id", null)
        .is("reported_application_id", null);
    }

    const { data: existingPending } = await duplicateCheck.maybeSingle();
    if (existingPending) {
      return {
        success: false,
        error:
          "You already have an active report under review for this target. Our moderation team is investigating it.",
      };
    }

    // Insert complaint with initial state
    const { data: inserted, error: insertError } = await supabase
      .from("complaints")
      .insert({
        reporter_id: user.id,
        category: input.category,
        subject,
        description,
        reported_user_id: resolvedUserId,
        reported_project_id: resolvedProjectId,
        reported_application_id: resolvedAppId,
        status: "pending",
        priority: "normal",
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("[DevPair Complaints] Insert error:", insertError);
      return {
        success: false,
        error: insertError?.message || "Failed to submit complaint. Please try again.",
      };
    }

    const displayRef = `#CP-${inserted.id.substring(0, 8).toUpperCase()}`;

    revalidatePath("/complaints");
    revalidatePath("/admin/complaints");

    return {
      success: true,
      data: {
        complaintId: inserted.id,
        reference: displayRef,
      },
    };
  } catch (err: unknown) {
    console.error("[DevPair Complaints] Unexpected submission error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred while submitting your report.",
    };
  }
}

/**
 * Updates a complaint's review status and internal admin notes.
 * Enforces requireAdmin() server-side.
 */
export async function updateComplaintStatusAction(
  complaintId: string,
  status: ComplaintStatus,
  adminNotes?: string
): Promise<ActionResult> {
  try {
    const adminContext = await requireAdmin();
    const adminSupabase = createAdminClient();

    if (!VALID_STATUSES.includes(status)) {
      return { success: false, error: "Invalid status value." };
    }

    const updatePayload: ComplaintUpdate = {
      status,
    };

    if (typeof adminNotes === "string") {
      updatePayload.admin_notes = adminNotes.trim() || null;
    }

    // Set resolution fields
    if (status === "resolved" || status === "dismissed") {
      updatePayload.resolved_by = adminContext.user.id;
      updatePayload.resolved_at = new Date().toISOString();
    } else {
      updatePayload.resolved_by = null;
      updatePayload.resolved_at = null;
    }

    const { error } = await adminSupabase
      .from("complaints")
      .update(updatePayload)
      .eq("id", complaintId);

    if (error) {
      console.error("[DevPair Complaints] Status update error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/complaints");
    revalidatePath(`/admin/complaints/${complaintId}`);
    revalidatePath("/complaints");

    return { success: true };
  } catch (err: unknown) {
    console.error("[DevPair Complaints] Admin status error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to update complaint status." };
  }
}

/**
 * Updates a complaint's priority level.
 * Enforces requireAdmin() server-side.
 */
export async function updateComplaintPriorityAction(
  complaintId: string,
  priority: ComplaintPriority
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const adminSupabase = createAdminClient();

    if (!VALID_PRIORITIES.includes(priority)) {
      return { success: false, error: "Invalid priority value." };
    }

    const { error } = await adminSupabase
      .from("complaints")
      .update({ priority })
      .eq("id", complaintId);

    if (error) {
      console.error("[DevPair Complaints] Priority update error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/complaints");
    revalidatePath(`/admin/complaints/${complaintId}`);

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update priority." };
  }
}

/**
 * Updates internal administrator notes on a complaint.
 * Enforces requireAdmin() server-side.
 */
export async function updateComplaintNotesAction(
  complaintId: string,
  adminNotes: string
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const adminSupabase = createAdminClient();

    const { error } = await adminSupabase
      .from("complaints")
      .update({ admin_notes: adminNotes.trim() || null })
      .eq("id", complaintId);

    if (error) {
      console.error("[DevPair Complaints] Notes update error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/complaints");
    revalidatePath(`/admin/complaints/${complaintId}`);

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update admin notes." };
  }
}
