"use client";

import { useState } from "react";
import { toggleAdminActiveAction, removeAdminAction } from "@/features/admin";

interface AdminActionsProps {
  userId: string;
  username: string;
  isActive: boolean;
  isCanonical: boolean;
  isViewerSuperAdmin: boolean;
}

export function AdminActions({
  userId,
  username,
  isActive,
  isCanonical,
  isViewerSuperAdmin,
}: AdminActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    const actionName = isActive ? "deactivate" : "activate";
    if (!confirm(`Are you sure you want to ${actionName} administrator @${username}?`)) {
      return;
    }

    try {
      setIsLoading(true);
      const res = await toggleAdminActiveAction({ userId, isActive: !isActive });
      if (!res.success) {
        alert(res.error || `Failed to ${actionName} admin.`);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : `Failed to ${actionName} admin.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Are you sure you want to completely REVOKE admin privileges from @${username}?`)) {
      return;
    }

    try {
      setIsLoading(true);
      const res = await removeAdminAction({ userId });
      if (!res.success) {
        alert(res.error || "Failed to remove admin.");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to remove admin.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCanonical) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800">
        Canonical Super Admin
      </span>
    );
  }

  if (!isViewerSuperAdmin) {
    return <span className="text-xs text-zinc-400">—</span>;
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isLoading}
        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-50 ${
          isActive
            ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200"
            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
        }`}
      >
        {isActive ? "Deactivate" : "Activate"}
      </button>

      <button
        type="button"
        onClick={handleRemove}
        disabled={isLoading}
        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors disabled:opacity-50"
      >
        Revoke
      </button>
    </div>
  );
}
