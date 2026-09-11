"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/admin";

/**
 * Revoke an active withdrawal cooldown for a student user.
 * Allowed for any authorized Admin or Super Admin.
 */
export async function revokeCooldownAction({
  userId,
  reason,
}: {
  userId: string;
  reason?: string;
}): Promise<{ success: boolean; error: string | null }> {
  try {
    const adminContext = await requireAdmin();
    const adminSupabase = createAdminClient();

    if (!userId) {
      return { success: false, error: "User ID is required." };
    }

    // Check if user currently has an active cooldown
    const { data: activeCooldown, error: fetchErr } = await adminSupabase
      .from("withdrawal_cooldowns")
      .select("id, cooldown_until, project_id, application_id")
      .eq("user_id", userId)
      .is("revoked_at", null)
      .gt("cooldown_until", new Date().toISOString())
      .order("cooldown_until", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchErr) {
      return { success: false, error: fetchErr.message || "Failed to check cooldown status." };
    }

    if (!activeCooldown) {
      return { success: false, error: "This student does not currently have an active cooldown." };
    }

    const now = new Date().toISOString();
    const revocationReason = reason?.trim() || "Revoked by administrator";

    // Mark all active cooldowns for this user as revoked
    const { error: updateErr } = await adminSupabase
      .from("withdrawal_cooldowns")
      .update({
        revoked_at: now,
        revoked_by: adminContext.user.id,
        revocation_reason: revocationReason,
      })
      .eq("user_id", userId)
      .is("revoked_at", null);

    if (updateErr) {
      return { success: false, error: updateErr.message || "Failed to revoke cooldown." };
    }

    // Fetch names for audit logging
    const [adminProfileRes, studentProfileRes] = await Promise.all([
      adminSupabase.from("profiles").select("full_name, username").eq("id", adminContext.user.id).maybeSingle(),
      adminSupabase.from("profiles").select("full_name, username").eq("id", userId).maybeSingle(),
    ]);

    const adminName =
      adminProfileRes.data?.full_name?.trim() ||
      adminProfileRes.data?.username ||
      "Administrator";
    const studentName =
      studentProfileRes.data?.full_name?.trim() ||
      studentProfileRes.data?.username ||
      "Student";

    // Create Audit Log entry: withdrawal_cooldown_revoked
    await adminSupabase.from("audit_logs").insert({
      event_type: "withdrawal_cooldown_revoked",
      actor_user_id: adminContext.user.id,
      target_user_id: userId,
      project_id: activeCooldown.project_id,
      application_id: activeCooldown.application_id,
      description: `Admin ${adminName} revoked withdrawal cooldown for ${studentName}.${reason?.trim() ? ` Reason: ${reason.trim()}` : ""}`,
      metadata: {
        reason: revocationReason,
        cooldown_id: activeCooldown.id,
        prior_cooldown_until: activeCooldown.cooldown_until,
      },
    });

    // Notify the student
    await adminSupabase.from("notifications").insert({
      user_id: userId,
      type: "system",
      title: "Application Cooldown Revoked",
      message:
        "Your application cooldown has been revoked by an administrator. You may now apply to projects.",
      read: false,
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin/audit-logs");
    revalidatePath("/applications");

    return { success: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to revoke cooldown";
    return { success: false, error: message };
  }
}
