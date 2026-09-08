"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { ProficiencyLevel } from "../types";

interface SkillBadgeProps {
  name: string;
  category?: string;
  proficiency?: ProficiencyLevel;
  onRemove?: () => void;
  className?: string;
}

const proficiencyStyles: Record<ProficiencyLevel, string> = {
  beginner: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  intermediate: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  advanced: "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800",
};

export function SkillBadge({
  name,
  category,
  proficiency,
  onRemove,
  className,
}: SkillBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 shadow-sm text-sm",
        className
      )}
    >
      <span className="font-medium text-zinc-900 dark:text-zinc-100">{name}</span>

      {category && (
        <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 dark:text-zinc-500">
          {category.replace("_", "/")}
        </span>
      )}

      {proficiency && (
        <span
          className={cn(
            "rounded-md border px-1.5 py-0.5 text-[11px] font-semibold capitalize",
            proficiencyStyles[proficiency]
          )}
        >
          {proficiency}
        </span>
      )}

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className="ml-1 rounded p-0.5 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
