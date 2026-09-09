"use client";

import { useState } from "react";
import { promoteStudentToAdminAction } from "@/features/admin";

interface PromoteAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PromoteAdminModal({ isOpen, onClose }: PromoteAdminModalProps) {
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) {
      setError("Please provide a valid Student User UUID.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await promoteStudentToAdminAction({ userId: userId.trim() });
      if (!res.success) {
        setError(res.error || "Failed to promote user.");
      } else {
        setUserId("");
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error promoting admin");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4 text-left">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Promote Student to Admin
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Designate an existing student account as a platform administrator with access to the Admin Dashboard.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1">
              Student User ID (UUID) <span className="text-blue-500">*</span>
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. 02635888-ded4-4108-9fed-16fd43c7a3e5"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono"
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Tip: You can also promote students directly by clicking &quot;+ Admin&quot; in the Students tab.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-medium rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors disabled:opacity-50"
            >
              {isLoading ? "Promoting..." : "Promote to Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
