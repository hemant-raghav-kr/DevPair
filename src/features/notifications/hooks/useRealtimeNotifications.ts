"use client";

import { useEffect, useState, useCallback, useRef, useId } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Notification, NotificationToastItem } from "../types";

interface UseRealtimeNotificationsProps {
  userId?: string;
  initialNotifications?: Notification[];
  initialUnreadCount?: number;
}

export function useRealtimeNotifications({
  userId,
  initialNotifications = [],
  initialUnreadCount = 0,
}: UseRealtimeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);
  const [toasts, setToasts] = useState<NotificationToastItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(!initialNotifications.length && !!userId);
  const supabaseRef = useRef(createClient());
  const hookId = useId().replace(/[^a-zA-Z0-9]/g, "");

  // Fetch initial notifications if not supplied
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    const supabase = supabaseRef.current;

    try {
      setIsLoading(true);
      const [notifsRes, countRes] = await Promise.all([
        supabase
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("read", false),
      ]);

      if (!notifsRes.error && notifsRes.data) {
        setNotifications(notifsRes.data as Notification[]);
      }
      if (!countRes.error && typeof countRes.count === "number") {
        setUnreadCount(countRes.count);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const hasFetchedInitialRef = useRef(Boolean(initialNotifications.length));

  // Fetch initial notifications if not provided
  useEffect(() => {
    if (!userId || hasFetchedInitialRef.current) return;
    hasFetchedInitialRef.current = true;
    fetchNotifications();
  }, [userId, fetchNotifications]);

  // Set up Realtime listener
  useEffect(() => {
    if (!userId) return;
    const supabase = supabaseRef.current;
    let isCancelled = false;

    // Use unique channel topic per component instance to prevent collisions
    // when multiple components (e.g., NotificationBell + NotificationsContainer) mount concurrently
    const channelName = `notifications:${userId}:${hookId}`;
    const channel = supabase.channel(channelName);

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (isCancelled) return;
          if (payload.eventType === "INSERT") {
            const newNotif = payload.new as Notification;
            setNotifications((prev) => {
              if (prev.some((n) => n.id === newNotif.id)) return prev;
              return [newNotif, ...prev];
            });
            if (!newNotif.read) {
              setUnreadCount((c) => c + 1);
            }
            // Trigger toast alert
            setToasts((prev) => [
              ...prev,
              {
                id: newNotif.id,
                title: newNotif.title,
                message: newNotif.message,
                type: newNotif.type,
                related_project_id: newNotif.related_project_id,
                related_application_id: newNotif.related_application_id,
                timestamp: Date.now(),
              },
            ]);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Notification;
            setNotifications((prev) => {
              const old = prev.find((n) => n.id === updated.id);
              if (old && !old.read && updated.read) {
                setUnreadCount((c) => Math.max(0, c - 1));
              } else if (old && old.read && !updated.read) {
                setUnreadCount((c) => c + 1);
              }
              return prev.map((n) => (n.id === updated.id ? updated : n));
            });
          } else if (payload.eventType === "DELETE") {
            const oldId = (payload.old as { id?: string })?.id;
            if (oldId) {
              setNotifications((prev) => {
                const existing = prev.find((n) => n.id === oldId);
                if (existing && !existing.read) {
                  setUnreadCount((c) => Math.max(0, c - 1));
                }
                return prev.filter((n) => n.id !== oldId);
              });
            }
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error("[DevPair Realtime] Subscription error:", err);
        }
      });

    return () => {
      isCancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId, hookId]);

  // Mark single as read
  const markAsRead = useCallback(
    async (id: string) => {
      const supabase = supabaseRef.current;
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      try {
        const { error } = await supabase
          .from("notifications")
          .update({ read: true })
          .eq("id", id);
        if (error) throw error;
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
        // Revert by re-fetching
        fetchNotifications();
      }
    },
    [fetchNotifications]
  );

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    const supabase = supabaseRef.current;
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("read", false)
        .eq("user_id", userId);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      fetchNotifications();
    }
  }, [userId, fetchNotifications]);

  // Delete notification
  const removeNotification = useCallback(
    async (id: string) => {
      const supabase = supabaseRef.current;
      // Optimistic removal
      setNotifications((prev) => {
        const existing = prev.find((n) => n.id === id);
        if (existing && !existing.read) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });

      try {
        const { error } = await supabase
          .from("notifications")
          .delete()
          .eq("id", id);
        if (error) throw error;
      } catch (err) {
        console.error("Failed to delete notification:", err);
        fetchNotifications();
      }
    },
    [fetchNotifications]
  );

  // Dismiss toast
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    toasts,
    markAsRead,
    markAllAsRead,
    removeNotification,
    dismissToast,
    refresh: fetchNotifications,
  };
}
