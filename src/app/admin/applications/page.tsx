import Link from "next/link";
import { getAdminApplicationsList } from "@/features/admin";

export const metadata = {
  title: "Application Activity | DevPair Admin",
  description: "Inspect collaborative join requests and application pipeline states across DevPair.",
};

interface AdminApplicationsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function AdminApplicationsPage({ searchParams }: AdminApplicationsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10) || 1;
  const search = params.search || "";
  const status = params.status || "all";

  const result = await getAdminApplicationsList({
    page,
    pageSize: 15,
    search,
    status,
  });

  const { data: applications, total, totalPages } = result;

  const statusTabs = [
    { id: "all", label: "All Requests" },
    { id: "pending", label: "Pending" },
    { id: "accepted", label: "Accepted" },
    { id: "rejected", label: "Rejected" },
    { id: "withdrawn", label: "Withdrawn" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Join Request Activity
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
              {total} total
            </span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Real-time feed of students applying to join peer projects and collaborative roles.
          </p>
        </div>

        {/* Search */}
        <form method="GET" action="/admin/applications" className="flex items-center gap-2 max-w-sm w-full">
          <input type="hidden" name="status" value={status} />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search application messages..."
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
              href={`/admin/applications?status=${status}`}
              className="px-2.5 py-2 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        {statusTabs.map((tab) => (
          <Link
            key={tab.id}
            href={`/admin/applications?status=${tab.id}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
              status === tab.id
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Applications Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/75 text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="px-5 py-3.5">Applicant</th>
              <th className="px-4 py-3.5">Target Project</th>
              <th className="px-4 py-3.5">Target Role</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Application Message</th>
              <th className="px-5 py-3.5 text-right">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {applications.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-zinc-400">
                  No applications found matching the filter criteria.
                </td>
              </tr>
            ) : (
              applications.map((app) => {
                const dateFormatted = new Date(app.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <tr key={app.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                    {/* Applicant */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                          {app.applicant.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={app.applicant.avatar_url} alt={app.applicant.full_name} className="w-full h-full object-cover" />
                          ) : (
                            app.applicant.full_name.charAt(0).toUpperCase() || "A"
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/profile/${app.applicant.username}`}
                            target="_blank"
                            className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors block truncate"
                          >
                            {app.applicant.full_name}
                          </Link>
                          <span className="text-xs text-zinc-400 font-mono">@{app.applicant.username}</span>
                        </div>
                      </div>
                    </td>

                    {/* Target Project */}
                    <td className="px-4 py-3.5 text-xs">
                      <Link
                        href={`/projects/${app.project.id}`}
                        target="_blank"
                        className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 block truncate max-w-[180px]"
                      >
                        {app.project.title}
                      </Link>
                      <span className="text-zinc-400 truncate block max-w-[180px]">
                        Owner: {app.projectOwner.full_name}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3.5 text-xs">
                      {app.role ? (
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          {app.role.title}
                        </span>
                      ) : (
                        <span className="text-zinc-400 italic">General / Any</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          app.status === "accepted"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : app.status === "pending"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : app.status === "rejected"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>

                    {/* Message */}
                    <td className="px-4 py-3.5 text-xs text-zinc-600 dark:text-zinc-400 max-w-xs">
                      <p className="line-clamp-2" title={app.message}>
                        {app.message || "—"}
                      </p>
                    </td>

                    {/* Submitted Date */}
                    <td className="px-5 py-3.5 text-right text-xs text-zinc-400 whitespace-nowrap">
                      {dateFormatted}
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
            Page <span className="font-semibold">{page}</span> of{" "}
            <span className="font-semibold">{totalPages}</span> ({total} total requests)
          </div>

          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={`/admin/applications?page=${page - 1}&status=${status}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                &larr; Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/applications?page=${page + 1}&status=${status}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
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
