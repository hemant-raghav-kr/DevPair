"use client";

import React from "react";
import type { ProjectRoleWithSkill } from "../types";

interface ProjectRoleCardProps {
  role: ProjectRoleWithSkill;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function ProjectRoleCard({
  role,
  isOwner = false,
  onEdit,
  onDelete,
  isDeleting = false,
}: ProjectRoleCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      <div className="space-y-2">
        {/* Header with Title & Slots */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 tracking-tight">
            {role.title}
          </h3>
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
            <span>Open slots:</span>
            <span className="font-mono font-bold">{role.slots}</span>
          </span>
        </div>

        {/* Description */}
        {role.description && (
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-3">
            {role.description}
          </p>
        )}
      </div>

      {/* Footer: Required Skill & Owner Actions */}
      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
        {role.skill ? (
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 px-2.5 py-1 text-xs text-zinc-800 dark:text-zinc-200">
            <span className="text-zinc-400 text-[10px] font-mono uppercase">Required:</span>
            <span className="font-semibold">{role.skill.name}</span>
          </div>
        ) : (
          <span className="text-[11px] text-zinc-400 italic">No specific skill required</span>
        )}

        {isOwner && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                aria-label={`Edit ${role.title}`}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                aria-label={`Delete ${role.title}`}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
