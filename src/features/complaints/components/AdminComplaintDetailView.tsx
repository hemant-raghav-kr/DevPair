"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComplaintDetail, ComplaintStatus, ComplaintPriority } from "../types";
import { ComplaintStatusBadge } from "./ComplaintStatusBadge";
import { ComplaintPriorityBadge } from "./ComplaintPriorityBadge";
import {
  updateComplaintStatusAction,
  updateComplaintPriorityAction,
  updateComplaintNotesAction,
} from "../actions";

interface AdminComplaintDetailViewProps {
  complaint: ComplaintDetail;
  viewerIsSuperAdmin?: boolean;
}

export function AdminComplaintDetailView({
  complaint,
}: AdminComplaintDetailViewProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ComplaintStatus>(complaint.status);
  const [priority, setPriority] = useState<ComplaintPriority>(complaint.priority);
  const [adminNotes, setAdminNotes] = useState(complaint.admin_notes || "");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const displayRef = `#CP-${complaint.id.substring(0, 8).toUpperCase()}`;

  const handleStatusChange = (newStatus: ComplaintStatus) => {
    setStatus(newStatus);
    setErrorMsg(null);
    startTransition(async () => {
      const res = await updateComplaintStatusAction(complaint.id, newStatus, adminNotes);
      if (!res.success) {
        setErrorMsg(res.error || "Failed to update status");
      } else {
        setSaveSuccessMsg(`Status updated to ${newStatus.replace(/_/g, " ")}`);
        setTimeout(() => setSaveSuccessMsg(null), 3000);
        router.refresh();
      }
    });
  };

  const handlePriorityChange = (newPriority: ComplaintPriority) => {
    setPriority(newPriority);
    setErrorMsg(null);
    startTransition(async () => {
      const res = await updateComplaintPriorityAction(complaint.id, newPriority);
      if (!res.success) {
        setErrorMsg(res.error || "Failed to update priority");
      } else {
        setSaveSuccessMsg(`Priority updated to ${newPriority}`);
        setTimeout(() => setSaveSuccessMsg(null), 3000);
        router.refresh();
      }
    });
  };

  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    startTransition(async () => {
      const res = await updateComplaintNotesAction(complaint.id, adminNotes);
      if (!res.success) {
        setErrorMsg(res.error || "Failed to save internal notes");
      } else {
        setSaveSuccessMsg("Internal admin notes saved successfully");
        setTimeout(() => setSaveSuccessMsg(null), 3000);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/complaints"
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 inline-flex items-center gap-1 mb-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Complaints Queue</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Investigation: {displayRef}
            </h1>
            <ComplaintStatusBadge status={status} />
            <ComplaintPriorityBadge priority={priority} />
          </div>
        </div>

        {/* Quick Decision Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {status !== "under_review" && status !== "resolved" && (
            <button
              type="button"
              onClick={() => handleStatusChange("under_review")}
              disabled={isPending}
              className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50"
            >
              Mark Under Review
            </button>
          )}

          {status !== "resolved" && (
            <button
              type="button"
              onClick={() => handleStatusChange("resolved")}
              disabled={isPending}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              Resolve Complaint
            </button>
          )}

          {status !== "dismissed" && (
            <button
              type="button"
              onClick={() => handleStatusChange("dismissed")}
              disabled={isPending}
              className="px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors disabled:opacity-50"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Complaint Details & Moderator Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Complaint Description Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
                  Category: {complaint.category.replace(/_/g, " ")}
                </span>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {complaint.subject}
                </h2>
              </div>
              <span className="text-xs text-zinc-400">
                {new Date(complaint.created_at).toLocaleString()}
              </span>
            </div>

            <div className="prose dark:prose-invert max-w-none text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {complaint.description}
            </div>

            {complaint.resolved_at && (
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 text-xs space-y-1">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300 block">
                  Resolution Audit
                </span>
                <p className="text-zinc-500 dark:text-zinc-400">
                  Resolved on: {new Date(complaint.resolved_at).toLocaleString()}
                  {complaint.resolverEmail && ` by ${complaint.resolverEmail}`}
                </p>
              </div>
            )}
          </div>

          {/* Internal Admin Notes Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Internal Moderator Notes
                </h3>
              </div>
              <span className="text-xs text-zinc-400">Visible only to admins</span>
            </div>

            <form onSubmit={handleSaveNotes} className="space-y-3">
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Log internal investigation findings, moderation rationale, or communication history here..."
                rows={4}
                className="w-full px-4 py-3 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  Save Internal Notes
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Reporter & Target Investigation Panel */}
        <div className="space-y-6">
          {/* Status & Priority Control Panel */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Moderation Controls
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Investigation Status
                </label>
                <select
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value as ComplaintStatus)}
                  disabled={isPending}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => handlePriorityChange(e.target.value as ComplaintPriority)}
                  disabled={isPending}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reporter Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Reporter Details
            </h3>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Full Name:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{complaint.reporterName || "DevPair Student"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Username:</span>
                {complaint.reporterUsername ? (
                  <Link
                    href={`/profile/${complaint.reporterUsername}`}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    @{complaint.reporterUsername}
                  </Link>
                ) : (
                  <span className="text-zinc-500">—</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Email:</span>
                <span className="font-mono text-zinc-600 dark:text-zinc-400 truncate max-w-[170px]">{complaint.reporterEmail || "—"}</span>
              </div>
            </div>

            {complaint.reporterUsername && (
              <div className="pt-2">
                <Link
                  href={`/profile/${complaint.reporterUsername}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span>View Reporter Profile</span>
                </Link>
              </div>
            )}
          </div>

          {/* Target Investigation Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Reported Target
            </h3>

            {complaint.reported_user_id ? (
              <div className="space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Student:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{complaint.reportedUserName || "Student"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Username:</span>
                    {complaint.reportedUserUsername ? (
                      <Link
                        href={`/profile/${complaint.reportedUserUsername}`}
                        className="font-medium text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        @{complaint.reportedUserUsername}
                      </Link>
                    ) : (
                      <span className="text-zinc-500">—</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Email:</span>
                    <span className="font-mono text-zinc-600 dark:text-zinc-400 truncate max-w-[170px]">{complaint.reportedUserEmail || "—"}</span>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  {complaint.reportedUserUsername && (
                    <Link
                      href={`/profile/${complaint.reportedUserUsername}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <span>View Target Profile</span>
                    </Link>
                  )}

                  {/* Integrated Moderation Link */}
                  <div className="pt-1">
                    <Link
                      href={`/admin/users?search=${encodeURIComponent(complaint.reportedUserUsername || "")}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      <span>Moderate Student in Directory</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : complaint.reported_project_id ? (
              <div className="space-y-3 text-xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Type:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">Collaborative Project</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Title:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[170px]">{complaint.reportedProjectTitle || complaint.reported_project_id}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/projects/${complaint.reported_project_id}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span>View Project Details</span>
                  </Link>
                </div>
              </div>
            ) : complaint.reported_application_id ? (
              <div className="space-y-3 text-xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Type:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">Application Interaction</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/admin/applications?search=${complaint.reported_application_id}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span>Inspect Application in Queue</span>
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                General platform complaint without a specific user, project, or application target.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
