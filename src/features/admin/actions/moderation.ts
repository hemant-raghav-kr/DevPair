"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireAdmin,
  requireSuperAdmin,
  CANONICAL_SUPER_ADMIN_UUID,
} from "@/lib/auth/admin";

/**
 * Ban a student user with a required reason.
 * Allowed for any authorized admin.
 */
export async function banStudentAction({
  userId,
  reason,
}: {
  userId: string;
  reason: string;
}): Promise<{ success: boolean; error: string | null }> {
  try {
    const adminContext = await requireAdmin();
    const adminSupabase = createAdminClient();

    if (!userId) {
      return { success: false, error: "User ID is required." };
    }

    if (!reason || !reason.trim()) {
      return { success: false, error: "A ban reason is required." };
    }

    // Protection: Cannot ban the canonical super admin
    if (userId === CANONICAL_SUPER_ADMIN_UUID) {
      return { success: false, error: "Cannot ban the canonical Super Admin." };
    }

    // Protection: Cannot ban an active admin without demoting first
    const { data: adminRecord } = await adminSupabase
      .from("admin_users")
      .select("role, is_active")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (adminRecord) {
      return {
        success: false,
        error: "Cannot ban an active administrator. Revoke admin privileges first.",
      };
    }

    // Upsert into public.user_bans
    const { error: banError } = await adminSupabase.from("user_bans").upsert(
      {
        user_id: userId,
        banned: true,
        banned_at: new Date().toISOString(),
        banned_by: adminContext.user.id,
        ban_reason: reason.trim(),
      },
      { onConflict: "user_id" }
    );

    if (banError) {
      console.error("[Admin Ban Error]:", banError);
      return { success: false, error: banError.message };
    }

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { success: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to ban student";
    return { success: false, error: message };
  }
}

/**
 * Unban a student user, restoring normal student access.
 * Allowed for any authorized admin.
 */
export async function unbanStudentAction({
  userId,
}: {
  userId: string;
}): Promise<{ success: boolean; error: string | null }> {
  try {
    await requireAdmin();
    const adminSupabase = createAdminClient();

    if (!userId) {
      return { success: false, error: "User ID is required." };
    }

    // Delete or set banned = false in public.user_bans
    const { error: unbanError } = await adminSupabase
      .from("user_bans")
      .delete()
      .eq("user_id", userId);

    if (unbanError) {
      console.error("[Admin Unban Error]:", unbanError);
      return { success: false, error: unbanError.message };
    }

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { success: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to unban student";
    return { success: false, error: message };
  }
}

/**
 * Promote a student user to normal Admin.
 * STRICTLY RESTRICTED TO SUPER ADMIN.
 * Normal admins cannot create or promote admins.
 * Cannot create or promote to super_admin.
 */
export async function promoteStudentToAdminAction({
  userId,
}: {
  userId: string;
}): Promise<{ success: boolean; error: string | null }> {
  try {
    const superAdminContext = await requireSuperAdmin();
    const adminSupabase = createAdminClient();

    if (!userId) {
      return { success: false, error: "User ID is required." };
    }

    // Cannot promote someone if banned
    const { data: banRecord } = await adminSupabase
      .from("user_bans")
      .select("banned")
      .eq("user_id", userId)
      .eq("banned", true)
      .maybeSingle();

    if (banRecord) {
      return {
        success: false,
        error: "Cannot promote a banned student. Unban the student first.",
      };
    }

    // Upsert into admin_users with role = 'admin' (only 'admin' can be created)
    const { error: upsertError } = await adminSupabase.from("admin_users").upsert(
      {
        user_id: userId,
        role: "admin",
        is_active: true,
        created_by: superAdminContext.user.id,
      },
      { onConflict: "user_id" }
    );

    if (upsertError) {
      console.error("[Promote Admin Error]:", upsertError);
      return { success: false, error: upsertError.message };
    }

    revalidatePath("/admin/admins");
    revalidatePath("/admin/users");
    return { success: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to promote admin";
    return { success: false, error: message };
  }
}

/**
 * Toggle an administrator's active status.
 * STRICTLY RESTRICTED TO SUPER ADMIN.
 * Cannot deactivate canonical super admin.
 */
export async function toggleAdminActiveAction({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}): Promise<{ success: boolean; error: string | null }> {
  try {
    await requireSuperAdmin();
    const adminSupabase = createAdminClient();

    if (!userId) {
      return { success: false, error: "User ID is required." };
    }

    // Protection: Canonical super admin cannot be deactivated
    if (userId === CANONICAL_SUPER_ADMIN_UUID && !isActive) {
      return {
        success: false,
        error: "Cannot deactivate the canonical Super Admin.",
      };
    }

    const { error: updateError } = await adminSupabase
      .from("admin_users")
      .update({ is_active: isActive })
      .eq("user_id", userId);

    if (updateError) {
      console.error("[Toggle Admin Active Error]:", updateError);
      return { success: false, error: updateError.message };
    }

    revalidatePath("/admin/admins");
    return { success: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update admin status";
    return { success: false, error: message };
  }
}

/**
 * Remove admin privileges completely from a user.
 * STRICTLY RESTRICTED TO SUPER ADMIN.
 * Cannot remove canonical super admin.
 */
export async function removeAdminAction({
  userId,
}: {
  userId: string;
}): Promise<{ success: boolean; error: string | null }> {
  try {
    await requireSuperAdmin();
    const adminSupabase = createAdminClient();

    if (!userId) {
      return { success: false, error: "User ID is required." };
    }

    // Protection: Canonical super admin cannot be removed
    if (userId === CANONICAL_SUPER_ADMIN_UUID) {
      return {
        success: false,
        error: "Cannot remove privileges from the canonical Super Admin.",
      };
    }

    const { error: deleteError } = await adminSupabase
      .from("admin_users")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      console.error("[Remove Admin Error]:", deleteError);
      return { success: false, error: deleteError.message };
    }

    revalidatePath("/admin/admins");
    revalidatePath("/admin/users");
    return { success: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to remove admin";
    return { success: false, error: message };
  }
}
