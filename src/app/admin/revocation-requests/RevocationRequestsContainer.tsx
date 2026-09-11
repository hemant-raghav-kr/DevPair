"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AvatarPreview } from "@/features/profiles/components/AvatarPreview";
import { formatDate } from "@/lib/utils";
import { reviewRevocationRequestAction } from "@/features/moderation/actions";
import type { AdminRevocationRequestItem } from "@/features/admin/types";

const emptySubscribe = () => () => {};

interface RevocationRequestsContainerProps {
  initialData: AdminRevocationRequestItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    bans: number;
    cooldowns: number;
  };
  currentStatus: string;
  currentType: string;
  currentSearch: string;
}

export function RevocationRequestsContainer({
  initialData,
  total,
  page,
  totalPages,
  stats,
  currentStatus,
  currentType,
  currentSearch,
}: RevocationRequestsContainerProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const router = useRouter();
  const [requests, setRequests] = useState<AdminRevocationRequestItem[]>(initialData);
  const [selectedRequest, setSelectedRequest] = useState<AdminRevocationRequestItem | null>(null);
  const [modalAction, setModalAction] = useState<"approve" | "reject" | null>(null);
  const [reviewReason, setReviewReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openReviewModal = (req: AdminRevocationRequestItem, action: "approve" | "reject") => {
    setSelectedRequest(req);
    setModalAction(action);
    setReviewReason("");
    setError(null);
  };

  const closeReviewModal = () => {
    if (isLoading) return;
    setSelectedRequest(null);
    setModalAction(null);
    setReviewReason("");
    setError(null);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !modalAction) return;

    if (modalAction === "reject" && !reviewReason.trim()) {
      setError("Please provide a reason for rejecting this revocation request.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await reviewRevocationRequestAction({
        requestId: selectedRequest.id,
        action: modalAction,
        reviewReason: reviewReason.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error || "Failed to process review.");
        setIsLoading(false);
        return;
      }

      // Update local state
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id
            ? {
                ...r,
                status: modalAction === "approve" ? "approved" : "rejected",
                reviewedAt: new Date().toISOString(),
                reviewReason: reviewReason.trim() || null,
              }
            : r
        )
      );

      closeReviewModal();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const statusTabs = [
    { id: "all", label: "All Requests", count: stats.total },
    { id: "pending", label: "Pending", count: stats.pending },
    { id: "approved", label: "Approved", count: stats.approved },
    { id: "rejected", label: "Rejected", count: stats.rejected },
  ];

  const typeTabs = [
    { id: "all", label: "All Types" },
    { id: "ban", label: `Bans (${stats.bans})` },
    { id: "cooldown", label: `Cooldowns (${stats.cooldowns})` },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Revocation Requests
            </h1>
            {stats.pending > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 animate-pulse">
                {stats.pending} pending review
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Review student appeals for active account suspensions and withdrawal cooldowns.
          </p>
        </div>

        {/* Search */}
        <form method="GET" action="/admin/revocation-requests" className="flex items-center gap-2 max-w-sm w-full">
          <input type="hidden" name="status" value={currentStatus} />
          <input type="hidden" name="restrictionType" value={currentType} />
          <div className="relative flex-1">
            <input
              type="text"
              name="search"
              defaultValue={currentSearch}
              placeholder="Search request reason..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
            <svg
              className="w-4 h-4 text-zinc-400 absolute left-3 top-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl text-sm font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Status Filter Tabs & Type Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        {/* Status tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-sm">
          {statusTabs.map((tab) => {
            const isActive = currentStatus === tab.id;
            const href = `/admin/revocation-requests?status=${tab.id}&restrictionType=${currentType}${currentSearch ? `&search=${encodeURIComponent(currentSearch)}` : ""}`;

            return (
              <Link
                key={tab.id}
                href={href}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? "bg-red-600 text-white font-semibold shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-xs px-1.5 py-0.2 rounded-md ${
                    isActive
                      ? "bg-red-700/60 text-white"
                      : "bg-zinc-200/60 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Type pills */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-zinc-400 dark:text-zinc-500 font-medium mr-1">Type:</span>
          {typeTabs.map((tab) => {
            const isActive = currentType === tab.id;
            const href = `/admin/revocation-requests?status=${currentStatus}&restrictionType=${tab.id}${currentSearch ? `&search=${encodeURIComponent(currentSearch)}` : ""}`;

            return (
              <Link
                key={tab.id}
                href={href}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            No revocation requests found
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            {currentStatus !== "all" || currentType !== "all" || currentSearch
              ? "No requests match the selected filters."
              : "There are currently no active or historical revocation requests."}
          </p>
          {(currentStatus !== "all" || currentType !== "all" || currentSearch) && (
            <Link
              href="/admin/revocation-requests"
              className="mt-4 inline-flex items-center text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
            >
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 p-5 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Left: Student & Request Meta */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <AvatarPreview
                    avatarUrl={req.user.avatar_url}
                    name={req.user.full_name}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/profiles/${req.user.username}`}
                        className="font-bold text-zinc-900 dark:text-zinc-100 hover:text-red-600 dark:hover:text-red-400 transition-colors truncate"
                      >
                        {req.user.full_name}
                      </Link>
                      <span className="text-xs text-zinc-400">@{req.user.username}</span>

                      {/* Restriction Type Badge */}
                      {req.restrictionType === "ban" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Ban Appeal
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Cooldown Appeal
                        </span>
                      )}

                      {/* Status Badge */}
                      {req.status === "pending" && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
                          Pending Review
                        </span>
                      )}
                      {req.status === "approved" && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                          Approved
                        </span>
                      )}
                      {req.status === "rejected" && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                          Rejected
                        </span>
                      )}
                    </div>

                    {/* Submitted Reason Card */}
                    <div className="mt-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-sm text-zinc-800 dark:text-zinc-200 whitespace-normal break-words">
                      <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">
                        Student Appeal Statement
                      </div>
                      <p className="italic text-zinc-700 dark:text-zinc-300">
                        &ldquo;{req.reason}&rdquo;
                      </p>
                    </div>

                    {/* Reviewer Details (if reviewed) */}
                    {req.status !== "pending" && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                        <span>
                          Reviewed by{" "}
                          <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">
                            {req.reviewer?.full_name || "Admin"}
                          </strong>
                          {req.reviewedAt && ` on ${formatDate(req.reviewedAt)}`}
                        </span>
                        {req.reviewReason && (
                          <span className="text-zinc-600 dark:text-zinc-300">
                            Reason: <span className="italic font-medium">{req.reviewReason}</span>
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-2 text-[11px] text-zinc-400">
                      Submitted: {formatDate(req.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Right: Review Action Buttons (only for pending) */}
                {req.status === "pending" && (
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0 pt-2 lg:pt-0">
                    <button
                      type="button"
                      onClick={() => openReviewModal(req, "approve")}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-xs"
                    >
                      Approve Revocation
                    </button>
                    <button
                      type="button"
                      onClick={() => openReviewModal(req, "reject")}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-rose-300 dark:border-rose-800/80 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      Reject Request
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-4 text-sm">
          <span className="text-zinc-500 dark:text-zinc-400 text-xs">
            Showing Page {page} of {totalPages} ({total} total requests)
          </span>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={`/admin/revocation-requests?page=${page - 1}&status=${currentStatus}&restrictionType=${currentType}${currentSearch ? `&search=${encodeURIComponent(currentSearch)}` : ""}`}
                className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/revocation-requests?page=${page + 1}&status=${currentStatus}&restrictionType=${currentType}${currentSearch ? `&search=${encodeURIComponent(currentSearch)}` : ""}`}
                className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {isMounted && selectedRequest && modalAction && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 p-6 sm:p-7 shadow-2xl border border-zinc-200 dark:border-zinc-800 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    modalAction === "approve"
                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {modalAction === "approve" ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {modalAction === "approve"
                      ? `Approve ${selectedRequest.restrictionType === "ban" ? "Ban" : "Cooldown"} Revocation`
                      : `Reject ${selectedRequest.restrictionType === "ban" ? "Ban" : "Cooldown"} Appeal`}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Student: {selectedRequest.user.full_name} (@{selectedRequest.user.username})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeReviewModal}
                disabled={isLoading}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Appeal Quote */}
            <div className="mt-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 whitespace-normal break-words">
              <span className="font-semibold text-zinc-500 dark:text-zinc-400">Student Statement: </span>
              &ldquo;{selectedRequest.reason}&rdquo;
            </div>

            <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {modalAction === "approve"
                    ? "Admin Notes / Message to Student (Optional)"
                    : "Rejection Reason (Required, visible to student)"}
                </label>
                <textarea
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  disabled={isLoading}
                  rows={3}
                  placeholder={
                    modalAction === "approve"
                      ? "e.g. Account verified and access restored upon review."
                      : "e.g. Appeal denied due to repeated policy violations."
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors flex items-center gap-1.5 ${
                    modalAction === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : "bg-rose-600 hover:bg-rose-500"
                  } disabled:opacity-50`}
                >
                  {isLoading ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>{modalAction === "approve" ? "Confirm Approval" : "Confirm Rejection"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
