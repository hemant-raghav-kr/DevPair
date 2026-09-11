import Link from "next/link";
import { getAdminUsersList } from "@/features/admin/queries";
import { requireAdmin, CANONICAL_SUPER_ADMIN_UUID } from "@/lib/auth/admin";
import { UserModerationActions } from "./components/UserModerationActions";

export const metadata = {
  title: "Student Management | DevPair Admin",
  description: "Search, inspect, and moderate registered student profiles and platform status.",
};

interface AdminUsersPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const adminContext = await requireAdmin();
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10) || 1;
  const search = params.search || "";

  const result = await getAdminUsersList({
    page,
    pageSize: 15,
    search,
  });

  const { data: users, total, totalPages } = result;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Student Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              {total} registered
            </span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Browse and inspect registered student profiles, technical skills, ban status, and moderation actions.
          </p>
        </div>

        {/* Search bar */}
        <form method="GET" action="/admin/users" className="flex items-center gap-2 max-w-sm w-full">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search name, college, username..."
            className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity"
          >
            Search
          </button>
          {search && (
            <Link
              href="/admin/users"
              className="px-2.5 py-2 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/75 text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="px-5 py-3.5">Student</th>
              <th className="px-4 py-3.5">Academic</th>
              <th className="px-4 py-3.5 text-center">Activity</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Role</th>
              <th className="px-4 py-3.5">Joined</th>
              <th className="px-5 py-3.5 text-right">Moderation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-zinc-400">
                  {search ? `No students found matching "${search}".` : "No registered students yet."}
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const joinedFormatted = new Date(u.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const isCanonical = u.id === CANONICAL_SUPER_ADMIN_UUID;

                return (
                  <tr key={u.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                    {/* Student Info */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                          {u.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={u.avatar_url} alt={u.full_name} className="w-full h-full object-cover" />
                          ) : (
                            u.full_name.charAt(0).toUpperCase() || "S"
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/profile/${u.username}`}
                            target="_blank"
                            className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors block truncate max-w-[160px]"
                          >
                            {u.full_name}
                          </Link>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <span className="font-mono">@{u.username}</span>
                            {u.email && (
                              <>
                                <span>&bull;</span>
                                <span className="truncate max-w-[140px]" title={u.email}>{u.email}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Academic */}
                    <td className="px-4 py-3.5 text-xs text-zinc-600 dark:text-zinc-300">
                      <div className="font-medium truncate max-w-[160px]">{u.college || "—"}</div>
                      <div className="text-zinc-400 truncate max-w-[160px]">
                        {u.course ? `${u.course}${u.graduation_year ? ` '` + u.graduation_year.toString().slice(-2) : ""}` : "—"}
                      </div>
                    </td>

                    {/* Activity (Skills, Projects, Applications) */}
                    <td className="px-4 py-3.5 text-center text-xs">
                      <div className="flex items-center justify-center gap-2">
                        <span title="Skills" className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {u.skillCount} sk
                        </span>
                        <span title="Projects Owned" className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                          {u.projectCount} pr
                        </span>
                        <span title="Applications" className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {u.applicationCount} ap
                        </span>
                      </div>
                    </td>

                    {/* Status (Active / Banned / Cooldown) */}
                    <td className="px-4 py-3.5 text-xs">
                      <div className="space-y-1">
                        {u.isBanned ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-900">
                              Banned
                            </span>
                            {u.banReason && (
                              <div className="text-[10px] text-zinc-400 max-w-[140px] truncate" title={u.banReason}>
                                {u.banReason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                            Active
                          </span>
                        )}

                        {u.activeCooldown && (
                          <div>
                            <span
                              title={`Cooldown active until ${new Date(u.activeCooldown.cooldownUntil).toLocaleString()}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 whitespace-nowrap"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <span>Cooldown Active</span>
                            </span>
                            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">
                              until {new Date(u.activeCooldown.cooldownUntil).toLocaleDateString([], { month: "short", day: "numeric" })} {new Date(u.activeCooldown.cooldownUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3.5">
                      {u.adminRole === "super_admin" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                          SUPER ADMIN
                        </span>
                      ) : u.isAdmin ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-900">
                          ADMIN
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          Student
                        </span>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3.5 text-xs text-zinc-400 whitespace-nowrap">
                      {joinedFormatted}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <UserModerationActions
                        userId={u.id}
                        username={u.username}
                        fullName={u.full_name}
                        isBanned={u.isBanned}
                        banReason={u.banReason}
                        isAdmin={u.isAdmin}
                        isViewerSuperAdmin={adminContext.isSuperAdmin}
                        isCanonical={isCanonical}
                        hasActiveCooldown={Boolean(u.activeCooldown)}
                        cooldownUntil={u.activeCooldown?.cooldownUntil || null}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Showing page <span className="font-semibold">{page}</span> of{" "}
            <span className="font-semibold">{totalPages}</span> ({total} total students)
          </div>

          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={`/admin/users?page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                &larr; Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/users?page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Next &rarr;
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
