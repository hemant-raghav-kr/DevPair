import type { ComplaintPriority } from "../types";

interface ComplaintPriorityBadgeProps {
  priority: ComplaintPriority | string;
  className?: string;
}

export function ComplaintPriorityBadge({ priority, className = "" }: ComplaintPriorityBadgeProps) {
  switch (priority) {
    case "critical":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 ${className}`}
        >
          <svg className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          CRITICAL
        </span>
      );
    case "high":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 ${className}`}
        >
          <svg className="w-3 h-3 text-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
          </svg>
          High
        </span>
      );
    case "normal":
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 ${className}`}
        >
          Normal
        </span>
      );
    case "low":
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 ${className}`}
        >
          Low
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 ${className}`}
        >
          {priority}
        </span>
      );
  }
}
