"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkIsBanned } from "@/lib/auth/admin";

/**
 * Server action: Student voluntarily withdraws their pending application.
 * Enforces:
 * 1. Authenticated student owns the application.
 * 2. Application status is 'pending'.
 * 3. Status updated to 'withdrawn'.
 * 4. Exactly 3-day cooldown created.
 * 5. Audit logs recorded for withdrawal and cooldown creation.
 */
export async function withdrawApplicationAction({
  applicationId,
}: {
  applicationId: string;
}): Promise<{ success: boolean; error: string | null; cooldownUntil?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized. Please sign in." };
    }

    if (!applicationId) {
      return { success: false, error: "Application ID is required." };
    }

    // Retrieve application
    const { data: application, error: fetchErr } = await supabase
      .from("applications")
      .select("id, project_id, applicant_id, role_id, status, projects(id, title, owner_id)")
      .eq("id", applicationId)
      .maybeSingle();

    if (fetchErr || !application) {
      return { success: false, error: "Application not found." };
    }

    // Authorization: Only the applicant can withdraw
    if (application.applicant_id !== user.id) {
      return { success: false, error: "You can only withdraw your own applications." };
    }

    // Project owner protection: project owner cannot withdraw from their own project ownership
    const project = application.projects as { id?: string; title?: string; owner_id?: string } | null;
    if (project && project.owner_id === user.id) {
      return { success: false, error: "Project owners cannot withdraw from their own projects." };
    }

    // Allowed statuses: 'pending' or 'accepted'
    if (application.status !== "pending" && application.status !== "accepted") {
      return {
        success: false,
        error: `Cannot withdraw an application that is already ${application.status}.`,
      };
    }

    const wasAccepted = application.status === "accepted";

    // Update application to 'withdrawn'
    const adminClient = createAdminClient();
    const { error: updateErr } = await adminClient
      .from("applications")
      .update({ status: "withdrawn" })
      .eq("id", applicationId);

    if (updateErr) {
      return { success: false, error: updateErr.message || "Failed to update application." };
    }

    // 3-Day Cooldown from exact withdrawal timestamp
    const now = new Date();
    const cooldownUntil = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

    // Close any previous unrevoked cooldown record for this user
    await adminClient
      .from("withdrawal_cooldowns")
      .update({
        revoked_at: now.toISOString(),
        revocation_reason: "Superseded by new withdrawal",
      })
      .eq("user_id", user.id)
      .is("revoked_at", null);

    // Insert new 3-day cooldown
    await adminClient.from("withdrawal_cooldowns").insert({
      user_id: user.id,
      project_id: application.project_id,
      application_id: application.id,
      cooldown_until: cooldownUntil,
      reason: wasAccepted
        ? "Voluntary team member withdrawal"
        : "Voluntary application withdrawal",
    });

    // Retrieve student name and project title for audit log
    const { data: profile } = await adminClient
      .from("profiles")
      .select("full_name, username")
      .eq("id", user.id)
      .maybeSingle();

    const studentName = profile?.full_name?.trim() || profile?.username || "Student";
    const projectTitle = project?.title || "Project";

    // Audit Log A: application_withdrawn
    await adminClient.from("audit_logs").insert({
      event_type: "application_withdrawn",
      actor_user_id: user.id,
      target_user_id: user.id,
      project_id: application.project_id,
      application_id: application.id,
      role_id: application.role_id,
      description: wasAccepted
        ? `${studentName} withdrew from ${projectTitle} (left team).`
        : `${studentName} withdrew their application from ${projectTitle}.`,
      metadata: { was_accepted: wasAccepted },
    });

    // Audit Log B: withdrawal_cooldown_created
    await adminClient.from("audit_logs").insert({
      event_type: "withdrawal_cooldown_created",
      actor_user_id: user.id,
      target_user_id: user.id,
      project_id: application.project_id,
      application_id: application.id,
      description: `3-day withdrawal cooldown created for ${studentName}.`,
      metadata: { cooldown_until: cooldownUntil, was_accepted: wasAccepted },
    });

    revalidatePath("/applications");
    revalidatePath("/dashboard");
    revalidatePath(`/projects/${application.project_id}`);
    revalidatePath(`/projects/${application.project_id}/applications`);

    return { success: true, error: null, cooldownUntil };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred during withdrawal.",
    };
  }
}

/**
 * Server action: Project owner removes (kicks) an accepted team member.
 * Enforces:
 * 1. Authenticated user is the project owner of the project.
 * 2. Application status is 'accepted'.
 * 3. Owner cannot remove themselves.
 * 4. Application status updated to 'removed'.
 * 5. DB triggers handle role capacity reopening and student notification.
 * 6. NO cooldown is created.
 * 7. Audit log recorded for team_member_removed.
 */
export async function removeTeamMemberAction({
  applicationId,
}: {
  applicationId: string;
}): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized. Please sign in." };
    }

    if (!applicationId) {
      return { success: false, error: "Application ID is required." };
    }

    const adminClient = createAdminClient();

    // Retrieve application with project details
    const { data: application, error: fetchErr } = await adminClient
      .from("applications")
      .select("id, project_id, applicant_id, role_id, status, projects(id, title, owner_id)")
      .eq("id", applicationId)
      .maybeSingle();

    if (fetchErr || !application) {
      return { success: false, error: "Application not found." };
    }

    const project = application.projects as { id: string; title: string; owner_id: string } | null;
    if (!project) {
      return { success: false, error: "Associated project not found." };
    }

    // Authorization: Only the project owner can remove members
    if (project.owner_id !== user.id) {
      return {
        success: false,
        error: "Forbidden: Only the project owner can remove team members from this project.",
      };
    }

    // Only accepted members can be removed
    if (application.status !== "accepted") {
      return {
        success: false,
        error: `Cannot remove member: application is in '${application.status}' state, not 'accepted'.`,
      };
    }

    // Owner cannot kick themselves
    if (application.applicant_id === user.id) {
      return {
        success: false,
        error: "Project owners cannot remove themselves from their own project.",
      };
    }

    // Update status to 'removed'
    const { error: updateErr } = await adminClient
      .from("applications")
      .update({ status: "removed" })
      .eq("id", applicationId);

    if (updateErr) {
      return { success: false, error: updateErr.message || "Failed to remove team member." };
    }

    // Retrieve names for audit log
    const [ownerRes, studentRes] = await Promise.all([
      adminClient.from("profiles").select("full_name, username").eq("id", user.id).maybeSingle(),
      adminClient.from("profiles").select("full_name, username").eq("id", application.applicant_id).maybeSingle(),
    ]);

    const ownerName = ownerRes.data?.full_name?.trim() || ownerRes.data?.username || "Project Owner";
    const studentName = studentRes.data?.full_name?.trim() || studentRes.data?.username || "Student";

    // Audit Log C: team_member_removed
    await adminClient.from("audit_logs").insert({
      event_type: "team_member_removed",
      actor_user_id: user.id,
      target_user_id: application.applicant_id,
      project_id: project.id,
      application_id: application.id,
      role_id: application.role_id,
      description: `Project owner ${ownerName} removed ${studentName} from ${project.title}.`,
    });

    revalidatePath(`/projects/${project.id}`);
    revalidatePath(`/projects/${project.id}/applications`);
    revalidatePath("/applications");

    return { success: true, error: null };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}

/**
 * Check if the currently authenticated user is on an active withdrawal cooldown.
 */
export async function checkUserCooldownAction(): Promise<{
  isOnCooldown: boolean;
  cooldownUntil: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { isOnCooldown: false, cooldownUntil: null };
    }

    const { data: cooldown } = await supabase
      .from("withdrawal_cooldowns")
      .select("id, cooldown_until")
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .gt("cooldown_until", new Date().toISOString())
      .order("cooldown_until", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cooldown) {
      return { isOnCooldown: true, cooldownUntil: cooldown.cooldown_until };
    }

    return { isOnCooldown: false, cooldownUntil: null };
  } catch {
    return { isOnCooldown: false, cooldownUntil: null };
  }
}

/**
 * Server action: Apply to project with server-side cooldown, ban, and ownership checks.
 */
export async function applyToProjectAction({
  projectId,
  roleId,
  message,
}: {
  projectId: string;
  roleId?: string | null;
  message: string;
}): Promise<{ success: boolean; error: string | null; applicationId?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized. Please sign in to apply." };
    }

    const trimmedMsg = message.trim();
    if (!trimmedMsg || trimmedMsg.length < 5 || trimmedMsg.length > 1000) {
      return {
        success: false,
        error: "Application note must be between 5 and 1000 characters.",
      };
    }

    // 1. Verify banned status
    const banStatus = await checkIsBanned(user.id);
    if (banStatus.banned) {
      return {
        success: false,
        error: "Your account has been restricted. You cannot apply to projects.",
      };
    }

    // 2. Check active withdrawal cooldown
    const { data: cooldown } = await supabase
      .from("withdrawal_cooldowns")
      .select("cooldown_until")
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .gt("cooldown_until", new Date().toISOString())
      .order("cooldown_until", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cooldown) {
      const expiryFormatted = new Date(cooldown.cooldown_until).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
      return {
        success: false,
        error: `You are currently on a withdrawal cooldown. You can apply again after ${expiryFormatted}.`,
      };
    }

    // 3. Prevent owner applying to own project
    const { data: project } = await supabase
      .from("projects")
      .select("id, owner_id")
      .eq("id", projectId)
      .maybeSingle();

    if (!project) {
      return { success: false, error: "Project not found." };
    }

    if (project.owner_id === user.id) {
      return { success: false, error: "Project owners cannot apply to their own projects." };
    }

    // 4. Insert application
    const { data, error } = await supabase
      .from("applications")
      .insert({
        project_id: projectId,
        role_id: roleId || null,
        applicant_id: user.id,
        message: trimmedMsg,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      if (
        error.code === "23505" ||
        error.message?.includes("idx_applications_unique_pending")
      ) {
        return {
          success: false,
          error: "You already have an active pending application for this role on this project.",
        };
      }
      if (error.message?.includes("withdrawal cooldown")) {
        return {
          success: false,
          error: error.message,
        };
      }
      return { success: false, error: error.message || "Failed to submit application." };
    }

    revalidatePath("/applications");
    revalidatePath(`/projects/${projectId}`);
    return { success: true, error: null, applicationId: data.id };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred while applying.",
    };
  }
}
