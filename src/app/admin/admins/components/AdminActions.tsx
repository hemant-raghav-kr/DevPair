"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleAdminActiveAction, demoteAdminAction } from "@/features/admin";

interface AdminActionsProps {
  userId: string;
  username: string;
  isActive: boolean;
  isCanonical: boolean;
  isViewerSuperAdmin: boolean;
  onFeedback?: (type: "success" | "error", message: string) => void;
}

export function AdminActions({
  userId,
  username,
  isActive,
  isCanonical,
  isViewerSuperAdmin,
  onFeedback,
}: AdminActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    const actionName = isActive ? "deactivate" : "activate";
    if (!confirm(`Are you sure you want to ${actionName} administrator @${username}?`)) {
      return;
    }

    try {
      setIsLoading(true);
      const res = await toggleAdminActiveAction({ userId, isActive: !isActive });
      if (!res.success) {
        const errorMsg = res.error || `Failed to ${actionName} admin.`;
        if (onFeedback) {
          onFeedback("error", errorMsg);
        } else {
          alert(errorMsg);
        }
      } else {
        if (onFeedback) {
          onFeedback("success", `Administrator @${username} has been ${isActive ? "deactivated" : "activated"}.`);
        }
        router.refresh();
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : `Failed to ${actionName} admin.`;
      if (onFeedback) {
        onFeedback("error", errorMsg);
      } else {
        alert(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemote = async () => {
    if (!confirm(`Are you sure you want to demote this admin to a student?`)) {
      return;
    }

    try {
      setIsLoading(true);
      const res = await demoteAdminAction({ userId });
      if (!res.success) {
        const errorMsg = res.error || "Failed to demote admin.";
        if (onFeedback) {
          onFeedback("error", errorMsg);
        } else {
          alert(errorMsg);
        }
      } else {
        if (onFeedback) {
          onFeedback(
            "success",
            `Successfully demoted @${username} to Student. User account and profile remain intact.`
          );
        }
        router.refresh();
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to demote admin.";
      if (onFeedback) {
        onFeedback("error", errorMsg);
      } else {
        alert(errorMsg);
      }
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
        onClick={handleDemote}
        disabled={isLoading}
        title={`Demote @${username} to Student`}
        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors disabled:opacity-50"
      >
        Demote to Student
      </button>
    </div>
  );
}

