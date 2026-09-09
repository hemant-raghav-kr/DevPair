"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { PaginatedComplaintsResult } from "../types";
import { ComplaintStatusBadge } from "./ComplaintStatusBadge";
import { ComplaintPriorityBadge } from "./ComplaintPriorityBadge";

interface AdminComplaintsTableProps {
  initialResult: PaginatedComplaintsResult;
}

export function AdminComplaintsTable({ initialResult }: AdminComplaintsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [priority, setPriority] = useState(searchParams.get("priority") || "all");
  const [category, setCategory] = useState(searchParams.get("category") || "all");

  const applyFilters = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([k, v]) => {
      if (v && v !== "all") {
        params.set(k, v);
      } else {
        params.delete(k);
      }
    });
    params.set("page", "1");
    router.push(`/admin/complaints?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ search, status, priority, category });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/admin/complaints?${params.toString()}`);
  };

  const { complaints, total, page, totalPages } = initialResult;

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by subject or description keyword..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 font-medium">Status:</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                applyFilters({ search, status: e.target.value, priority, category });
              }}
              className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 font-medium">Priority:</span>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                applyFilters({ search, status, priority: e.target.value, category });
              }}
              className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 font-medium">Category:</span>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                applyFilters({ search, status, priority, category: e.target.value });
              }}
              className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="harassment">Harassment</option>
              <option value="inappropriate_content">Inappropriate Content</option>
              <option value="spam">Spam</option>
              <option value="fake_profile">Fake Profile</option>
              <option value="abusive_behavior">Abusive Behavior</option>
              <option value="project_misconduct">Project Misconduct</option>
              <option value="application_misconduct">Application Misconduct</option>
              <option value="plagiarism">Plagiarism</option>
              <option value="impersonation">Impersonation</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        {complaints.length === 0 ? (
          <div className="text-center py-14 px-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No complaints matching filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Ref / Priority</th>
                  <th className="px-5 py-3.5">Category / Subject</th>
                  <th className="px-5 py-3.5">Reporter</th>
                  <th className="px-5 py-3.5">Target</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {complaints.map((c) => {
                  const isUrgent = c.priority === "critical" || c.priority === "high";
                  const refCode = `#CP-${c.id.substring(0, 8).toUpperCase()}`;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => router.push(`/admin/complaints/${c.id}`)}
                      className={`cursor-pointer hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 transition-colors ${
                        isUrgent && c.status === "pending"
                          ? "bg-red-50/50 dark:bg-red-950/20 border-l-4 border-l-red-500"
                          : c.status === "pending"
                          ? "bg-amber-50/30 dark:bg-amber-950/10 border-l-4 border-l-amber-500"
                          : "border-l-4 border-l-transparent"
                      }`}
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {refCode}
                          </span>
                          <div>
                            <ComplaintPriorityBadge priority={c.priority} />
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 max-w-xs">
                        <span className="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400 block mb-0.5">
                          {c.category.replace(/_/g, " ")}
                        </span>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1">
                          {c.subject}
                        </p>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {c.reporterUsername ? (
                          <Link
                            href={`/profile/${c.reporterUsername}`}
                            className="font-medium text-blue-600 dark:text-blue-400 hover:underline block"
                          >
                            @{c.reporterUsername}
                          </Link>
                        ) : (
                          <span className="text-zinc-500">Student</span>
                        )}
                        <span className="text-xs text-zinc-400 block truncate max-w-[140px]">
                          {c.reporterName || "DevPair User"}
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {c.reportedUserUsername ? (
                          <Link
                            href={`/profile/${c.reportedUserUsername}`}
                            className="font-medium text-purple-600 dark:text-purple-400 hover:underline block"
                          >
                            User: @{c.reportedUserUsername}
                          </Link>
                        ) : c.reportedProjectTitle && c.reported_project_id ? (
                          <Link
                            href={`/projects/${c.reported_project_id}`}
                            className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline block truncate max-w-[150px]"
                          >
                            Project: {c.reportedProjectTitle}
                          </Link>
                        ) : c.reported_application_id ? (
                          <span className="text-zinc-600 dark:text-zinc-400 font-medium">Application</span>
                        ) : (
                          <span className="text-zinc-400 italic">General</span>
                        )}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <ComplaintStatusBadge status={c.status} />
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-xs text-zinc-500 dark:text-zinc-400">
                        <div>
                          <span>Created: {new Date(c.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                        </div>
                        {c.updated_at && c.updated_at !== c.created_at && (
                          <div className="text-[10px] text-zinc-400">
                            Updated: {new Date(c.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/admin/complaints/${c.id}`}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors shadow-sm"
                        >
                          Investigate &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 text-xs">
            <span className="text-zinc-500">
              Showing page <span className="font-semibold text-zinc-800 dark:text-zinc-200">{page}</span> of{" "}
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{totalPages}</span> ({total} complaints)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 font-medium text-zinc-700 dark:text-zinc-300 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 font-medium text-zinc-700 dark:text-zinc-300 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
