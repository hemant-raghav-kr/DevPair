"use client";

import { useState, useMemo } from "react";
import { useRealtimeNotifications } from "../hooks/useRealtimeNotifications";
import { NotificationItem } from "./NotificationItem";
import { deleteAllReadNotifications } from "../actions/notifications";
import type { Notification, NotificationFilter } from "../types";

interface NotificationsContainerProps {
  userId: string;
  initialNotifications: Notification[];
  initialUnreadCount: number;
}

export function NotificationsContainer({
  userId,
  initialNotifications,
  initialUnreadCount,
}: NotificationsContainerProps) {
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [isClearingRead, setIsClearingRead] = useState(false);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    refresh,
  } = useRealtimeNotifications({
    userId,
    initialNotifications,
    initialUnreadCount,
  });

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((n) => !n.read);
    }
    return notifications;
  }, [notifications, filter]);

  const readCount = notifications.filter((n) => n.read).length;

  const handleClearAllRead = async () => {
    if (readCount === 0 || isClearingRead) return;
    setIsClearingRead(true);
    try {
      await deleteAllReadNotifications();
      await refresh();
    } catch (err) {
      console.error("Failed to clear read notifications:", err);
    } finally {
      setIsClearingRead(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Realtime updates on your project applications, join requests, and team activity.
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              Mark all as read
            </button>
          )}

          {readCount > 0 && (
            <button
              type="button"
              onClick={handleClearAllRead}
              disabled={isClearingRead}
              className="px-3.5 py-2 text-xs font-medium rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              {isClearingRead ? "Clearing..." : "Clear read"}
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === "all"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === "unread"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {filter === "unread"
                ? "You're all caught up!"
                : "No notifications yet"}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              {filter === "unread"
                ? "There are no unread notifications right now. Check back later."
                : "When you receive join requests, application updates, or team messages, they will appear here."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onMarkAsRead={markAsRead}
              onDelete={removeNotification}
            />
          ))
        )}
      </div>
    </div>
  );
}
