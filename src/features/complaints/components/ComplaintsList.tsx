"use client";

import { useState } from "react";
import Link from "next/link";
import type { ComplaintSummary } from "../types";
import { ComplaintStatusBadge } from "./ComplaintStatusBadge";
import { ComplaintPriorityBadge } from "./ComplaintPriorityBadge";

interface ComplaintsListProps {
  complaints: ComplaintSummary[];
}

export function ComplaintsList({ complaints }: ComplaintsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (complaints.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-4">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">No Reports Submitted</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
          You have not submitted any complaints or moderation reports. You can report inappropriate behavior or project issues whenever needed.
        </p>
        <div className="mt-6">
          <Link
            href="/complaints/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Report a Problem</span>
          </Link>
        </div>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      {complaints.map((item) => {
        const displayRef = `#CP-${item.id.substring(0, 8).toUpperCase()}`;
        const isExpanded = expandedId === item.id;

        // Resolve target representation
        let targetLabel = "General Platform Issue";
        let targetLink: string | null = null;

        if (item.reportedUserUsername) {
          targetLabel = `@${item.reportedUserUsername}`;
          targetLink = `/profile/${item.reportedUserUsername}`;
        } else if (item.reportedProjectTitle && item.reported_project_id) {
          targetLabel = `Project: ${item.reportedProjectTitle}`;
          targetLink = `/projects/${item.reported_project_id}`;
        } else if (item.reported_application_id) {
          targetLabel = "Application Interaction";
          targetLink = "/applications";
        }

        return (
          <div
            key={item.id}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900">
                  {displayRef}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
                  {item.category.replace(/_/g, " ")}
                </span>
                <ComplaintPriorityBadge priority={item.priority} />
              </div>
              <div>
                <ComplaintStatusBadge status={item.status} />
              </div>
            </div>

            <div className="pt-3.5 space-y-2">
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {item.subject}
              </h4>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-400">Target:</span>
                  {targetLink ? (
                    <Link
                      href={targetLink}
                      className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {targetLabel}
                    </Link>
                  ) : (
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {targetLabel}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-400">Submitted:</span>
                  <span>{new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>

                {item.resolved_at && (
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Resolved:</span>
                    <span>{new Date(item.resolved_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                )}
              </div>

              {/* Description preview or expanded */}
              <div className="pt-1">
                <p className={`text-sm text-zinc-600 dark:text-zinc-400 ${!isExpanded ? "line-clamp-2" : "whitespace-pre-wrap"}`}>
                  {item.description}
                </p>
                {item.description.length > 120 && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-flex items-center gap-1"
                  >
                    <span>{isExpanded ? "Show less" : "Read full description"}</span>
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
