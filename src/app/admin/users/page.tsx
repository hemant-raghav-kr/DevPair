import Link from "next/link";
import { getAdminUsersList } from "@/features/admin";

export const metadata = {
  title: "Student Management | DevPair Admin",
  description: "Search and inspect registered student profiles and activity.",
};

interface AdminUsersPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
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
            Browse and inspect registered student profiles, technical skills, and platform engagement.
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
              <th className="px-4 py-3.5">Academic Background</th>
              <th className="px-4 py-3.5 text-center">Skills</th>
              <th className="px-4 py-3.5 text-center">Projects</th>
              <th className="px-4 py-3.5 text-center">Applications</th>
              <th className="px-4 py-3.5">Role</th>
              <th className="px-5 py-3.5 text-right">Joined</th>
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
                            className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors block truncate"
                          >
                            {u.full_name}
                          </Link>
                          <span className="text-xs text-zinc-400 font-mono">@{u.username}</span>
                        </div>
                      </div>
                    </td>

                    {/* Academic */}
                    <td className="px-4 py-3.5 text-xs text-zinc-600 dark:text-zinc-300">
                      <div className="font-medium truncate max-w-[180px]">{u.college || "—"}</div>
                      <div className="text-zinc-400 truncate max-w-[180px]">
                        {u.course ? `${u.course}${u.graduation_year ? ` '` + u.graduation_year.toString().slice(-2) : ""}` : "—"}
                      </div>
                    </td>

                    {/* Skills count */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {u.skillCount}
                      </span>
                    </td>

                    {/* Projects owned */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                        {u.projectCount}
                      </span>
                    </td>

                    {/* Applications */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        {u.applicationCount}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3.5">
                      {u.isAdmin ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
                          ADMIN
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          Student
                        </span>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-3.5 text-right text-xs text-zinc-400 whitespace-nowrap">
                      {joinedFormatted}
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
