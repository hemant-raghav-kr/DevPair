import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkIsBanned } from "@/lib/auth/admin";
import { ReportModal } from "@/features/complaints/components/ReportModal";

export const metadata = {
  title: "Submit a Report | DevPair",
  description: "Report inappropriate conduct, platform abuse, or submit feedback to DevPair moderators.",
};

export default async function NewComplaintPage({
  searchParams,
}: {
  searchParams: Promise<{ target?: string; username?: string; project?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/complaints/new");
  }

  const banStatus = await checkIsBanned(user.id);
  if (banStatus.banned) {
    redirect("/banned");
  }

  const params = await searchParams;
  const targetUsername = params.username;
  const targetProjectId = params.project;

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <Link
            href="/complaints"
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 inline-flex items-center gap-1 mb-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to My Complaints</span>
          </Link>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            Report an Issue or Policy Violation
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Help keep DevPair a safe, collaborative space. All submissions are investigated by our administration team.
          </p>
        </div>

        {/* Inline Dialog Container */}
        <div className="relative">
          <ReportModal
            isOpen={true}
            onClose={() => redirect("/complaints")}
            targetType={targetUsername ? "user" : targetProjectId ? "project" : "general"}
            targetTitle={targetUsername ? `@${targetUsername}` : targetProjectId ? "Selected Project" : undefined}
            reportedUsername={targetUsername}
            reportedProjectId={targetProjectId}
          />
        </div>
      </div>
    </div>
  );
}
