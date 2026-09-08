"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AvatarPreview } from "@/features/profiles/components/AvatarPreview";
import { SkillBadge } from "@/features/skills/components/SkillBadge";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import { formatDate } from "@/lib/utils";
import type { ApplicationWithOwnerView } from "../types";

interface OwnerApplicationCardProps {
  application: ApplicationWithOwnerView;
  roleCapacity: {
    slots: number;
    acceptedCount: number;
  };
  onStatusUpdate: (appId: string, newStatus: "accepted" | "rejected") => Promise<void>;
  isUpdating?: boolean;
}

export function OwnerApplicationCard({
  application,
  roleCapacity,
  onStatusUpdate,
  isUpdating = false,
}: OwnerApplicationCardProps) {
  const [error, setError] = useState<string | null>(null);
  const applicant = application.applicant;

  const isRoleFull = roleCapacity.acceptedCount >= roleCapacity.slots;

  const handleAction = async (status: "accepted" | "rejected") => {
    if (status === "rejected") {
      if (!window.confirm(`Decline join request from @${applicant.username}?`)) {
        return;
      }
    } else if (status === "accepted" && isRoleFull) {
      setError(
        `Cannot accept: this role is already at full capacity (${roleCapacity.acceptedCount}/${roleCapacity.slots} filled).`
      );
      return;
    }

    setError(null);
    try {
      await onStatusUpdate(application.id, status);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update application status."
      );
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      {/* Header: Applicant Identity & Status */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href={`/profile/${applicant.username}`} className="shrink-0 group">
            <AvatarPreview
              avatarUrl={applicant.avatar_url}
              name={applicant.full_name || applicant.username}
              size="md"
              className="group-hover:ring-2 group-hover:ring-blue-500 transition-all"
            />
          </Link>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${applicant.username}`}
                className="font-bold text-base text-zinc-900 dark:text-zinc-50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {applicant.full_name}
              </Link>
              <Link
                href={`/profile/${applicant.username}`}
                className="text-xs font-mono font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                @{applicant.username}
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              {applicant.college && <span>{applicant.college}</span>}
              {applicant.course && <span>• {applicant.course}</span>}
              {applicant.graduation_year && (
                <span className="text-[11px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.2 rounded">
                  Class of {applicant.graduation_year}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="self-start sm:self-auto">
          <ApplicationStatusBadge status={application.status} />
        </div>
      </div>

      {/* Availability & Links */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
        <span className="text-zinc-600 dark:text-zinc-300">
          Availability:{" "}
          <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">
            {applicant.availability_hours_per_week ?? 10} hrs/week
          </strong>
        </span>

        <div className="flex items-center gap-3">
          {applicant.github_url && (
            <Link
              href={applicant.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
            >
              GitHub ↗
            </Link>
          )}
          {applicant.linkedin_url && (
            <Link
              href={applicant.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
            >
              LinkedIn ↗
            </Link>
          )}
          {applicant.portfolio_url && (
            <Link
              href={applicant.portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
            >
              Portfolio ↗
            </Link>
          )}
        </div>
      </div>

      {/* Applicant Skills Preview */}
      {application.applicantSkills && application.applicantSkills.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">
            Applicant Skills
          </span>
          <div className="flex flex-wrap gap-1.5">
            {application.applicantSkills.slice(0, 6).map((item) => (
              <SkillBadge
                key={item.skill_id}
                name={item.skill?.name || "Skill"}
                proficiency={item.proficiency}
              />
            ))}
            {application.applicantSkills.length > 6 && (
              <span className="text-[11px] text-zinc-400 self-center">
                +{application.applicantSkills.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Note / Message */}
      <div className="space-y-1">
        <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">
          Applicant Note
        </span>
        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
          {application.message}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 text-xs border border-red-200 dark:border-red-900/50">
          {error}
        </div>
      )}

      {/* Actions & Timestamps */}
      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400">
        <span>Submitted {formatDate(application.created_at)}</span>

        {application.status === "pending" && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleAction("rejected")}
              className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              Decline
            </button>
            <button
              type="button"
              disabled={isUpdating || isRoleFull}
              onClick={() => handleAction("accepted")}
              className={`px-4 py-1.5 rounded-xl text-white font-semibold transition-colors disabled:opacity-50 ${
                isRoleFull
                  ? "bg-zinc-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-500 shadow-xs"
              }`}
            >
              {isRoleFull ? "Role Full" : "Accept Teammate"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
