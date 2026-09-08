"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import { formatDate } from "@/lib/utils";
import type { ApplicationWithDetails } from "../types";

interface ApplicationCardProps {
  application: ApplicationWithDetails;
  onWithdrawn?: (applicationId: string) => void;
}

export function ApplicationCard({
  application,
  onWithdrawn,
}: ApplicationCardProps) {
  const supabase = createClient();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWithdraw = async () => {
    if (!window.confirm("Are you sure you want to withdraw this application?")) {
      return;
    }

    setIsWithdrawing(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("applications")
        .update({ status: "withdrawn" })
        .eq("id", application.id)
        .eq("applicant_id", application.applicant_id);

      if (updateError) {
        throw new Error(updateError.message || "Failed to withdraw application.");
      }

      if (onWithdrawn) {
        onWithdrawn(application.id);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
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

      {error && (
        <div className="p-2.5 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 text-xs border border-red-200 dark:border-red-900/50">
          {error}
        </div>
      )}

      {/* Footer: Date & Withdraw Action */}
      <div className="pt-2 flex items-center justify-between text-xs text-zinc-400">
        <span>Submitted {formatDate(application.created_at)}</span>

        {application.status === "pending" && (
          <button
            type="button"
            disabled={isWithdrawing}
            onClick={handleWithdraw}
            className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50"
          >
            {isWithdrawing ? "Withdrawing..." : "Withdraw Application"}
          </button>
        )}
      </div>
    </div>
  );
}
