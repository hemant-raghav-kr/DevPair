"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { NotificationToastItem } from "../types";

interface NotificationToastProps {
  toasts: NotificationToastItem[];
  onDismiss: (id: string) => void;
}

export function NotificationToast({ toasts, onDismiss }: NotificationToastProps) {
  useEffect(() => {
    if (toasts.length === 0) return;

    const timer = setInterval(() => {
      const now = Date.now();
      toasts.forEach((toast) => {
        if (now - toast.timestamp > 5000) {
          onDismiss(toast.id);
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isAccepted =
          toast.title.toLowerCase().includes("accepted") ||
          toast.message.toLowerCase().includes("accepted");
        const isRejected =
          toast.title.toLowerCase().includes("not accepted") ||
          toast.message.toLowerCase().includes("not accepted") ||
          toast.title.toLowerCase().includes("update");
        const isWithdrawn =
          toast.title.toLowerCase().includes("withdrawn") ||
          toast.message.toLowerCase().includes("withdrew");

        const targetHref = toast.related_project_id
          ? toast.type === "application_received"
            ? `/projects/${toast.related_project_id}/applications`
            : `/projects/${toast.related_project_id}`
          : "/notifications";

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3"
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {toast.type === "application_received" ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </span>
              ) : isAccepted ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              ) : isRejected ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              ) : isWithdrawn ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {toast.title}
                </p>
                <button
                  type="button"
                  onClick={() => onDismiss(toast.id)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-0.5 rounded"
                  aria-label="Dismiss"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5 line-clamp-2">
                {toast.message}
              </p>
              <div className="mt-2">
                <Link
                  href={targetHref}
                  onClick={() => onDismiss(toast.id)}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  View Details &rarr;
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
