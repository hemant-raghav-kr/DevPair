import Link from "next/link";
import { getAdminAuditLogs } from "@/features/admin/queries";
import { AvatarPreview } from "@/features/profiles/components/AvatarPreview";
import { formatDate } from "@/lib/utils";
import type { AuditEventType } from "@/types";

export const metadata = {
  title: "Audit Logs | DevPair Admin",
  description: "Internal security and operational audit logs for DevPair team & application lifecycles.",
};

interface AdminAuditLogsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    eventType?: string;
  }>;
}

const eventTypeStyles: Record<
  AuditEventType,
  { label: string; badgeClass: string; dotClass: string }
> = {
  application_withdrawn: {
    label: "Withdrawn",
    badgeClass:
      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
    dotClass: "bg-zinc-500",
  },
  withdrawal_cooldown_created: {
    label: "Cooldown Created",
    badgeClass:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    dotClass: "bg-amber-500",
  },
  withdrawal_cooldown_revoked: {
    label: "Cooldown Revoked",
    badgeClass:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    dotClass: "bg-emerald-500",
  },
  team_member_removed: {
    label: "Member Removed",
    badgeClass:
      "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900",
    dotClass: "bg-rose-500",
  },
};

export default async function AdminAuditLogsPage({ searchParams }: AdminAuditLogsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10) || 1;
  const search = params.search || "";
  const eventType = (params.eventType || "all") as AuditEventType | "all";

  const result = await getAdminAuditLogs({
    page,
    pageSize: 20,
    search,
    eventType,
  });

  const { data: logs, total, totalPages } = result;

  const eventFilterOptions = [
    { id: "all", label: "All Events" },
    { id: "application_withdrawn", label: "Withdrawn" },
    { id: "withdrawal_cooldown_created", label: "Cooldown Created" },
    { id: "withdrawal_cooldown_revoked", label: "Cooldown Revoked" },
    { id: "team_member_removed", label: "Member Removed" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Audit Logs
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
              {total} total
            </span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Internal chronological audit trail of application withdrawals, cooldowns, revocations, and team removals.
          </p>
        </div>

        {/* Search */}
        <form method="GET" action="/admin/audit-logs" className="flex items-center gap-2 max-w-sm w-full">
          <input type="hidden" name="eventType" value={eventType} />
          <div className="relative flex-1">
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search description..."
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

      {/* Event Type Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-200 dark:border-zinc-800 text-sm">
        {eventFilterOptions.map((opt) => {
          const isActive = eventType === opt.id;
          const href = `/admin/audit-logs?eventType=${opt.id}${search ? `&search=${encodeURIComponent(search)}` : ""}`;

          return (
            <Link
              key={opt.id}
              href={href}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-red-600 text-white font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Target User</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Details / Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                    No audit log records match the current criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const style =
                    eventTypeStyles[log.eventType] || {
                      label: log.eventType,
                      badgeClass: "bg-zinc-100 text-zinc-700 border-zinc-200",
                      dotClass: "bg-zinc-500",
                    };

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      {/* Timestamp with relative format + exact tooltip */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-zinc-500 dark:text-zinc-400">
                        <span
                          title={new Date(log.createdAt).toISOString()}
                          className="font-mono"
                        >
                          {formatDate(log.createdAt)}
                        </span>
                        <div className="text-[10px] text-zinc-400 dark:text-zinc-500">
                          {new Date(log.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Event Type Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${style.badgeClass}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${style.dotClass}`} />
                          <span>{style.label}</span>
                        </span>
                      </td>

                      {/* Actor */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {log.actor ? (
                          <Link
                            href={`/profile/${log.actor.username}`}
                            className="flex items-center gap-2 group"
                          >
                            <AvatarPreview
                              avatarUrl={log.actor.avatar_url}
                              name={log.actor.full_name || log.actor.username}
                              size="sm"
                            />
                            <div>
                              <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                {log.actor.full_name}
                              </div>
                              <div className="text-[11px] font-mono text-zinc-500">
                                @{log.actor.username}
                              </div>
                            </div>
                          </Link>
                        ) : log.actorUserId ? (
                          <span className="text-xs font-mono text-zinc-400 truncate max-w-[120px] inline-block">
                            {log.actorUserId.substring(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400 italic">System</span>
                        )}
                      </td>

                      {/* Target User */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {log.target ? (
                          <Link
                            href={`/profile/${log.target.username}`}
                            className="flex items-center gap-2 group"
                          >
                            <AvatarPreview
                              avatarUrl={log.target.avatar_url}
                              name={log.target.full_name || log.target.username}
                              size="sm"
                            />
                            <div>
                              <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                {log.target.full_name}
                              </div>
                              <div className="text-[11px] font-mono text-zinc-500">
                                @{log.target.username}
                              </div>
                            </div>
                          </Link>
                        ) : log.targetUserId ? (
                          <span className="text-xs font-mono text-zinc-400 truncate max-w-[120px] inline-block">
                            {log.targetUserId.substring(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                      </td>

                      {/* Project */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {log.project ? (
                          <Link
                            href={`/projects/${log.project.id}`}
                            className="font-medium text-xs text-blue-600 dark:text-blue-400 hover:underline max-w-[160px] truncate block"
                            title={log.project.title}
                          >
                            {log.project.title}
                          </Link>
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 text-xs text-zinc-700 dark:text-zinc-300 max-w-sm">
                        <p className="leading-relaxed">{log.description}</p>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <details className="mt-1 text-[11px] text-zinc-500 font-mono">
                            <summary className="cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300">
                              Metadata
                            </summary>
                            <pre className="mt-1 p-2 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
            <div>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total)
            </div>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/audit-logs?page=${page - 1}${eventType ? `&eventType=${eventType}` : ""}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/audit-logs?page=${page + 1}${eventType ? `&eventType=${eventType}` : ""}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
