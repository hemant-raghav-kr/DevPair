"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  banStudentAction,
  unbanStudentAction,
  promoteStudentToAdminAction,
  demoteAdminAction,
  revokeCooldownAction,
} from "@/features/admin";

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
    <div className="flex items-center justify-end gap-1.5">
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
        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
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

      {/* Revoke Cooldown Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4 text-left">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Revoke Withdrawal Cooldown
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Revoke the active 3-day withdrawal cooldown for <strong className="text-zinc-800 dark:text-zinc-200">{fullName}</strong> (@{username}).
                The student will immediately be able to submit new project join requests.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-900">
                {error}
              </div>
            )}

            <form onSubmit={handleRevokeCooldown} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1">
                  Revocation Reason <span className="text-zinc-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="e.g. Student withdrew by mistake, granted exception..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRevokeModal(false)}
                  disabled={isLoading}
                  className="px-4 py-2 text-xs font-medium rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Revoking..." : "Revoke Cooldown"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4 text-left">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Ban Student Account
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Suspending <strong className="text-zinc-800 dark:text-zinc-200">{fullName}</strong> (@{username}).
                This will prevent them from accessing dashboard tools, creating projects, or submitting join requests.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-900">
                {error}
              </div>
            )}

            <form onSubmit={handleBan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1">
                  Reason for Ban <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Inappropriate conduct, spamming project applications, violating team guidelines..."
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBanModal(false)}
                  disabled={isLoading}
                  className="px-4 py-2 text-xs font-medium rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Suspending..." : "Confirm Suspension"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
