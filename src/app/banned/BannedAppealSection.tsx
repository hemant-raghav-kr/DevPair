"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { submitRevocationRequestAction } from "@/features/moderation/actions";
import type { RestrictionRevokeRequest } from "@/types";

const emptySubscribe = () => () => {};

interface BannedAppealSectionProps {
  initialRequest: RestrictionRevokeRequest | null;
}

export function BannedAppealSection({ initialRequest }: BannedAppealSectionProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const router = useRouter();
  const [request, setRequest] = useState<RestrictionRevokeRequest | null>(initialRequest);
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenModal = () => {
    setReason("");
    setError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (isLoading) return;
    setShowModal(false);
    setReason("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 10) {
      setError("Please provide a detailed explanation of at least 10 characters.");
      return;
    }
    if (trimmed.length > 1000) {
      setError("Reason cannot exceed 1000 characters.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await submitRevocationRequestAction({
        restrictionType: "ban",
        reason: trimmed,
      });

      if (!res.success) {
        setError(res.error || "Failed to submit appeal.");
        setIsLoading(false);
        return;
      }

      setRequest({
        id: res.requestId || "new",
        userId: "",
        restrictionType: "ban",
        status: "pending",
        reason: trimmed,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setShowModal(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const isPending = request?.status === "pending";
  const isRejected = request?.status === "rejected";

  return (
    <div className="space-y-4 pt-2">
      {/* Pending Appeal Banner */}
      {isPending && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left space-y-2">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider">Appeal Under Review</span>
          </div>
          <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
            Your ban revocation request is currently under review by a platform administrator.
          </p>
          <div className="p-3 rounded-xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 text-xs italic text-amber-900 dark:text-amber-200 whitespace-normal break-words">
            &ldquo;{request.reason}&rdquo;
          </div>
          <div className="text-[11px] text-amber-700/70 dark:text-amber-400/70">
            Submitted {formatDate(request.createdAt)}
          </div>
        </div>
      )}

      {/* Previously Rejected Banner */}
      {isRejected && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-left space-y-2">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider">Previous Appeal Rejected</span>
          </div>
          <p className="text-xs text-rose-900/90 dark:text-rose-200/90 leading-relaxed">
            Your previous appeal was reviewed and rejected.
            {request.reviewReason && (
              <span className="block mt-1 font-medium">
                Admin feedback: &ldquo;{request.reviewReason}&rdquo;
              </span>
            )}
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={handleOpenModal}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors"
            >
              Submit New Appeal
            </button>
          </div>
        </div>
      )}

      {/* No active appeal */}
      {!isPending && !isRejected && (
        <div className="pt-2">
          <button
            type="button"
            onClick={handleOpenModal}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors"
          >
            Request Ban Revocation
          </button>
        </div>
      )}

      {/* Appeal Submission Modal */}
      {isMounted && showModal && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
        >
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Appeal Account Suspension
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Submit a formal explanation to administrators
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isLoading}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Reason for Revocation Request
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={isLoading}
                  rows={4}
                  placeholder="Explain why your account should be reinstated, clarifying any misunderstanding or steps taken to resolve the issue (10–1000 characters)..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
                />
                <div className="flex justify-between text-[11px] text-zinc-400 mt-1">
                  <span>Minimum 10 characters</span>
                  <span>{reason.trim().length} / 1000</span>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || reason.trim().length < 10}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-500 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Appeal</span>
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
