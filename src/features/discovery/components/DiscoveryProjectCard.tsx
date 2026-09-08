"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AvatarPreview } from "@/features/profiles";
import { SkillBadge } from "@/features/skills/components/SkillBadge";
import { ApplyModal } from "@/features/applications/components/ApplyModal";
import type { DiscoveryProject, DiscoveryRole } from "../types";

interface DiscoveryProjectCardProps {
  project: DiscoveryProject;
  currentUserId?: string | null;
  onApplicationSuccess?: () => void;
}

export function DiscoveryProjectCard({
  project,
  currentUserId,
  onApplicationSuccess,
}: DiscoveryProjectCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedRoleForApply, setSelectedRoleForApply] = useState<DiscoveryRole | null>(null);

  const match = project.match;
  const bestRole = project.bestRole;
  const isOwner = project.isOwner;

  // ML Compatibility styling
  let scoreBadgeColor = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
  let scoreProgressColor = "bg-blue-600";
  if (match) {
    if (match.score >= 85) {
      scoreBadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
      scoreProgressColor = "bg-emerald-600";
    } else if (match.score >= 70) {
      scoreBadgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800";
      scoreProgressColor = "bg-indigo-600";
    } else if (match.score >= 50) {
      scoreBadgeColor = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
      scoreProgressColor = "bg-amber-600";
    } else {
      scoreBadgeColor = "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700";
      scoreProgressColor = "bg-zinc-400";
    }
  }

  // Application state for best-fit role
  const bestRoleAppStatus = bestRole?.userApplicationStatus;

  // Open roles to display (up to 3)
  const openRoles = project.roles.filter((r) => r.openSlots > 0);
  const displayRoles = openRoles.slice(0, 3);
  const remainingRolesCount = Math.max(0, openRoles.length - 3);

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:shadow-md transition-all">
      <div className="space-y-4">
        {/* Card Header: Category, Hackathon & ML Score */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-2xs uppercase tracking-wider font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {project.category.replace(/_/g, " ")}
            </span>
            {project.is_hackathon && (
              <span className="text-2xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                Hackathon
              </span>
            )}
            {project.status !== "recruiting" && (
              <span className="text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {project.status}
              </span>
            )}
          </div>

          {/* AI Compatibility Badge */}
          {match && !isOwner && (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${scoreBadgeColor}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${scoreProgressColor}`} />
              <span className="text-sm font-extrabold">{match.score}%</span>
              <span>Match</span>
            </div>
          )}
        </div>

        {/* Title & Tagline */}
        <div>
          <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 line-clamp-1">
            <Link
              href={`/projects/${project.id}`}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {project.title}
            </Link>
          </h3>
          {project.tagline ? (
            <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-1">
              {project.tagline}
            </p>
          ) : (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">
              {project.description}
            </p>
          )}
        </div>

        {/* Project Owner Info */}
        <div className="flex items-center gap-2 pt-1 text-xs text-zinc-500 dark:text-zinc-400">
          <AvatarPreview
            avatarUrl={project.owner?.avatar_url}
            name={project.owner?.full_name || project.owner?.username}
            size="sm"
          />
          <div className="truncate">
            <span className="text-zinc-400">Led by </span>
            <Link
              href={`/profile/${project.owner?.username}`}
              className="font-medium text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              @{project.owner?.username}
            </Link>
          </div>
        </div>

        {/* Best-Fit Role Box (when ML match exists) */}
        {bestRole && match && !isOwner && (
          <div className="rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-800/40 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-2xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
              <span>Best Fit for You:</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold lowercase">
                {match.tier}
              </span>
            </div>
            <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
              <span>{bestRole.title}</span>
              <span className="font-mono text-2xs text-zinc-500">
                {bestRole.openSlots} {bestRole.openSlots === 1 ? "slot" : "slots"}
              </span>
            </div>

            {/* Expandable "Why this matches" toggle */}
            {match.factors.length > 0 && (
              <div className="pt-1 border-t border-zinc-200/50 dark:border-zinc-700/50">
                <button
                  type="button"
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="inline-flex items-center gap-1 text-2xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                >
                  <span>{showExplanation ? "Hide" : "Why this matches"}</span>
                  <svg
                    className={`h-3 w-3 transition-transform ${showExplanation ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {showExplanation && (
                  <ul className="space-y-1 pt-2 text-2xs">
                    {match.factors.slice(0, 3).map((f, idx) => (
                      <li
                        key={idx}
                        className={`flex items-start gap-1 leading-snug ${
                          f.type === "positive"
                            ? "text-emerald-700 dark:text-emerald-400"
                            : f.type === "negative"
                            ? "text-amber-700 dark:text-amber-400"
                            : "text-zinc-500 dark:text-zinc-400"
                        }`}
                      >
                        <span className="font-bold">{f.type === "positive" ? "✓" : f.type === "negative" ? "△" : "•"}</span>
                        <span>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {/* Open Roles & Required Skills */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-2xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
            <span>Open Roles ({project.openSlots} slots):</span>
          </div>

          {openRoles.length > 0 ? (
            <div className="space-y-1.5">
              {displayRoles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between gap-2 text-xs py-1 px-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80"
                >
                  <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">
                    {role.title}
                  </span>
                  {role.skill && (
                    <SkillBadge
                      name={role.skill.name}
                      category={role.skill.category}
                      className="text-3xs px-1.5 py-0.5"
                    />
                  )}
                </div>
              ))}

              {remainingRolesCount > 0 && (
                <div className="text-2xs text-zinc-400 dark:text-zinc-500 font-medium pl-1">
                  +{remainingRolesCount} more {remainingRolesCount === 1 ? "role" : "roles"} available
                </div>
              )}
            </div>
          ) : (
            <div className="text-2xs italic text-zinc-400 dark:text-zinc-500">
              All team positions currently filled
            </div>
          )}
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="pt-5 mt-5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-3">
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
          <span>View Details</span>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>

        {/* Dynamic Contextual Action */}
        <div>
          {isOwner ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-2xs font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              Your Project
            </span>
          ) : bestRoleAppStatus === "accepted" ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-2xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Accepted on Team
            </span>
          ) : bestRoleAppStatus === "pending" ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-2xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Application Pending
            </span>
          ) : project.openSlots === 0 ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-2xs font-medium text-zinc-400">
              Team Full
            </span>
          ) : currentUserId && bestRole ? (
            <button
              type="button"
              onClick={() => setSelectedRoleForApply(bestRole)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-colors"
            >
              <span>Request to Join</span>
            </button>
          ) : (
            <Link
              href={`/projects/${project.id}`}
              className="inline-flex items-center gap-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-colors"
            >
              <span>Explore Roles</span>
            </Link>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {selectedRoleForApply && currentUserId && (
        <ApplyModal
          isOpen={true}
          onClose={() => setSelectedRoleForApply(null)}
          project={{ id: project.id, title: project.title }}
          role={{
            id: selectedRoleForApply.id,
            title: selectedRoleForApply.title,
            skill: selectedRoleForApply.skill,
          }}
          applicantId={currentUserId}
          onSuccess={() => {
            setSelectedRoleForApply(null);
            if (onApplicationSuccess) onApplicationSuccess();
          }}
        />
      )}
    </div>
  );
}
