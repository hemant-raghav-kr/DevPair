"use client";

import Link from "next/link";
import type { Notification } from "../types";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  compact = false,
}: NotificationItemProps) {
  const isAccepted =
    notification.title.toLowerCase().includes("accepted") ||
    notification.message.toLowerCase().includes("accepted");
  const isRejected =
    notification.title.toLowerCase().includes("not accepted") ||
    notification.message.toLowerCase().includes("not accepted");
  const isWithdrawn =
    notification.title.toLowerCase().includes("withdrawn") ||
    notification.message.toLowerCase().includes("withdrew");

  // Determine target URL
  let targetUrl = "";
  if (notification.related_project_id) {
    if (notification.type === "application_received") {
      targetUrl = `/projects/${notification.related_project_id}/applications`;
    } else if (notification.type === "application_status_updated") {
      targetUrl = "/applications";
    } else {
      targetUrl = `/projects/${notification.related_project_id}`;
    }
  } else if (notification.type === "application_status_updated") {
    targetUrl = "/applications";
  }

  // Get icon
  const renderIcon = () => {
    if (notification.type === "application_received") {
      return (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </span>
      );
    }
    if (isAccepted) {
      return (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </span>
      );
    }
    if (isRejected) {
      return (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
      );
    }
    if (isWithdrawn) {
      return (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
      );
    }
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </span>
    );
  };

  return (
    <div
      className={`group relative flex items-start gap-3 transition-colors ${
        compact ? "p-3 border-b border-zinc-100 dark:border-zinc-800/60" : "p-4 rounded-xl border border-zinc-200 dark:border-zinc-800"
      } ${
        !notification.read
          ? "bg-blue-50/40 dark:bg-blue-950/20"
          : "bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      }`}
    >
      {/* Type Icon */}
      {renderIcon()}

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h4
              className={`text-sm truncate ${
                !notification.read
                  ? "font-semibold text-zinc-900 dark:text-zinc-100"
                  : "font-medium text-zinc-800 dark:text-zinc-200"
              }`}
            >
              {notification.title}
            </h4>
            {!notification.read && (
              <span className="w-2 h-2 shrink-0 rounded-full bg-blue-600" title="Unread" />
            )}
          </div>
          <span className="text-xs text-zinc-400 shrink-0">
            {formatRelativeTime(notification.created_at)}
          </span>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
          {notification.message}
        </p>

        {/* Action Link & Action buttons */}
        <div className="mt-2.5 flex items-center justify-between gap-2">
          {targetUrl ? (
            <Link
              href={targetUrl}
              onClick={() => {
                if (!notification.read && onMarkAsRead) {
                  onMarkAsRead(notification.id);
                }
              }}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              View details &rarr;
            </Link>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
            {!notification.read && onMarkAsRead && (
              <button
                type="button"
                onClick={() => onMarkAsRead(notification.id)}
                className="text-xs text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors"
                title="Mark as read"
              >
                Mark read
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(notification.id)}
                className="text-xs text-zinc-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 transition-colors"
                title="Delete notification"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
