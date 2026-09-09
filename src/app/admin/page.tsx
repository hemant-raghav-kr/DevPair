import Link from "next/link";
import { getAdminOverviewMetrics } from "@/features/admin/queries";
import { getAdminComplaintStats, getRecentAdminComplaints } from "@/features/complaints/queries";
import { ComplaintStatusBadge } from "@/features/complaints/components/ComplaintStatusBadge";
import { ComplaintPriorityBadge } from "@/features/complaints/components/ComplaintPriorityBadge";

export const metadata = {
  title: "Admin Overview | DevPair",
  description: "High-level platform health, engagement metrics, and operational statistics.",
};

export default async function AdminOverviewPage() {
  const [metrics, complaintStats, recentComplaints] = await Promise.all([
    getAdminOverviewMetrics(),
    getAdminComplaintStats(),
    getRecentAdminComplaints(5),
  ]);

  const acceptanceRate = metrics.totalApplications > 0
    ? Math.round((metrics.acceptedApplications / metrics.totalApplications) * 100)
    : 0;

  const hackathonPct = metrics.totalProjects > 0
    ? Math.round((metrics.hackathonProjects / metrics.totalProjects) * 100)
    : 0;

  const pendingPct = metrics.totalApplications > 0
    ? Math.round((metrics.pendingApplications / metrics.totalApplications) * 100)
    : 0;
  const acceptedPct = metrics.totalApplications > 0
    ? Math.round((metrics.acceptedApplications / metrics.totalApplications) * 100)
    : 0;
  const rejectedPct = metrics.totalApplications > 0
    ? Math.round((metrics.rejectedApplications / metrics.totalApplications) * 100)
    : 0;
  const withdrawnPct = metrics.totalApplications > 0
    ? Math.round((metrics.withdrawnApplications / metrics.totalApplications) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Platform Overview
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Live Database
            </span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Real-time operational statistics and ecosystem activity across DevPair.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/users"
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Students &rarr;
          </Link>
          <Link
            href="/admin/projects"
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Projects &rarr;
          </Link>
          <Link
            href="/admin/applications"
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Applications &rarr;
          </Link>
          <Link
            href="/admin/complaints"
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>Complaints</span>
            {complaintStats.pending > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-zinc-950 text-white text-[10px] font-black">
                {complaintStats.pending}
              </span>
            )}
            <span>&rarr;</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Students */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Students
            </span>
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </span>
          </div>
          <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-3">
            {metrics.totalUsers}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              +{metrics.recentUsers}
            </span>{" "}
            joined in the last 7 days
          </p>
        </div>

        {/* Card 2: Total Projects */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Projects
            </span>
            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </span>
          </div>
          <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-3">
            {metrics.totalProjects}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {metrics.publicProjects} public &bull; {metrics.totalProjects - metrics.publicProjects} private
          </p>
        </div>

        {/* Card 3: Recruiting Projects */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Recruiting Openings
            </span>
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
          </div>
          <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-3">
            {metrics.recruitingProjects}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {metrics.completedProjects} completed projects
          </p>
        </div>

        {/* Card 4: Applications Total */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Applications
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-3">
            {metrics.totalApplications}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {acceptanceRate}%
            </span>{" "}
            acceptance rate
          </p>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Status Funnel */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Application Pipeline Distribution
            </h3>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {metrics.totalApplications} total requests
            </span>
          </div>

          {/* Stacked Progress Bar */}
          <div className="w-full h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex">
            {metrics.totalApplications > 0 ? (
              <>
                <div
                  style={{ width: `${pendingPct}%` }}
                  className="bg-amber-400 h-full"
                  title={`Pending: ${metrics.pendingApplications} (${pendingPct}%)`}
                />
                <div
                  style={{ width: `${acceptedPct}%` }}
                  className="bg-emerald-500 h-full"
                  title={`Accepted: ${metrics.acceptedApplications} (${acceptedPct}%)`}
                />
                <div
                  style={{ width: `${rejectedPct}%` }}
                  className="bg-rose-500 h-full"
                  title={`Rejected: ${metrics.rejectedApplications} (${rejectedPct}%)`}
                />
                <div
                  style={{ width: `${withdrawnPct}%` }}
                  className="bg-zinc-400 h-full"
                  title={`Withdrawn: ${metrics.withdrawnApplications} (${withdrawnPct}%)`}
                />
              </>
            ) : (
              <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800" />
            )}
          </div>

          {/* Legend Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                <span>Pending</span>
              </div>
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {metrics.pendingApplications}
              </div>
              <div className="text-[10px] text-zinc-400">{pendingPct}%</div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Accepted</span>
              </div>
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {metrics.acceptedApplications}
              </div>
              <div className="text-[10px] text-zinc-400">{acceptedPct}%</div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <span>Rejected</span>
              </div>
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {metrics.rejectedApplications}
              </div>
              <div className="text-[10px] text-zinc-400">{rejectedPct}%</div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 shrink-0" />
                <span>Withdrawn</span>
              </div>
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {metrics.withdrawnApplications}
              </div>
              <div className="text-[10px] text-zinc-400">{withdrawnPct}%</div>
            </div>
          </div>
        </div>

        {/* Projects by Category Breakdown */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Projects by Domain & Focus
            </h3>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
              {metrics.hackathonProjects} Hackathons ({hackathonPct}%)
            </span>
          </div>

          <div className="space-y-3">
            {metrics.projectsByCategory.length === 0 ? (
              <p className="text-sm text-zinc-400 py-6 text-center">
                No projects registered in database yet.
              </p>
            ) : (
              metrics.projectsByCategory.slice(0, 5).map(({ category, count }) => {
                const pct = metrics.totalProjects > 0
                  ? Math.round((count / metrics.totalProjects) * 100)
                  : 0;

                return (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium capitalize text-zinc-700 dark:text-zinc-300">
                        {category}
                      </span>
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-blue-600 rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Moderation & Complaints Section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Student Complaints & Moderation
              </h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Active moderation queue, priority misconduct reports, and resolution statistics.
            </p>
          </div>

          <Link
            href="/admin/complaints"
            className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-bold transition-colors shadow-sm inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <span>View All Complaints ({complaintStats.total})</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {/* Moderation Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-1">
              Pending Review
            </span>
            <span className="text-2xl font-black text-amber-800 dark:text-amber-300">
              {complaintStats.pending}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block mb-1">
              Under Review
            </span>
            <span className="text-2xl font-black text-blue-800 dark:text-blue-300">
              {complaintStats.underReview}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400 block mb-1">
              Urgent / Critical
            </span>
            <span className="text-2xl font-black text-red-800 dark:text-red-300">
              {complaintStats.activeUrgent}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-1">
              Resolved
            </span>
            <span className="text-2xl font-black text-emerald-800 dark:text-emerald-300">
              {complaintStats.resolved}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">
              Total Reports
            </span>
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {complaintStats.total}
            </span>
          </div>
        </div>

        {/* Recent Complaints Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Recent Moderation Inquiries
            </h3>
            <span className="text-xs text-zinc-400">Top {recentComplaints.length} reports</span>
          </div>

          {recentComplaints.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
              Queue Clear &mdash; No platform complaints filed.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-100 dark:border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-100 dark:border-zinc-800 font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5">Ref / Priority</th>
                    <th className="px-4 py-2.5">Category & Subject</th>
                    <th className="px-4 py-2.5">Reporter</th>
                    <th className="px-4 py-2.5">Target</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {recentComplaints.map((c) => {
                    const refCode = `#CP-${c.id.substring(0, 8).toUpperCase()}`;
                    return (
                      <tr key={c.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                              {refCode}
                            </span>
                            <div>
                              <ComplaintPriorityBadge priority={c.priority} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <span className="text-[10px] font-semibold uppercase text-zinc-400 block">
                            {c.category.replace(/_/g, " ")}
                          </span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate block">
                            {c.subject}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                          {c.reporterUsername ? `@${c.reporterUsername}` : c.reporterName || "Student"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {c.reportedUserUsername ? (
                            <span className="text-purple-600 dark:text-purple-400 font-medium">
                              @{c.reportedUserUsername}
                            </span>
                          ) : c.reportedProjectTitle ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium truncate max-w-[130px] block">
                              {c.reportedProjectTitle}
                            </span>
                          ) : (
                            <span className="text-zinc-400 italic">General</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <ComplaintStatusBadge status={c.status} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <Link
                            href={`/admin/complaints/${c.id}`}
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-colors"
                          >
                            Review &rarr;
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link
          href="/admin/users"
          className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm transition-all group"
        >
          <div className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-between">
            <span>Student Management</span>
            <span>&rarr;</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Search registered students, inspect colleges, technical skills, and participation.
          </p>
        </Link>

        <Link
          href="/admin/projects"
          className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm transition-all group"
        >
          <div className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 flex items-center justify-between">
            <span>Project Moderation</span>
            <span>&rarr;</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Review public projects, recruiting status, technical roles, and open slots.
          </p>
        </Link>

        <Link
          href="/admin/applications"
          className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm transition-all group"
        >
          <div className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-400 flex items-center justify-between">
            <span>Join Request Activity</span>
            <span>&rarr;</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Track student join requests, owner response rates, and application outcomes.
          </p>
        </Link>

        <Link
          href="/admin/complaints"
          className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm transition-all group"
        >
          <div className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 flex items-center justify-between">
            <span>Moderation & Reports</span>
            <span>&rarr;</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Investigate student reports, issue disciplinary bans, and resolve student disputes.
          </p>
        </Link>
      </div>
    </div>
  );
}
