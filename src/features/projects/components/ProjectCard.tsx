"use client";

import React from "react";
import Link from "next/link";
import { DeleteProjectButton } from "./DeleteProjectButton";
import { formatDate } from "@/lib/utils";
import type { Project, ProjectStatus, ProjectVisibility } from "../types";

interface ProjectCardProps {
  project: Project;
  roleCount?: number;
  isOwner?: boolean;
  onDeleted?: () => void;
}

const statusStyles: Record<ProjectStatus, string> = {
  recruiting:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  in_progress:
    "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  completed:
    "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  draft:
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
  archived:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
};

const visibilityStyles: Record<ProjectVisibility, string> = {
  public:
    "text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-900/40",
  unlisted:
    "text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700",
  private:
    "text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/40",
};

export function ProjectCard({
  project,
  roleCount = 0,
  isOwner = false,
  onDeleted,
}: ProjectCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5">
      <div className="space-y-3">
        {/* Badges Bar: Category, Status, Visibility, Hackathon */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category */}
          <span className="text-[10px] uppercase font-mono tracking-wider font-semibold rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-zinc-600 dark:text-zinc-400">
            {project.category.replace(/_/g, " ")}
          </span>

          {/* Status */}
          <span
            className={`text-[10px] uppercase font-mono font-semibold rounded-md border px-2 py-0.5 ${
              statusStyles[project.status as ProjectStatus] || statusStyles.recruiting
            }`}
          >
            {project.status.replace(/_/g, " ")}
          </span>

          {/* Visibility */}
          <span
            className={`text-[10px] font-mono capitalize rounded-md border px-1.5 py-0.5 ${
              visibilityStyles[project.visibility as ProjectVisibility] ||
              visibilityStyles.public
            }`}
          >
            {project.visibility}
          </span>

          {/* Hackathon Indicator */}
          {project.is_hackathon && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5">
              <span>⚡ Hackathon</span>
              {project.hackathon_name && (
                <span className="font-normal opacity-80">
                  • {project.hackathon_name}
                </span>
              )}
            </span>
          )}
        </div>

        {/* Title & Tagline */}
        <div className="space-y-1">
          <Link
            href={`/projects/${project.id}`}
            className="group block"
          >
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
              {project.title}
            </h3>
          </Link>
          {project.tagline && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
              {project.tagline}
            </p>
          )}
        </div>
      </div>

      {/* Metadata & Actions */}
      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <span>Max {project.max_team_size} members</span>
          </span>

          <span>•</span>

          <span className="inline-flex items-center gap-1">
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {roleCount}
            </span>
            <span>{roleCount === 1 ? "role needed" : "roles needed"}</span>
          </span>

          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline text-[11px] text-zinc-400">
            {formatDate(project.created_at)}
          </span>
        </div>

        {/* Links / Owner Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Link
            href={`/projects/${project.id}`}
            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            View
          </Link>

          {isOwner && (
            <>
              <Link
                href={`/projects/${project.id}/edit`}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
              >
                Edit
              </Link>
              <DeleteProjectButton
                projectId={project.id}
                projectTitle={project.title}
                onDeleted={onDeleted}
                className="p-1 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
