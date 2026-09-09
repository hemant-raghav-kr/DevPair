import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export const CANONICAL_SUPER_ADMIN_UUID = "02635888-ded4-4108-9fed-16fd43c7a3e5";
export const CANONICAL_SUPER_ADMIN_EMAIL = "hk9981@srmist.edu.in";

export type AdminRole = "super_admin" | "admin";

export interface AdminUserContext {
  user: User;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: AdminRole;
}

export interface BanStatus {
  banned: boolean;
  banReason: string | null;
  bannedAt: string | null;
}

/**
 * Checks whether a user ID belongs to an active administrator (admin or super_admin).
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("admin_users")
      .select("user_id, is_active, role")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    return true;
  } catch (err) {
    console.error("[DevPair Admin] Error checking admin status:", err);
    return false;
  }
}

/**
 * Checks whether a user ID belongs to an active Super Administrator.
 */
export async function checkIsSuperAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("admin_users")
      .select("user_id, is_active, role")
      .eq("user_id", userId)
      .eq("is_active", true)
      .eq("role", "super_admin")
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    return true;
  } catch (err) {
    console.error("[DevPair Admin] Error checking super_admin status:", err);
    return false;
  }
}

/**
 * Checks whether a student user is currently banned.
 */
export async function checkIsBanned(userId: string): Promise<BanStatus> {
  if (!userId) {
    return { banned: false, banReason: null, bannedAt: null };
  }

  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("user_bans")
      .select("user_id, banned, ban_reason, banned_at")
      .eq("user_id", userId)
      .eq("banned", true)
      .maybeSingle();

    if (error || !data) {
      return { banned: false, banReason: null, bannedAt: null };
    }

    return {
      banned: true,
      banReason: data.ban_reason,
      bannedAt: data.banned_at,
    };
  } catch (err) {
    console.error("[DevPair Admin] Error checking ban status:", err);
    return { banned: false, banReason: null, bannedAt: null };
  }
}

/**
 * Retrieves the current authenticated user and determines if they have active admin privileges.
 * Returns the admin context or null if not authenticated / not an admin.
 */
export async function getAdminUser(): Promise<AdminUserContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  try {
    const adminSupabase = createAdminClient();
    const { data: adminRecord, error } = await adminSupabase
      .from("admin_users")
      .select("user_id, is_active, role")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !adminRecord) {
      return null;
    }

    const role = (adminRecord.role as AdminRole) || "admin";
    const isSuperAdmin = role === "super_admin";

    return {
      user,
      isAdmin: true,
      isSuperAdmin,
      role,
    };
  } catch (err) {
    console.error("[DevPair Admin] Error retrieving admin user context:", err);
    return null;
  }
}

/**
 * Enforces admin authorization on Server Components and Server Actions.
 * - If unauthenticated: redirects to login.
 * - If regular student (non-admin): redirects to dashboard with unauthorized error.
 * - If authorized: returns AdminUserContext.
 */
export async function requireAdmin(): Promise<AdminUserContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const adminContext = await getAdminUser();
  if (!adminContext || !adminContext.isAdmin) {
    redirect("/dashboard?error=unauthorized_admin");
  }

  return adminContext;
}

/**
 * Enforces Super Admin authorization on Server Components and Server Actions.
 * - If unauthenticated: redirects to login.
 * - If normal admin or regular student: redirects to /admin with unauthorized error.
 * - If authorized: returns AdminUserContext with isSuperAdmin === true.
 */
export async function requireSuperAdmin(): Promise<AdminUserContext> {
  const adminContext = await requireAdmin();

  if (!adminContext.isSuperAdmin) {
    redirect("/admin?error=unauthorized_super_admin");
  }

  return adminContext;
}
