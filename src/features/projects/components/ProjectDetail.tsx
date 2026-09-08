"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AvatarPreview } from "@/features/profiles/components/AvatarPreview";
import { ProjectRoleCard } from "./ProjectRoleCard";
import { DeleteProjectButton } from "./DeleteProjectButton";
import { ApplyModal } from "@/features/applications/components/ApplyModal";
import { formatDate } from "@/lib/utils";
import type {
  ProjectWithDetails,
  ProjectRoleWithSkill,
  ProjectStatus,
  ProjectVisibility,
} from "../types";
import type { ApplicationStatus } from "@/features/applications/types";

interface ProjectDetailProps {
  project: ProjectWithDetails;
  isOwner: boolean;
  currentUserId?: string | null;
  roleAcceptedCounts?: Record<string, number>;
  userRoleApplicationStatuses?: Record<string, ApplicationStatus | null>;
  totalApplicationsCount?: number;
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

export function ProjectDetail({
  project,
  isOwner,
  currentUserId,
  roleAcceptedCounts = {},
  userRoleApplicationStatuses = {},
  totalApplicationsCount = 0,
}: ProjectDetailProps) {
  const [applyingRole, setApplyingRole] = useState<ProjectRoleWithSkill | null>(null);
  const [appStatuses, setAppStatuses] = useState<Record<string, ApplicationStatus | null>>(
    userRoleApplicationStatuses
  );
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const totalSlots = project.roles.reduce((acc, r) => acc + r.slots, 0);
  const totalAccepted = Object.values(roleAcceptedCounts).reduce(
    (acc, val) => acc + val,
    0
  );
  const openSlots = Math.max(0, totalSlots - totalAccepted);

  const handleApplySuccess = () => {
    if (applyingRole) {
      setAppStatuses((prev) => ({
        ...prev,
        [applyingRole.id]: "pending",
      }));
      setSuccessBanner(
        `Your application for "${applyingRole.title}" was submitted successfully!`
      );
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span>Back to Projects</span>
        </Link>

        {isOwner && (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/projects/${project.id}/applications`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <span>Review Requests ({totalApplicationsCount})</span>
            </Link>

            <Link
              href={`/projects/${project.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-3.5 py-2 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
              </svg>
              <span>Edit</span>
            </Link>

            <DeleteProjectButton
              projectId={project.id}
              projectTitle={project.title}
              redirectTo="/projects"
            />
          </div>
        )}
      </div>

      {successBanner && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/40 text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
          <span>{successBanner}</span>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Project Card */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Badges Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase font-mono tracking-wider font-semibold rounded-md bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-zinc-600 dark:text-zinc-400">
            {project.category.replace(/_/g, " ")}
          </span>

          <span
            className={`text-xs uppercase font-mono font-semibold rounded-md border px-2.5 py-1 ${
              statusStyles[project.status as ProjectStatus] || statusStyles.recruiting
            }`}
          >
            {project.status.replace(/_/g, " ")}
          </span>

          <span
            className={`text-xs font-mono capitalize rounded-md border px-2 py-0.5 ${
              visibilityStyles[project.visibility as ProjectVisibility] ||
              visibilityStyles.public
            }`}
          >
            {project.visibility}
          </span>

          {project.is_hackathon && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-1">
              <span>⚡ Hackathon Project</span>
              {project.hackathon_name && (
                <span>• {project.hackathon_name}</span>
              )}
            </span>
          )}
        </div>

        {/* Title & Tagline */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            {project.title}
          </h1>
          {project.tagline && (
            <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-3xl">
              {project.tagline}
            </p>
          )}
        </div>

        {/* Hackathon Deadline Banner if applicable */}
        {project.is_hackathon && project.hackathon_deadline && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-4 flex items-center gap-3 text-xs text-amber-800 dark:text-amber-300">
            <svg className="h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span className="font-semibold">Submission Deadline:</span>{" "}
              <span>{formatDate(project.hackathon_deadline)}</span>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="pt-2 space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
            About the Project
          </h2>
          <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
            {project.description}
          </div>
        </div>

        {/* Specs & External Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="space-y-1">
            <span className="text-[11px] uppercase font-mono tracking-wider text-zinc-400">
              Team Capacity
            </span>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Max {project.max_team_size} members ({openSlots} slots open)
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] uppercase font-mono tracking-wider text-zinc-400">
              Created
            </span>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {formatDate(project.created_at)}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] uppercase font-mono tracking-wider text-zinc-400">
              Project Links
            </span>
            <div className="flex items-center gap-3">
              {project.repo_url && (
                <Link
                  href={project.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>Repository</span>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </Link>
              )}
              {project.demo_url && (
                <Link
                  href={project.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>Live Demo</span>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </Link>
              )}
              {!project.repo_url && !project.demo_url && (
                <span className="text-xs text-zinc-400 italic">None provided</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Required Roles Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Open Teammate Roles ({project.roles.length})
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Positions currently open for collaboration ({openSlots} of {totalSlots} slots remaining).
            </p>
          </div>

          {isOwner && (
            <Link
              href={`/projects/${project.id}/edit`}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              + Manage Roles
            </Link>
          )}
        </div>

        {project.roles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.roles.map((role) => (
              <ProjectRoleCard
                key={role.id}
                role={role}
                isOwner={isOwner}
                acceptedCount={roleAcceptedCounts[role.id] || 0}
                userApplicationStatus={appStatuses[role.id]}
                onApply={() => setApplyingRole(role)}
                isAuthenticated={Boolean(currentUserId)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center space-y-2">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              No specific roles specified yet
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              {isOwner
                ? "Add defined roles so other students know what skills you need on your team."
                : "The project owner has not listed specific roles yet."}
            </p>
            {isOwner && (
              <Link
                href={`/projects/${project.id}/edit`}
                className="inline-block text-xs font-semibold text-blue-600 dark:text-blue-400 pt-1"
              >
                + Define roles in Edit Project
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Project Lead / Owner Card */}
      {project.owner && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-xs">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
            Project Lead
          </h2>
          <div className="flex items-center gap-4">
            <Link href={`/profile/${project.owner.username}`}>
              <AvatarPreview
                avatarUrl={project.owner.avatar_url}
                name={project.owner.full_name || project.owner.username}
                size="md"
              />
            </Link>
            <div className="space-y-0.5">
              <Link
                href={`/profile/${project.owner.username}`}
                className="font-bold text-sm text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {project.owner.full_name}
              </Link>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                @{project.owner.username}
                {project.owner.college && ` • ${project.owner.college}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {applyingRole && currentUserId && (
        <ApplyModal
          isOpen={Boolean(applyingRole)}
          onClose={() => setApplyingRole(null)}
          project={{ id: project.id, title: project.title }}
          role={applyingRole}
          applicantId={currentUserId}
          onSuccess={handleApplySuccess}
        />
      )}
    </div>
  );
}
