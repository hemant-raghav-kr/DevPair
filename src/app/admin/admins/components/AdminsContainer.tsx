"use client";

import { useState } from "react";
import type { AdminListItem } from "@/features/admin";
import { AdminActions } from "./AdminActions";
import { PromoteAdminModal } from "./PromoteAdminModal";

interface AdminsContainerProps {
  admins: AdminListItem[];
  isViewerSuperAdmin: boolean;
}

export function AdminsContainer({ admins, isViewerSuperAdmin }: AdminsContainerProps) {
  const [showPromoteModal, setShowPromoteModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Administrator Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
              {admins.length} administrators
            </span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Authorized platform administrators and Super Admin access management.
          </p>
        </div>

        {isViewerSuperAdmin && (
          <button
            type="button"
            onClick={() => setShowPromoteModal(true)}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-colors"
          >
            + Promote Student to Admin
          </button>
        )}
      </div>

      {/* Admins Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/75 text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="px-5 py-3.5">Administrator</th>
              <th className="px-4 py-3.5">Email</th>
              <th className="px-4 py-3.5">Role</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Designated</th>
              <th className="px-5 py-3.5 text-right">Access Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {admins.map((a) => {
              const formattedDate = new Date(a.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <tr key={a.userId} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                  {/* Admin Info */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                        {a.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.avatar_url} alt={a.full_name} className="w-full h-full object-cover" />
                        ) : (
                          a.full_name.charAt(0).toUpperCase() || "A"
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <span>{a.full_name}</span>
                          {a.isCanonical && (
                            <span className="text-amber-500" title="Canonical Super Admin">
                              ★
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-zinc-400 font-mono">@{a.username}</span>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3.5 text-xs font-mono text-zinc-600 dark:text-zinc-300">
                    {a.email || "—"}
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3.5">
                    {a.role === "super_admin" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                        SUPER ADMIN
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-900">
                        ADMIN
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 text-xs">
                    {a.is_active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                        Deactivated
                      </span>
                    )}
                  </td>

                  {/* Designated Date */}
                  <td className="px-4 py-3.5 text-xs text-zinc-400 whitespace-nowrap">
                    {formattedDate}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <AdminActions
                      userId={a.userId}
                      username={a.username}
                      isActive={a.is_active}
                      isCanonical={a.isCanonical}
                      isViewerSuperAdmin={isViewerSuperAdmin}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Promotion Modal */}
      <PromoteAdminModal
        isOpen={showPromoteModal}
        onClose={() => setShowPromoteModal(false)}
      />
    </div>
  );
}
