"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  banStudentAction,
  unbanStudentAction,
  promoteStudentToAdminAction,
  demoteAdminAction,
  revokeCooldownAction,
} from "@/features/admin";

const emptySubscribe = () => () => {};

interface UserModerationActionsProps {
  userId: string;
  username: string;
  fullName: string;
  isBanned: boolean;
  banReason: string | null;
  isAdmin: boolean;
  isViewerSuperAdmin: boolean;
  isCanonical: boolean;
  hasActiveCooldown?: boolean;
  cooldownUntil?: string | null;
}

export function UserModerationActions({
  userId,
  username,
  fullName,
  isBanned,
  isAdmin,
  isViewerSuperAdmin,
  isCanonical,
  hasActiveCooldown = false,
  cooldownUntil,
}: UserModerationActionsProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [showBanModal, setShowBanModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [reason, setReason] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please specify a reason for banning this student.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await banStudentAction({ userId, reason: reason.trim() });
      if (!res.success) {
        setError(res.error || "Failed to ban student.");
      } else {
        setShowBanModal(false);
        setReason("");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error executing ban");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnban = async () => {
    if (!confirm(`Are you sure you want to unban @${username}?`)) return;

    try {
      setIsLoading(true);
      const res = await unbanStudentAction({ userId });
      if (!res.success) {
        alert(res.error || "Failed to unban student.");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error executing unban");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromote = async () => {
    if (!confirm(`Promote ${fullName} (@${username}) to DevPair Administrator?`)) return;

    try {
      setIsLoading(true);
      const res = await promoteStudentToAdminAction({ userId });
      if (!res.success) {
        alert(res.error || "Failed to promote student to admin.");
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error executing promotion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemote = async () => {
    if (!confirm(`Are you sure you want to demote this admin to a student?`)) return;

    try {
      setIsLoading(true);
      const res = await demoteAdminAction({ userId });
      if (!res.success) {
        alert(res.error || "Failed to demote admin.");
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error executing demotion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeCooldown = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      const res = await revokeCooldownAction({
        userId,
        reason: revokeReason.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error || "Failed to revoke cooldown.");
      } else {
        setShowRevokeModal(false);
        setRevokeReason("");
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error revoking cooldown");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        {/* Revoke Cooldown Action Button */}
        {hasActiveCooldown && (
          <button
            type="button"
            onClick={() => setShowRevokeModal(true)}
            disabled={isLoading}
            title={`Revoke active cooldown (until ${cooldownUntil ? new Date(cooldownUntil).toLocaleString() : ""})`}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors disabled:opacity-50"
          >
            Revoke Cooldown
          </button>
        )}

        {isCanonical ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20">
            Canonical Super Admin
          </span>
        ) : (
          <>
            {isBanned ? (
              <button
                type="button"
                onClick={handleUnban}
                disabled={isLoading}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors disabled:opacity-50"
              >
                Unban
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowBanModal(true)}
                disabled={isLoading || isAdmin}
                title={isAdmin ? "Admins cannot be banned directly. Demote first." : "Ban student"}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors disabled:opacity-40"
              >
                Ban
              </button>
            )}

            {isViewerSuperAdmin && !isAdmin && !isBanned && (
              <button
                type="button"
                onClick={handlePromote}
                disabled={isLoading}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                + Admin
              </button>
            )}

            {isViewerSuperAdmin && isAdmin && (
              <button
                type="button"
                onClick={handleDemote}
                disabled={isLoading}
                title="Demote subordinate admin to student"
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors disabled:opacity-50"
              >
                Demote
              </button>
            )}
          </>
        )}
      </div>

      {/* Revoke Cooldown Modal mounted at document body via Portal for perfect centering */}
      {showRevokeModal &&
        isMounted &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-7 shadow-2xl space-y-5 text-left whitespace-normal break-words">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/50">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                      Revoke Withdrawal Cooldown
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {fullName} • @{username}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRevokeModal(false)}
                  disabled={isLoading}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 disabled:opacity-50"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              {/* Notice */}
              <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-4 space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
                <p className="font-semibold text-sm">
                  Lift Cooldown Immediately
                </p>
                <p className="leading-relaxed">
                  Revoking this cooldown will immediately restore the student&apos;s ability to submit new project join requests.
                </p>
                {cooldownUntil && (
                  <p className="text-[11px] text-amber-800 dark:text-amber-300/90 font-mono">
                    Originally scheduled until: {new Date(cooldownUntil).toLocaleString()}
                  </p>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 text-xs border border-red-200 dark:border-red-900/50">
                  {error}
                </div>
              )}

              <form onSubmit={handleRevokeCooldown} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1.5">
                    Revocation Reason <span className="text-zinc-400 font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                    placeholder="e.g. Student withdrew by mistake, granted exception..."
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRevokeModal(false)}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span>Revoking...</span>
                      </>
                    ) : (
                      <span>Revoke Cooldown</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Ban Modal mounted at document body via Portal for perfect centering */}
      {showBanModal &&
        isMounted &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-7 shadow-2xl space-y-5 text-left whitespace-normal break-words">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-900/50">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                      Ban Student Account
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {fullName} • @{username}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBanModal(false)}
                  disabled={isLoading}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 disabled:opacity-50"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30 p-4 space-y-1.5 text-xs text-red-900 dark:text-red-200">
                <p className="font-semibold text-sm">
                  Account Suspension Warning
                </p>
                <p className="leading-relaxed">
                  Suspending this account will block the student from accessing dashboard tools, creating projects, and applying to teams.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 text-xs border border-red-200 dark:border-red-900/50">
                  {error}
                </div>
              )}

              <form onSubmit={handleBan} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1.5">
                    Reason for Ban <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Inappropriate conduct, spamming project applications, violating team guidelines..."
                    required
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBanModal(false)}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span>Suspending...</span>
                      </>
                    ) : (
                      <span>Confirm Suspension</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
