import { requireAdmin } from "@/lib/auth/admin";
import { getAdminComplaints, getAdminComplaintStats } from "@/features/complaints/queries";
import { AdminComplaintsTable } from "@/features/complaints/components/AdminComplaintsTable";

export const metadata = {
  title: "Complaints & Moderation Queue | DevPair Admin",
  description: "Investigate and resolve student reports, misconduct allegations, and platform violations.",
};

interface AdminComplaintsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    priority?: string;
    category?: string;
    sort?: "newest" | "oldest";
  }>;
}

export default async function AdminComplaintsPage({ searchParams }: AdminComplaintsPageProps) {
  await requireAdmin();
  const params = await searchParams;

  const page = parseInt(params.page || "1", 10) || 1;
  const search = params.search || "";
  const status = params.status || "all";
  const priority = params.priority || "all";
  const category = params.category || "all";
  const sort = params.sort || "newest";

  const [stats, result] = await Promise.all([
    getAdminComplaintStats(),
    getAdminComplaints({
      page,
      pageSize: 15,
      search,
      status,
      priority,
      category,
      sort,
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
          Complaints & Moderation Queue
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Review, investigate, and take action on student-submitted misconduct reports and platform issues.
        </p>
      </div>

      {/* Metrics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium block mb-1">
            Total Reports
          </span>
          <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {stats.total}
          </span>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium block mb-1">
            Pending Review
          </span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats.pending}
          </span>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium block mb-1">
            Under Investigation
          </span>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {stats.underReview}
          </span>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium block mb-1">
            Resolved
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.resolved}
          </span>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-xs text-red-600 dark:text-red-400 font-medium block mb-1">
            Urgent / Critical
          </span>
          <span className="text-2xl font-black text-red-600 dark:text-red-400">
            {stats.activeUrgent}
          </span>
        </div>
      </div>

      {/* Main Queue Table */}
      <AdminComplaintsTable initialResult={result} />
    </div>
  );
}
