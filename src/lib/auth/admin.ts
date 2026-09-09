import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export interface AdminUserContext {
  user: User;
  isAdmin: boolean;
}

/**
 * Checks whether a user ID belongs to an active administrator.
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("admin_users")
      .select("user_id, is_active")
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

  const isAdmin = await checkIsAdmin(user.id);
  if (!isAdmin) {
    return null;
  }

  return {
    user,
    isAdmin: true,
  };
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

  const isAdmin = await checkIsAdmin(user.id);
  if (!isAdmin) {
    redirect("/dashboard?error=unauthorized_admin");
  }

  return {
    user,
    isAdmin: true,
  };
}
