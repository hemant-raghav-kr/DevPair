"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { submitRevocationRequestAction } from "@/features/moderation/actions";
import type { RestrictionRevokeRequest } from "@/types";

const emptySubscribe = () => () => {};

interface CooldownRevocationSectionProps {
  activeCooldownUntil: string;
  initialRequest?: RestrictionRevokeRequest | null;
}

export function CooldownRevocationSection({
  activeCooldownUntil,
  initialRequest = null,
}: CooldownRevocationSectionProps) {
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

  const isPending = request?.status === "pending";
  const isRejected = request?.status === "rejected";

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
      setError("Please provide a reason of at least 10 characters.");
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
        restrictionType: "cooldown",
        reason: trimmed,
      });

      if (!res.success) {
        setError(res.error || "Failed to submit request.");
        setIsLoading(false);
        return;
      }

      setRequest({
        id: res.requestId || "new",
        userId: "",
        restrictionType: "cooldown",
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

  return (
    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                Application Cooldown Active
              </p>
              {isPending && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30 uppercase tracking-wider">
                  Request Pending
                </span>
              )}
            </div>
            <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5">
              You are currently on a withdrawal cooldown. You can apply to projects again after{" "}
              <strong className="font-semibold text-amber-950 dark:text-amber-100">
                {new Date(activeCooldownUntil).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </strong>.
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="shrink-0 self-end sm:self-center">
          {isPending ? (
            <span className="text-xs text-amber-700 dark:text-amber-300 font-medium italic">
              Revocation under review
            </span>
          ) : (
            <button
              type="button"
              onClick={handleOpenModal}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-600 dark:bg-amber-500 text-white hover:bg-amber-700 dark:hover:bg-amber-600 transition-colors shadow-xs"
            >
              {isRejected ? "Appeal Again" : "Request Revocation"}
            </button>
          )}
        </div>
      </div>

      {/* Sub-status details */}
      {isPending && (
        <div className="p-3 rounded-xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 whitespace-normal break-words">
          <span className="font-semibold">Your appeal reason: </span>
          <span className="italic">&ldquo;{request.reason}&rdquo;</span>
          <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-1">
            An administrator has been notified and will review your request shortly.
          </p>
        </div>
      )}

      {isRejected && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-800 dark:text-rose-300 whitespace-normal break-words">
          <span className="font-semibold">Previous revocation request was rejected. </span>
          {request.reviewReason && (
            <span className="italic">Note: &ldquo;{request.reviewReason}&rdquo;</span>
          )}
        </div>
      )}

      {/* Modal */}
      {isMounted && showModal && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
        >
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Request Cooldown Revocation
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Submit a reason to administrators to lift your 3-day cooldown
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
                  Reason for Early Revocation
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={isLoading}
                  rows={4}
                  placeholder="Explain why you withdrew or need your cooldown revoked early (e.g. accidental withdrawal, urgent project application) (10–1000 characters)..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
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
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
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
                    <span>Submit Request</span>
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
