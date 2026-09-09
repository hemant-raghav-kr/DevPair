"use client";

import { useState } from "react";
import { ReportModal } from "./ReportModal";

interface ReportButtonProps {
  targetType?: "user" | "project" | "application" | "general";
  targetTitle?: string;
  reportedUsername?: string;
  reportedUserId?: string;
  reportedProjectId?: string;
  reportedApplicationId?: string;
  buttonLabel?: string;
  className?: string;
  variant?: "outline" | "danger" | "ghost" | "subtle";
  size?: "sm" | "md";
}

export function ReportButton({
  targetType = "general",
  targetTitle,
  reportedUsername,
  reportedUserId,
  reportedProjectId,
  reportedApplicationId,
  buttonLabel,
  className = "",
  variant = "outline",
  size = "sm",
}: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const defaultLabel =
    targetType === "user"
      ? "Report User"
      : targetType === "project"
      ? "Report Project"
      : targetType === "application"
      ? "Report Issue"
      : "Report Problem";

  const label = buttonLabel || defaultLabel;

  const baseStyles =
    "inline-flex items-center gap-1.5 font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1";

  const sizeStyles =
    size === "sm"
      ? "px-2.5 py-1.5 text-xs"
      : "px-3.5 py-2 text-sm";

  const variantStyles = {
    outline:
      "border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/60 hover:bg-red-50/50 dark:hover:bg-red-950/20",
    danger:
      "border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50",
    ghost:
      "text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800",
    subtle:
      "text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:underline p-0",
  }[variant];

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        title={label}
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>{label}</span>
      </button>

      <ReportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        targetType={targetType}
        targetTitle={targetTitle}
        reportedUsername={reportedUsername}
        reportedUserId={reportedUserId}
        reportedProjectId={reportedProjectId}
        reportedApplicationId={reportedApplicationId}
      />
    </>
  );
}
