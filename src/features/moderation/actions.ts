"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, checkIsBanned } from "@/lib/auth/admin";
import type { RestrictionType } from "@/types";

/**
 * Submit a revocation request for an active ban or withdrawal cooldown.
 * Student-facing action.
 */
export async function submitRevocationRequestAction({
  restrictionType,
  reason,
}: {
  restrictionType: RestrictionType;
  reason: string;
}): Promise<{ success: boolean; error: string | null; requestId?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required." };
    }

    const trimmedReason = reason?.trim();
    if (!trimmedReason || trimmedReason.length < 10) {
      return {
        success: false,
        error: "Please provide a clear reason of at least 10 characters.",
      };
    }
    if (trimmedReason.length > 1000) {
      return {
        success: false,
        error: "Reason exceeds maximum length of 1000 characters.",
      };
    }

    const adminSupabase = createAdminClient();

    // Verify restriction is actually active
    if (restrictionType === "ban") {
      const banStatus = await checkIsBanned(user.id);
      if (!banStatus.banned) {
        return {
          success: false,
          error: "Your account does not currently have an active ban restriction.",
        };
      }
    } else if (restrictionType === "cooldown") {
      const nowIso = new Date().toISOString();
      const { data: activeCooldown } = await adminSupabase
        .from("withdrawal_cooldowns")
        .select("id")
        .eq("user_id", user.id)
        .is("revoked_at", null)
        .gt("cooldown_until", nowIso)
        .limit(1)
        .maybeSingle();

      if (!activeCooldown) {
        return {
          success: false,
          error: "You do not currently have an active withdrawal cooldown.",
        };
      }
    } else {
      return { success: false, error: "Invalid restriction type specified." };
    }

    // Check if a pending request already exists
    const { data: existingPending } = await adminSupabase
      .from("restriction_revoke_requests")
      .select("id")
      .eq("user_id", user.id)
      .eq("restriction_type", restrictionType)
      .eq("status", "pending")
      .limit(1)
      .maybeSingle();

    if (existingPending) {
      return {
        success: false,
        error: "You already have a pending revocation request under review.",
      };
    }

    // Insert new request
    const { data: newRequest, error: insertError } = await adminSupabase
      .from("restriction_revoke_requests")
      .insert({
        user_id: user.id,
        restriction_type: restrictionType,
        status: "pending",
        reason: trimmedReason,
      })
      .select("id")
      .single();

    if (insertError || !newRequest) {
      // Check for PostgreSQL unique constraint error
      if (insertError?.code === "23505") {
        return {
          success: false,
          error: "You already have a pending revocation request under review.",
        };
      }
      return {
        success: false,
        error: insertError?.message || "Failed to submit revocation request.",
      };
    }

    // Fetch student name for audit log
    const { data: studentProfile } = await adminSupabase
      .from("profiles")
      .select("full_name, username")
      .eq("id", user.id)
      .maybeSingle();

    const studentName =
      studentProfile?.full_name?.trim() ||
      studentProfile?.username ||
      "Student";

    // Insert audit log
    const auditEvent =
      restrictionType === "ban"
        ? "ban_revocation_requested"
        : "cooldown_revocation_requested";

    await adminSupabase.from("audit_logs").insert({
      event_type: auditEvent,
      actor_user_id: user.id,
      target_user_id: user.id,
      description: `${studentName} submitted a ${restrictionType} revocation appeal: "${trimmedReason.slice(0, 100)}${trimmedReason.length > 100 ? "..." : ""}"`,
      metadata: {
        request_id: newRequest.id,
        restriction_type: restrictionType,
        reason: trimmedReason,
      },
    });

    revalidatePath("/banned");
    revalidatePath("/applications");
    revalidatePath("/admin/revocation-requests");
    revalidatePath("/admin/audit-logs");

    return { success: true, error: null, requestId: newRequest.id };
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Failed to submit revocation request";
    return { success: false, error: msg };
  }
}

/**
 * Review an active revocation request (Approve or Reject).
 * Admin / Super Admin only.
 */
export async function reviewRevocationRequestAction({
  requestId,
  action,
  reviewReason,
}: {
  requestId: string;
  action: "approve" | "reject";
  reviewReason?: string;
}): Promise<{ success: boolean; error: string | null }> {
  try {
    const adminContext = await requireAdmin();
    const adminSupabase = createAdminClient();

    if (!requestId) {
      return { success: false, error: "Request ID is required." };
    }

    if (action !== "approve" && action !== "reject") {
      return { success: false, error: "Invalid review action." };
    }

    // Fetch existing request
    const { data: request, error: fetchErr } = await adminSupabase
      .from("restriction_revoke_requests")
      .select("*")
      .eq("id", requestId)
      .maybeSingle();

    if (fetchErr || !request) {
      return {
        success: false,
        error: fetchErr?.message || "Revocation request not found.",
      };
    }

    if (request.status !== "pending") {
      return {
        success: false,
        error: `This request has already been ${request.status}.`,
      };
    }

    const trimmedReviewReason = reviewReason?.trim() || null;
    const nowIso = new Date().toISOString();
    const newStatus = action === "approve" ? "approved" : "rejected";

    // Update request record
    const { error: updateErr } = await adminSupabase
      .from("restriction_revoke_requests")
      .update({
        status: newStatus,
        reviewed_by: adminContext.user.id,
        reviewed_at: nowIso,
        review_reason: trimmedReviewReason,
      })
      .eq("id", requestId)
      .eq("status", "pending");

    if (updateErr) {
      return {
        success: false,
        error: updateErr.message || "Failed to update revocation request.",
      };
    }

    // Fetch admin & student names for audit logging
    const [adminProfileRes, studentProfileRes] = await Promise.all([
      adminSupabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", adminContext.user.id)
        .maybeSingle(),
      adminSupabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", request.user_id)
        .maybeSingle(),
    ]);

    const adminName =
      adminProfileRes.data?.full_name?.trim() ||
      adminProfileRes.data?.username ||
      "Administrator";
    const studentName =
      studentProfileRes.data?.full_name?.trim() ||
      studentProfileRes.data?.username ||
      "Student";

    // Handle restriction update & audit log according to type and action
    if (request.restriction_type === "ban") {
      if (action === "approve") {
        // Unban student
        await adminSupabase
          .from("user_bans")
          .delete()
          .eq("user_id", request.user_id);

        // Audit Log: ban_revocation_approved
        await adminSupabase.from("audit_logs").insert({
          event_type: "ban_revocation_approved",
          actor_user_id: adminContext.user.id,
          target_user_id: request.user_id,
          description: `Admin ${adminName} approved ban revocation appeal for ${studentName}.${trimmedReviewReason ? ` Note: ${trimmedReviewReason}` : ""}`,
          metadata: {
            request_id: requestId,
            review_reason: trimmedReviewReason,
            original_reason: request.reason,
          },
        });

        // Notification to student
        await adminSupabase.from("notifications").insert({
          user_id: request.user_id,
          type: "system",
          title: "Account Suspension Revoked",
          message:
            "Your ban revocation appeal has been approved by an administrator. Your account access has been fully restored.",
          read: false,
        });
      } else {
        // Audit Log: ban_revocation_rejected
        await adminSupabase.from("audit_logs").insert({
          event_type: "ban_revocation_rejected",
          actor_user_id: adminContext.user.id,
          target_user_id: request.user_id,
          description: `Admin ${adminName} rejected ban revocation appeal for ${studentName}.${trimmedReviewReason ? ` Reason: ${trimmedReviewReason}` : ""}`,
          metadata: {
            request_id: requestId,
            review_reason: trimmedReviewReason,
            original_reason: request.reason,
          },
        });

        // Notification to student
        await adminSupabase.from("notifications").insert({
          user_id: request.user_id,
          type: "system",
          title: "Ban Revocation Appeal Rejected",
          message: `Your ban revocation appeal was reviewed and rejected.${trimmedReviewReason ? ` Reason: ${trimmedReviewReason}` : ""}`,
          read: false,
        });
      }
    } else if (request.restriction_type === "cooldown") {
      if (action === "approve") {
        // Mark all active cooldowns as revoked
        const revocationReason =
          trimmedReviewReason || "Revoked via student appeal";
        await adminSupabase
          .from("withdrawal_cooldowns")
          .update({
            revoked_at: nowIso,
            revoked_by: adminContext.user.id,
            revocation_reason: revocationReason,
          })
          .eq("user_id", request.user_id)
          .is("revoked_at", null);

        // Audit Log: cooldown_revocation_approved
        await adminSupabase.from("audit_logs").insert({
          event_type: "cooldown_revocation_approved",
          actor_user_id: adminContext.user.id,
          target_user_id: request.user_id,
          description: `Admin ${adminName} approved withdrawal cooldown revocation for ${studentName}.${trimmedReviewReason ? ` Note: ${trimmedReviewReason}` : ""}`,
          metadata: {
            request_id: requestId,
            review_reason: trimmedReviewReason,
            original_reason: request.reason,
          },
        });

        // Notification to student
        await adminSupabase.from("notifications").insert({
          user_id: request.user_id,
          type: "system",
          title: "Application Cooldown Revoked",
          message:
            "Your application cooldown revocation request was approved by an administrator. You may now apply to projects.",
          read: false,
        });
      } else {
        // Audit Log: cooldown_revocation_rejected
        await adminSupabase.from("audit_logs").insert({
          event_type: "cooldown_revocation_rejected",
          actor_user_id: adminContext.user.id,
          target_user_id: request.user_id,
          description: `Admin ${adminName} rejected cooldown revocation request for ${studentName}.${trimmedReviewReason ? ` Reason: ${trimmedReviewReason}` : ""}`,
          metadata: {
            request_id: requestId,
            review_reason: trimmedReviewReason,
            original_reason: request.reason,
          },
        });

        // Notification to student
        await adminSupabase.from("notifications").insert({
          user_id: request.user_id,
          type: "system",
          title: "Cooldown Revocation Request Rejected",
          message: `Your withdrawal cooldown appeal was reviewed and rejected.${trimmedReviewReason ? ` Reason: ${trimmedReviewReason}` : ""}`,
          read: false,
        });
      }
    }

    revalidatePath("/admin/revocation-requests");
    revalidatePath("/admin/audit-logs");
    revalidatePath("/admin/users");
    revalidatePath("/banned");
    revalidatePath("/applications");

    return { success: true, error: null };
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Failed to review revocation request";
    return { success: false, error: msg };
  }
}
