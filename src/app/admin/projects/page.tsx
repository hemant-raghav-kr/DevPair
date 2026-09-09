import Link from "next/link";
import { getAdminProjectsList } from "@/features/admin/queries";

export const metadata = {
  title: "Project Management | DevPair Admin",
  description: "Monitor and moderate platform collaborative projects.",
};

interface AdminProjectsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    hackathon?: string;
    visibility?: string;
  }>;
}

export default async function AdminProjectsPage({ searchParams }: AdminProjectsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10) || 1;
  const search = params.search || "";
  const status = params.status || "all";
  const hackathon = params.hackathon || "all";
  const visibility = params.visibility || "all";

  const result = await getAdminProjectsList({
    page,
    pageSize: 15,
    search,
    status,
    hackathon,
    visibility,
  });

  const { data: projects, total, totalPages } = result;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Project Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
              {total} projects
            </span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Review and moderate public and private collaborative projects, roles, and open slots.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <form method="GET" action="/admin/projects" className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-wrap items-center gap-3">
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Search by title or category..."
          className="flex-1 min-w-[200px] px-3.5 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />

        {/* Status Filter */}
        <select
          name="status"
          defaultValue={status}
          className="px-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <option value="all">All Statuses</option>
          <option value="recruiting">Recruiting</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        {/* Hackathon Filter */}
        <select
          name="hackathon"
          defaultValue={hackathon}
          className="px-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <option value="all">All Types</option>
          <option value="true">Hackathon Only</option>
          <option value="false">Non-Hackathon</option>
        </select>

        {/* Visibility Filter */}
        <select
          name="visibility"
          defaultValue={visibility}
          className="px-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <option value="all">All Visibilities</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>

        <button
          type="submit"
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity"
        >
          Filter
        </button>

        {(search || status !== "all" || hackathon !== "all" || visibility !== "all") && (
          <Link
            href="/admin/projects"
            className="px-3 py-2 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            Reset
          </Link>
        )}
      </form>

      {/* Projects Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/75 text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="px-5 py-3.5">Project</th>
              <th className="px-4 py-3.5">Owner</th>
              <th className="px-4 py-3.5">Category</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-center">Roles / Slots</th>
              <th className="px-4 py-3.5">Badges</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-zinc-400">
                  No projects matching the current filter criteria.
                </td>
              </tr>
            ) : (
              projects.map((p) => {
                return (
                  <tr key={p.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                    {/* Project Info */}
                    <td className="px-5 py-3.5">
                      <div className="min-w-0 max-w-xs sm:max-w-sm">
                        <Link
                          href={`/projects/${p.id}`}
                          target="_blank"
                          className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors block truncate"
                        >
                          {p.title}
                        </Link>
                        {p.tagline && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                            {p.tagline}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Owner */}
                    <td className="px-4 py-3.5 text-xs">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">
                        {p.owner.full_name}
                      </div>
                      <div className="text-zinc-400 font-mono">@{p.owner.username}</div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 capitalize">
                        {p.category}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          p.status === "recruiting"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : p.status === "in_progress"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        {p.status.replace("_", " ")}
                      </span>
                    </td>

                    {/* Roles & Slots */}
                    <td className="px-4 py-3.5 text-center text-xs">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {p.roleCount} roles
                      </span>
                      <span className="text-zinc-400 block text-[11px]">
                        {p.slotsTotal} slots
                      </span>
                    </td>

                    {/* Badges */}
                    <td className="px-4 py-3.5 space-x-1.5 whitespace-nowrap">
                      {p.is_hackathon && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          Hackathon
                        </span>
                      )}
                      {p.visibility === "private" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          Private
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <Link
                        href={`/projects/${p.id}`}
                        target="_blank"
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Inspect &rarr;
                      </Link>
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
            <span className="font-semibold">{totalPages}</span> ({total} total projects)
          </div>

          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={`/admin/projects?page=${page - 1}&status=${status}&hackathon=${hackathon}&visibility=${visibility}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                &larr; Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/projects?page=${page + 1}&status=${status}&hackathon=${hackathon}&visibility=${visibility}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
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
