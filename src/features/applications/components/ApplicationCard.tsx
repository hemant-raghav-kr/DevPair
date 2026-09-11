"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import { WithdrawModal } from "./WithdrawModal";
import { ReportButton } from "@/features/complaints/components/ReportButton";
import { formatDate } from "@/lib/utils";
import type { ApplicationWithDetails } from "../types";

interface ApplicationCardProps {
  application: ApplicationWithDetails;
  onWithdrawn?: (applicationId: string, cooldownUntil?: string) => void;
  activeCooldownUntil?: string | null;
}

export function ApplicationCard({
  application,
  onWithdrawn,
  activeCooldownUntil,
}: ApplicationCardProps) {
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [localCooldown, setLocalCooldown] = useState<string | null>(activeCooldownUntil || null);
  const effectiveCooldown = localCooldown || activeCooldownUntil;
  const isCooldownActive = Boolean(effectiveCooldown);

  return (
    <>
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
        {/* Header: Project Info & Status */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="space-y-1">
            {application.project ? (
              <Link
                href={`/projects/${application.project.id}`}
                className="group inline-block"
              >
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                  {application.project.title}
                </h3>
              </Link>
            ) : (
              <h3 className="font-bold text-base text-zinc-400">Project Unavailable</h3>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                Role: {application.role?.title || "General Teammate"}
              </span>
              {application.role?.skill && (
                <>
                  <span>•</span>
                  <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.2 text-[10px] uppercase font-mono">
                    {application.role.skill.name}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="self-start sm:self-auto">
            <ApplicationStatusBadge status={application.status} />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">
            Your Note
          </span>
          <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
            {application.message}
          </p>
        </div>

        {/* Cooldown Notice if Withdrawn */}
        {application.status === "withdrawn" && isCooldownActive && (
          <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <svg className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="space-y-0.5">
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                Withdrawal Cooldown Active
              </p>
              <p>
                Application withdrawn. You can apply to projects again after{" "}
                <strong className="font-semibold">
                  {new Date(effectiveCooldown!).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </strong>.
              </p>
            </div>
          </div>
        )}

        {/* Removed notice if kicked */}
        {application.status === "removed" && (
          <div className="p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
            <svg className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <div>
              <p className="font-semibold text-rose-900 dark:text-rose-200">
                Removed from Project Team
              </p>
              <p>
                You were removed from this project by the project owner. No cooldown was applied.
              </p>
            </div>
          </div>
        )}

        {/* Footer: Date & Actions */}
        <div className="pt-2 flex items-center justify-between text-xs text-zinc-400">
          <span>Submitted {formatDate(application.created_at)}</span>

          <div className="flex items-center gap-4">
            <ReportButton
              targetType="application"
              reportedApplicationId={application.id}
              targetTitle={`Application for ${application.project?.title || "Project"}`}
              buttonLabel="Report Issue"
              variant="subtle"
            />

            {(application.status === "pending" || application.status === "accepted") && (
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(true)}
                className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              >
                {application.status === "accepted" ? "Withdraw from Project" : "Withdraw Application"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isWithdrawModalOpen && (
        <WithdrawModal
          isOpen={isWithdrawModalOpen}
          onClose={() => setIsWithdrawModalOpen(false)}
          applicationId={application.id}
          projectTitle={application.project?.title || "Project"}
          roleTitle={application.role?.title}
          isAccepted={application.status === "accepted"}
          onSuccess={(cooldownUntil) => {
            if (cooldownUntil) {
              setLocalCooldown(cooldownUntil);
            }
            if (onWithdrawn) {
              onWithdrawn(application.id, cooldownUntil);
            }
          }}
        />
      )}
    </>
  );
}
