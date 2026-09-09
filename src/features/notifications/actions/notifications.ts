"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Notification, NotificationFilter } from "../types";

/**
 * Fetch notifications for the current authenticated user.
 */
export async function getNotifications(
  filter: NotificationFilter = "all",
  limit = 50
): Promise<{ notifications: Notification[]; error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { notifications: [], error: "Not authenticated" };
    }

    let query = supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (filter === "unread") {
      query = query.eq("read", false);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return { notifications: [], error: error.message };
    }

    return { notifications: (data as Notification[]) || [], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Unexpected error in getNotifications:", err);
    return { notifications: [], error: message };
  }
}

/**
 * Get count of unread notifications for the current authenticated user.
 */
export async function getUnreadNotificationsCount(): Promise<{
  count: number;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { count: 0, error: "Not authenticated" };
    }

    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("read", false);

    if (error) {
      console.error("Error fetching unread count:", error);
      return { count: 0, error: error.message };
    }

    return { count: count || 0, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Unexpected error in getUnreadNotificationsCount:", err);
    return { count: 0, error: message };
  }
}

/**
 * Mark a specific notification as read.
 */
export async function markNotificationAsRead(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    if (error) {
      console.error("Error marking notification as read:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/notifications");
    return { success: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Mark all unread notifications as read for current user.
 */
export async function markAllNotificationsAsRead(): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("read", false)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error marking all notifications as read:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/notifications");
    return { success: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Delete a notification by ID.
 */
export async function deleteNotification(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting notification:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/notifications");
    return { success: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Delete all read notifications for the current user.
 */
export async function deleteAllReadNotifications(): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("read", true)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error clearing read notifications:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/notifications");
    return { success: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
