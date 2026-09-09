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
import {
  banStudentAction,
  unbanStudentAction,
} from "@/features/admin/actions/moderation";

interface AdminComplaintDetailViewProps {
  complaint: ComplaintDetail;
  viewerIsSuperAdmin?: boolean;
}

export function AdminComplaintDetailView({
  complaint,
  viewerIsSuperAdmin = false,
}: AdminComplaintDetailViewProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ComplaintStatus>(complaint.status);
  const [priority, setPriority] = useState<ComplaintPriority>(complaint.priority);
  const [adminNotes, setAdminNotes] = useState(complaint.admin_notes || "");
  const [isBanned, setIsBanned] = useState(complaint.reportedUserIsBanned || false);
  const [banReason, setBanReason] = useState(complaint.reportedUserBanReason || "");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Modals
  const [showBanModal, setShowBanModal] = useState(false);
  const [banInputReason, setBanInputReason] = useState("");
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showDismissModal, setShowDismissModal] = useState(false);

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

  const handleConfirmBan = async () => {
    if (!complaint.reported_user_id) return;
    if (!banInputReason.trim()) {
      setErrorMsg("Please specify a reason for suspending this student.");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const res = await banStudentAction({
        userId: complaint.reported_user_id!,
        reason: banInputReason.trim(),
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to ban student");
      } else {
        setIsBanned(true);
        setBanReason(banInputReason.trim());
        setShowBanModal(false);
        setBanInputReason("");
        setSaveSuccessMsg(`Student @${complaint.reportedUserUsername || "user"} has been suspended`);
        setTimeout(() => setSaveSuccessMsg(null), 4000);
        router.refresh();
      }
    });
  };

  const handleConfirmUnban = async () => {
    if (!complaint.reported_user_id) return;

    setErrorMsg(null);
    startTransition(async () => {
      const res = await unbanStudentAction({
        userId: complaint.reported_user_id!,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to unban student");
      } else {
        setIsBanned(false);
        setBanReason("");
        setShowUnbanModal(false);
        setSaveSuccessMsg(`Student @${complaint.reportedUserUsername || "user"} has been unbanned`);
        setTimeout(() => setSaveSuccessMsg(null), 4000);
        router.refresh();
      }
    });
  };

  const handleConfirmResolve = () => {
    setShowResolveModal(false);
    handleStatusChange("resolved");
  };

  const handleConfirmDismiss = () => {
    setShowDismissModal(false);
    handleStatusChange("dismissed");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/complaints"
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 inline-flex items-center gap-1.5 mb-2 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Complaints Queue</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
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
              className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50"
            >
              Mark Under Review
            </button>
          )}

          {status !== "resolved" && (
            <button
              type="button"
              onClick={() => setShowResolveModal(true)}
              disabled={isPending}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Resolve Complaint</span>
            </button>
          )}

          {status !== "dismissed" && (
            <button
              type="button"
              onClick={() => setShowDismissModal(true)}
              disabled={isPending}
              className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors disabled:opacity-50"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>

      {/* Super Admin Privileged Authority Banner */}
      {viewerIsSuperAdmin && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-purple-900/30 to-zinc-950 border border-purple-500/30 text-xs flex items-center justify-between gap-3 text-purple-200">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-white font-black text-xs shadow-md">
              ★
            </span>
            <div>
              <span className="font-bold text-white uppercase tracking-wider text-[11px] block">
                Super Admin Investigation Console
              </span>
              <p className="text-purple-300/90 text-[11px]">
                Full platform enforcement active. Actions logged with canonical authority.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] font-semibold border border-purple-500/30 shrink-0">
            SUPER_ADMIN
          </span>
        </div>
      )}

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
        {/* Left Column: Complaint Narrative, Project/Application Context, Internal Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Complaint Description Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 gap-2">
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Category: {complaint.category.replace(/_/g, " ")}
                </span>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {complaint.subject}
                </h2>
              </div>
              <div className="text-xs text-zinc-400 space-y-0.5 sm:text-right">
                <div>Submitted: {new Date(complaint.created_at).toLocaleString()}</div>
                {complaint.updated_at && complaint.updated_at !== complaint.created_at && (
                  <div className="text-[11px] text-zinc-500">
                    Updated: {new Date(complaint.updated_at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Report Description & Evidence
              </h3>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed font-sans">
                {complaint.description}
              </div>
            </div>

            {complaint.resolved_at && (
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs space-y-1">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                  Resolution Audit Trail
                </span>
                <p className="text-emerald-700 dark:text-emerald-400">
                  Investigated and marked as resolved on {new Date(complaint.resolved_at).toLocaleString()}
                  {complaint.resolverEmail && ` by Administrator (${complaint.resolverEmail})`}
                </p>
              </div>
            )}
          </div>

          {/* Reported Project Context (if applicable) */}
          {complaint.reportedProject && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </span>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Reported Collaborative Project
                  </h3>
                </div>
                <Link
                  href={`/projects/${complaint.reportedProject.id}`}
                  className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  View Live Project &rarr;
                </Link>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {complaint.reportedProject.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    {complaint.reportedProject.category && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 capitalize">
                        {complaint.reportedProject.category}
                      </span>
                    )}
                    {complaint.reportedProject.status && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 capitalize">
                        {complaint.reportedProject.status}
                      </span>
                    )}
                  </div>
                </div>

                {complaint.reportedProject.tagline && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                    &ldquo;{complaint.reportedProject.tagline}&rdquo;
                  </p>
                )}

                {complaint.reportedProject.description && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-3 leading-relaxed">
                    {complaint.reportedProject.description}
                  </p>
                )}

                {/* Owner and Roles Info */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-400 block mb-1">Project Creator / Owner:</span>
                    {complaint.reportedProject.owner ? (
                      <Link
                        href={`/profile/${complaint.reportedProject.owner.username}`}
                        className="font-semibold text-zinc-800 dark:text-zinc-200 hover:text-purple-600 flex items-center gap-2"
                      >
                        <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-[10px]">
                          {complaint.reportedProject.owner.name?.charAt(0) || "U"}
                        </div>
                        <span>{complaint.reportedProject.owner.name} (@{complaint.reportedProject.owner.username})</span>
                      </Link>
                    ) : (
                      <span className="text-zinc-500">Unknown</span>
                    )}
                  </div>

                  <div>
                    <span className="text-zinc-400 block mb-1">Project Roles & Slots:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {complaint.reportedProject.roles && complaint.reportedProject.roles.length > 0 ? (
                        complaint.reportedProject.roles.map((r) => (
                          <span
                            key={r.id}
                            className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px]"
                          >
                            {r.title} ({r.slots} slot{r.slots === 1 ? "" : "s"})
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-500">No roles listed</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reported Application Context (if applicable) */}
          {complaint.reportedApplication && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </span>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Reported Join Request / Application
                  </h3>
                </div>
                <Link
                  href={`/admin/applications?search=${encodeURIComponent(complaint.reportedApplication.id)}`}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  View in Applications Queue &rarr;
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-zinc-400 block mb-1">Applicant:</span>
                    {complaint.reportedApplication.applicant ? (
                      <Link
                        href={`/profile/${complaint.reportedApplication.applicant.username}`}
                        className="font-semibold text-zinc-800 dark:text-zinc-200 hover:underline"
                      >
                        {complaint.reportedApplication.applicant.name} (@{complaint.reportedApplication.applicant.username})
                      </Link>
                    ) : (
                      <span className="text-zinc-500">—</span>
                    )}
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-1">Project Target:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {complaint.reportedApplication.project?.title || "Project"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-1">Applied Role:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {complaint.reportedApplication.role?.title || "Role"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-zinc-400 block mb-1">Application Statement:</span>
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 italic whitespace-pre-wrap">
                    &ldquo;{complaint.reportedApplication.message}&rdquo;
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Internal Administrator Notes Card */}
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
              <span className="text-xs text-zinc-400 font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                Strictly Confidential (Admins Only)
              </span>
            </div>

            <form onSubmit={handleSaveNotes} className="space-y-3">
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Log internal investigation findings, moderation rationale, communication records, or escalation details here..."
                rows={4}
                className="w-full px-4 py-3 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex justify-between items-center text-xs text-zinc-400">
                <span>These notes are never visible to reporting or reported students.</span>
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

        {/* Right Column: Moderator Controls, Reported Target Dossier & Sanctions, Reporter Dossier */}
        <div className="space-y-6">
          {/* Moderation Controls Panel */}
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

          {/* Reported Target Dossier & Direct Sanctions */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Reported Target
              </h3>
              {complaint.reported_user_id && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isBanned
                      ? "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900"
                      : "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900"
                  }`}
                >
                  {isBanned ? "Account Suspended" : "Account Active"}
                </span>
              )}
            </div>

            {complaint.reported_user_id ? (
              <div className="space-y-4 text-xs">
                {/* User Identity */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center text-sm shrink-0">
                    {complaint.reportedUserName?.charAt(0) || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                      {complaint.reportedUserName || "Student"}
                    </div>
                    {complaint.reportedUserUsername ? (
                      <Link
                        href={`/profile/${complaint.reportedUserUsername}`}
                        className="text-purple-600 dark:text-purple-400 font-semibold hover:underline block truncate"
                      >
                        @{complaint.reportedUserUsername}
                      </Link>
                    ) : (
                      <span className="text-zinc-500">Anonymous</span>
                    )}
                    {complaint.reportedUserEmail && (
                      <div className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px] truncate mt-0.5">
                        {complaint.reportedUserEmail}
                      </div>
                    )}
                  </div>
                </div>

                {/* College & Bio */}
                {complaint.reportedUserCollege && (
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 text-[11px] text-zinc-600 dark:text-zinc-400">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">College:</span> {complaint.reportedUserCollege}
                  </div>
                )}

                {complaint.reportedUserBio && (
                  <div className="text-zinc-600 dark:text-zinc-400 text-[11px] italic line-clamp-2">
                    &ldquo;{complaint.reportedUserBio}&rdquo;
                  </div>
                )}

                {/* Technical Skills */}
                {complaint.reportedUserSkills && complaint.reportedUserSkills.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-zinc-400 font-semibold text-[11px] block">
                      Technical Skills:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {complaint.reportedUserSkills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-900/60 text-purple-700 dark:text-purple-300 text-[10px] font-medium"
                        >
                          {s.name} (lvl {s.proficiency})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ban Status Warning */}
                {isBanned && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-[11px] space-y-1">
                    <span className="font-bold block">Current Suspension</span>
                    <p>Reason: {banReason || "Terms of service violation"}</p>
                  </div>
                )}

                {/* Moderation Sanctions Buttons */}
                <div className="pt-2 space-y-2">
                  {complaint.reportedUserUsername && (
                    <Link
                      href={`/profile/${complaint.reportedUserUsername}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <span>View Public Profile</span>
                    </Link>
                  )}

                  {/* Direct Ban / Unban Button */}
                  {isBanned ? (
                    <button
                      type="button"
                      onClick={() => setShowUnbanModal(true)}
                      disabled={isPending}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Unban Student</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowBanModal(true)}
                      disabled={isPending}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      <span>Ban / Suspend Student</span>
                    </button>
                  )}

                  <Link
                    href={`/admin/users?search=${encodeURIComponent(complaint.reportedUserUsername || "")}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-[11px] transition-colors"
                  >
                    <span>Inspect In Student Directory &rarr;</span>
                  </Link>
                </div>
              </div>
            ) : complaint.reported_project_id ? (
              <div className="space-y-2 text-xs">
                <p className="text-zinc-600 dark:text-zinc-300">
                  Target is collaborative project: <strong>{complaint.reportedProjectTitle || complaint.reported_project_id}</strong>
                </p>
                <Link
                  href={`/projects/${complaint.reported_project_id}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span>View Project Details</span>
                </Link>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                General platform complaint without a specific individual or project target.
              </p>
            )}
          </div>

          {/* Reporter Dossier Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Reporter Dossier
            </h3>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                {complaint.reporterName?.charAt(0) || "R"}
              </div>
              <div className="min-w-0 flex-1 text-xs">
                <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {complaint.reporterName || "DevPair Student"}
                </div>
                {complaint.reporterUsername ? (
                  <Link
                    href={`/profile/${complaint.reporterUsername}`}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline block truncate"
                  >
                    @{complaint.reporterUsername}
                  </Link>
                ) : (
                  <span className="text-zinc-500">DevPair User</span>
                )}
                {complaint.reporterEmail && (
                  <div className="font-mono text-zinc-500 dark:text-zinc-400 text-[11px] truncate mt-0.5">
                    {complaint.reporterEmail}
                  </div>
                )}
              </div>
            </div>

            {complaint.reporterCollege && (
              <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-[11px] text-zinc-600 dark:text-zinc-400">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">College:</span> {complaint.reporterCollege}
              </div>
            )}

            {complaint.reporterUsername && (
              <div className="pt-1">
                <Link
                  href={`/profile/${complaint.reporterUsername}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span>View Reporter Profile</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}

      {/* Ban Student Modal */}
      {showBanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </span>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Suspend Student Account
                </h3>
                <p className="text-xs text-zinc-500">
                  Target: @{complaint.reportedUserUsername || "student"}
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Suspending this student will immediately revoke their ability to create projects,
              apply to open roles, or submit reports.
            </p>

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Required Sanction / Ban Reason:
              </label>
              <textarea
                value={banInputReason}
                onChange={(e) => setBanInputReason(e.target.value)}
                placeholder="Detail the violation (e.g. Harassment, Spam, Academic Plagiarism, Abusive conduct)..."
                rows={3}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBanModal(false)}
                disabled={isPending}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBan}
                disabled={isPending || !banInputReason.trim()}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
              >
                {isPending ? "Suspending..." : "Confirm Suspension"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unban Student Modal */}
      {showUnbanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Restore Student Account
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Are you sure you want to unban @{complaint.reportedUserUsername || "student"}? Their normal
              student platform privileges will be restored immediately.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUnbanModal(false)}
                disabled={isPending}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUnban}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
              >
                {isPending ? "Restoring..." : "Restore Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Complaint Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Mark Complaint Resolved
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              This will mark complaint <strong>{displayRef}</strong> as resolved.
              The reporting student will receive a notification stating the investigation was completed.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                disabled={isPending}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResolve}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
              >
                {isPending ? "Resolving..." : "Confirm Resolution"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dismiss Complaint Modal */}
      {showDismissModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Dismiss Complaint
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Dismiss this complaint without punitive sanctions? The reporter will be notified that
              their complaint was reviewed and dismissed.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDismissModal(false)}
                disabled={isPending}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDismiss}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
              >
                {isPending ? "Dismissing..." : "Confirm Dismissal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
